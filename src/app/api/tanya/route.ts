import Anthropic from "@anthropic-ai/sdk";

import { planAnswer, SYSTEM_PROMPT } from "@/lib/ai/context";
import {
  budgetRemaining,
  cacheGet,
  cacheKey,
  cacheSet,
  callerIp,
  checkRateGlobal,
  claimBudget,
  refundBudget,
} from "@/lib/ai/guard";
import type { Answer, Jawaban } from "@/lib/assistant";

export const runtime = "nodejs";

/** Model default. Haiku cukup karena jawabannya sudah tersedia di konteks. */
const DEFAULT_MODEL = "claude-haiku-4-5";

/** Batas keluaran. Jawaban yang baik di sini tidak pernah sepanjang ini. */
const MAX_OUTPUT_TOKENS = 400;

const MAX_QUESTION_CHARS = 300;

/** Bentuk jawaban yang dikirim ke panel chat. */
type Reply = {
  text: string;
  /** Dari mana jawaban ini berasal — dipakai untuk telemetri sederhana. */
  via: "cache" | "data" | "model" | "tidak-tahu";
  answer?: Pick<
    Answer,
    "id" | "kind" | "title" | "href" | "hrefLabel" | "source"
  >;
  related?: { id: string; title: string }[];
  /** Topik terdekat yang bisa dicoba, saat pertanyaannya tidak ketemu. */
  saran?: string[];
};

function slim(answer: Answer): NonNullable<Reply["answer"]> {
  return {
    id: answer.id,
    kind: answer.kind,
    title: answer.title,
    href: answer.href,
    hrefLabel: answer.hrefLabel,
    source: answer.source,
  };
}

/** Menjadikan jawaban rakitan mesin pencari sebagai balasan siap kirim. */
function dariData(jawaban: Jawaban, via: Reply["via"] = "data"): Reply {
  return {
    text: jawaban.teks,
    via,
    answer: jawaban.utama ? slim(jawaban.utama) : undefined,
    related: jawaban.terkait,
    saran: jawaban.saran,
  };
}

function json(body: Reply | { error: string }, init?: ResponseInit) {
  return Response.json(body, init);
}

export async function POST(request: Request) {
  // 1. Validasi masukan
  let question: string;
  try {
    const body = (await request.json()) as { question?: unknown };
    question = typeof body.question === "string" ? body.question.trim() : "";
  } catch {
    return json({ error: "Format permintaan tidak dikenali." }, { status: 400 });
  }

  if (question.length < 2) {
    return json({ error: "Pertanyaannya terlalu pendek." }, { status: 400 });
  }
  if (question.length > MAX_QUESTION_CHARS) {
    return json(
      { error: `Pertanyaan maksimal ${MAX_QUESTION_CHARS} karakter.` },
      { status: 400 },
    );
  }

  // 2. Rate limit — terdistribusi lewat Redis (cadangan: in-memory)
  const rate = await checkRateGlobal(callerIp(request));
  if (!rate.allowed) {
    return json(
      { error: "Terlalu banyak pertanyaan dalam waktu singkat. Coba lagi sebentar lagi." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
    );
  }

  // 3. Cache — pertanyaan yang sama tidak pernah dibayar dua kali
  const key = cacheKey(question);
  const cached = cacheGet<Reply>(key);
  if (cached) return json({ ...cached, via: "cache" });

  // 4. Tentukan jalur termurah yang masih benar
  const plan = planAnswer(question);

  if (plan.route === "tidak-tahu") {
    const reply = dariData(plan.jawaban, "tidak-tahu");
    cacheSet(key, reply);
    return json(reply);
  }

  if (plan.route === "langsung") {
    const reply = dariData(plan.jawaban);
    cacheSet(key, reply);
    return json(reply);
  }

  // 5. Perlu model. Kalau tidak tersedia, sajikan rakitan mesin pencari.
  const fallback = dariData(plan.cadangan);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json(fallback);

  if (!claimBudget()) {
    // Jatah harian habis — tetap menjawab, hanya tanpa perapian dari model.
    return json(fallback);
  }

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: process.env.ASISTEN_MODEL || DEFAULT_MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `BAHAN:\n${plan.context}\n\nPERTANYAAN: ${question}`,
        },
      ],
    });

    if (message.stop_reason === "refusal") {
      return json(fallback);
    }

    const text = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    if (!text) return json(fallback);

    const reply: Reply = { ...fallback, text, via: "model" };
    cacheSet(key, reply);
    return json(reply);
  } catch {
    // Kegagalan model tidak boleh terasa oleh pengguna — sajikan data mentahnya.
    refundBudget();
    return json(fallback);
  }
}

/** Cek kesehatan ringan: apakah kunci terpasang dan berapa sisa jatah hari ini. */
export async function GET() {
  return Response.json({
    kunciTerpasang: Boolean(process.env.ANTHROPIC_API_KEY),
    model: process.env.ASISTEN_MODEL || DEFAULT_MODEL,
    sisaJatahHariIni: budgetRemaining(),
  });
}
