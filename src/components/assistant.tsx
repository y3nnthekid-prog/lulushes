"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, MessageCircle, Send, Sparkles, X } from "lucide-react";

import { SourceBadge } from "@/components/source-badge";
import { Button } from "@/components/ui/button";
import { starterQuestions } from "@/lib/pertanyaan-pembuka";
import { cn } from "@/lib/utils";
import type { Answer } from "@/lib/assistant";

/** Rujukan halaman sumber yang ditempelkan di bawah jawaban. */
type Cite = Pick<Answer, "id" | "kind" | "title" | "href" | "hrefLabel" | "source">;

type Related = { id: string; title: string };

type Balasan = {
  text: string;
  answer?: Cite;
  related?: Related[];
  /** Topik terdekat saat pertanyaannya tidak ketemu. */
  saran?: string[];
};

type Message =
  | { id: string; role: "user"; text: string }
  | ({ id: string; role: "bot" } & Balasan);

type ApiReply = Balasan & {
  via: "cache" | "data" | "model" | "tidak-tahu";
};

const greeting: Message = {
  id: "greet",
  role: "bot",
  text: "Halo! Tanya apa saja soal alur kelulusan HES. Aku menjawab dari data yang ada di website ini — kalau aku tidak tahu, aku bilang tidak tahu.",
};

let counter = 0;
const nextId = () => `m${++counter}`;

/**
 * Jawaban cadangan yang dihitung di browser.
 *
 * Dipakai kalau route server tidak bisa dihubungi. Penyusunnya sama persis
 * dengan yang dipakai server, jadi asisten tetap menjawab benar walau tanpa
 * jaringan — hanya kalimatnya apa adanya, tidak dirapikan model.
 *
 * Mesinnya diimpor DI DALAM fungsi, bukan di puncak berkas. Impor statis
 * menyeret seluruh basis pengetahuan — 231 entri beserta stages.json,
 * faq.json, dan downloads.json — ke bundel setiap halaman, dan lebih mahal
 * lagi: entrinya dirakit di module scope, jadi peramban membangunnya sebelum
 * siapa pun membuka asisten. Terukur 22 KB gzip dan 341 milidetik long task
 * di desktop; di ponsel kelas menengah 1,4–2 detik main thread terkunci.
 *
 * Dibayar oleh semua orang, untuk jalur yang hanya menyala ketika servernya
 * tak terjangkau. Sekarang ongkosnya dibayar saat itu benar-benar terjadi.
 */
async function localAnswer(question: string): Promise<Balasan> {
  const { susunJawaban } = await import("@/lib/assistant");
  const jawaban = susunJawaban(question);
  return {
    text: jawaban.teks,
    answer: jawaban.utama,
    related: jawaban.terkait,
    saran: jawaban.saran,
  };
}

/**
 * Pertanyaan sambungan yang tidak menyebut topiknya sama sekali.
 *
 * Diketik orang yang sedang membaca jawaban sebelumnya, jadi rujukannya ada
 * di layar, bukan di kalimatnya. Tanpa penanganan ini "terus?" selalu berakhir
 * dengan "aku belum punya jawabannya".
 */
const POLA_SAMBUNGAN =
  /^(terus|trus|lalu|habis itu|abis itu|setelah itu|sesudah itu|next|lanjut|lanjutnya|terus apa|abis gitu)\s*\??$/;

export function Assistant() {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState<Message[]>([greeting]);
  const [pending, setPending] = React.useState(false);

  const listRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  /** Judul entri terakhir yang dijawab, untuk menyambung "terus?". */
  const terakhirRef = React.useRef<string | null>(null);

  // Gulirkan ke pesan terbaru setiap kali percakapan bertambah.
  React.useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, open, pending]);

  const ask = React.useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || pending) return;

      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "user", text: trimmed },
      ]);
      setInput("");
      setPending(true);
      inputRef.current?.focus();

      // Pertanyaan sambungan dilengkapi dulu dengan topik yang barusan
      // dibahas, supaya mesin punya bahan untuk dicari.
      const sebelumnya = terakhirRef.current;
      const dikirim =
        sebelumnya && POLA_SAMBUNGAN.test(trimmed.toLowerCase())
          ? `Setelah ${sebelumnya}, apa langkah berikutnya?`
          : trimmed;

      let reply: Balasan;
      try {
        const response = await fetch("/api/tanya", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: dikirim }),
        });

        if (response.status === 429) {
          const body = (await response.json()) as { error?: string };
          reply = {
            text:
              body.error ??
              "Terlalu banyak pertanyaan dalam waktu singkat. Coba lagi sebentar lagi.",
          };
        } else if (!response.ok) {
          reply = await localAnswer(dikirim);
        } else {
          const body = (await response.json()) as ApiReply;
          reply = {
            text: body.text,
            answer: body.answer,
            related: body.related,
            saran: body.saran,
          };
        }
      } catch {
        // Jaringan putus atau route belum ada — hitung sendiri di browser.
        reply = await localAnswer(dikirim);
      }

      if (reply.answer) terakhirRef.current = reply.answer.title;

      setMessages((prev) => [...prev, { id: nextId(), role: "bot", ...reply }]);
      setPending(false);
    },
    [pending],
  );

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") setOpen(false);
  }

  return (
    <>
      {/* Tombol pemicu */}
      <Button
        size="lg"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="asisten-panel"
        className={cn(
          "fixed right-4 bottom-4 z-50 gap-2 rounded-full shadow-lg",
          "bg-brand text-brand-foreground hover:bg-brand/90",
          open && "sm:hidden",
        )}
      >
        {open ? (
          <X aria-hidden />
        ) : (
          <>
            <MessageCircle aria-hidden />
            Tanya
          </>
        )}
        <span className="sr-only">
          {open ? "Tutup asisten" : "Buka asisten tanya jawab"}
        </span>
      </Button>

      {open && (
        <div
          id="asisten-panel"
          role="dialog"
          aria-label="Asisten tanya jawab Lulus HES"
          onKeyDown={onKeyDown}
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl",
            "inset-x-3 bottom-20 top-20",
            "sm:inset-auto sm:right-4 sm:bottom-4 sm:top-auto sm:h-[min(34rem,80vh)] sm:w-96",
          )}
        >
          {/* Kepala */}
          <div className="flex items-center gap-2.5 border-b bg-brand-soft px-4 py-3">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
              <Sparkles className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-sm font-semibold">Tanya Lulus HES</p>
              <p className="text-xs text-muted-foreground">
                Menjawab dari data website ini
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setOpen(false)}
              aria-label="Tutup asisten"
            >
              <X aria-hidden />
            </Button>
          </div>

          {/* Percakapan */}
          <div
            ref={listRef}
            role="log"
            aria-live="polite"
            aria-label="Percakapan"
            className="flex-1 space-y-3 overflow-y-auto p-3"
          >
            {messages.map((message) =>
              message.role === "user" ? (
                <p
                  key={message.id}
                  className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-brand px-3 py-2 text-sm text-brand-foreground"
                >
                  {message.text}
                </p>
              ) : (
                <div key={message.id} className="max-w-[92%]">
                  <div className="rounded-2xl rounded-bl-sm bg-muted px-3 py-2.5">
                    {message.answer && (
                      <p className="mb-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-brand/12 px-2 py-0.5 text-[11px] font-medium text-brand">
                          {message.answer.kind}
                        </span>
                        {message.answer.source && (
                          <SourceBadge source={message.answer.source} />
                        )}
                      </p>
                    )}

                    {message.answer && (
                      <p className="mb-1 font-heading text-sm font-semibold">
                        {message.answer.title}
                      </p>
                    )}

                    <p className="text-sm whitespace-pre-line text-muted-foreground">
                      {message.text}
                    </p>

                    {message.answer?.href && (
                      <Link
                        href={message.answer.href}
                        onClick={() => setOpen(false)}
                        className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand underline-offset-4 hover:underline"
                      >
                        {message.answer.hrefLabel ?? "Buka halamannya"}
                        <ArrowRight className="size-3.5" aria-hidden />
                      </Link>
                    )}
                  </div>

                  {message.related && message.related.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {message.related.map((rel) => (
                        <button
                          key={rel.id}
                          type="button"
                          onClick={() => ask(rel.title)}
                          className="rounded-full border px-2.5 py-1 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          {rel.title}
                        </button>
                      ))}
                    </div>
                  )}

                  {message.saran && message.saran.length > 0 && (
                    <div className="mt-2">
                      <p className="mb-1.5 text-xs text-muted-foreground">
                        Mungkin yang kamu cari:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {message.saran.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => ask(s)}
                            className="rounded-full border border-brand/25 bg-brand-soft px-2.5 py-1 text-left text-xs font-medium text-brand transition-colors hover:bg-brand/12"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ),
            )}

            {pending && (
              <p
                className="w-fit rounded-2xl rounded-bl-sm bg-muted px-3 py-2.5 text-sm text-muted-foreground"
                aria-label="Sedang menyiapkan jawaban"
              >
                <span className="inline-flex gap-1">
                  <span className="size-1.5 animate-bounce rounded-full bg-brand [animation-delay:-0.3s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-brand [animation-delay:-0.15s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-brand" />
                </span>
              </p>
            )}

            {messages.length === 1 && !pending && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {starterQuestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => ask(q)}
                    className="rounded-full border border-brand/25 bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand transition-colors hover:bg-brand/12"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Masukan */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void ask(input);
            }}
            className="flex items-center gap-2 border-t p-2.5"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Tulis pertanyaanmu…"
              aria-label="Pertanyaan"
              autoComplete="off"
              maxLength={300}
              className="h-9 min-w-0 flex-1 rounded-lg border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || pending}
              aria-label="Kirim pertanyaan"
            >
              <Send aria-hidden />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
