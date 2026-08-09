/**
 * Penjaga biaya untuk asisten.
 *
 * Tiga lapis, dari yang paling murah:
 *   1. Cache jawaban  — pertanyaan yang sama tidak pernah dikirim dua kali.
 *   2. Rate limit     — satu alamat IP tidak bisa menghantam endpoint.
 *   3. Budget harian  — batas jumlah panggilan model per hari.
 *
 * PENTING: semuanya disimpan di memori proses. Di Vercel, fungsi serverless
 * bisa berjalan pada beberapa instance sekaligus dan memorinya hilang saat
 * instance dingin — jadi penjaga ini efektif untuk pemakaian normal dan
 * serangan dari satu sumber, tetapi BUKAN batas keras. Batas keras yang
 * sesungguhnya adalah spend limit di Console Anthropic.
 */

import { batasiLaju } from "@/lib/redis";

const MINUTE = 60_000;

/* ---------------------------------------------------------------- */
/* Rate limit per IP — jendela geser                                  */
/* ---------------------------------------------------------------- */

const WINDOW_MS = 10 * MINUTE;
const MAX_REQUESTS_PER_WINDOW = 20;

const hits = new Map<string, number[]>();

export type RateVerdict = {
  allowed: boolean;
  /** Detik yang harus ditunggu sebelum boleh mencoba lagi. */
  retryAfter: number;
  remaining: number;
};

export function checkRate(ip: string): RateVerdict {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = recent[0];
    hits.set(ip, recent);
    return {
      allowed: false,
      retryAfter: Math.ceil((WINDOW_MS - (now - oldest)) / 1000),
      remaining: 0,
    };
  }

  recent.push(now);
  hits.set(ip, recent);

  // Buang entri lama agar Map tidak tumbuh tanpa batas.
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }

  return {
    allowed: true,
    retryAfter: 0,
    remaining: MAX_REQUESTS_PER_WINDOW - recent.length,
  };
}

/**
 * Rate limit yang lebih kuat: coba Redis (dibagi lintas instance) dulu, dan
 * hanya jatuh ke penjaga in-memory bila Redis belum terpasang atau tidak
 * menjawab. Inilah yang dipakai endpoint mahal (asisten AI).
 */
export async function checkRateGlobal(ip: string): Promise<RateVerdict> {
  const global = await batasiLaju(ip, {
    batas: MAX_REQUESTS_PER_WINDOW,
    jendelaMs: WINDOW_MS,
    prefiks: "laju:tanya",
  });
  return global ?? checkRate(ip);
}

/* ---------------------------------------------------------------- */
/* Budget harian panggilan model                                      */
/* ---------------------------------------------------------------- */

const DEFAULT_DAILY_LIMIT = 150;

function dailyLimit(): number {
  const raw = Number(process.env.ASISTEN_LIMIT_HARIAN);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_DAILY_LIMIT;
}

let budgetDay = "";
let budgetUsed = 0;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Sisa jatah panggilan model hari ini. */
export function budgetRemaining(): number {
  if (budgetDay !== today()) return dailyLimit();
  return Math.max(0, dailyLimit() - budgetUsed);
}

/** Ambil satu jatah panggilan model. False berarti jatah hari ini habis. */
export function claimBudget(): boolean {
  const day = today();
  if (budgetDay !== day) {
    budgetDay = day;
    budgetUsed = 0;
  }
  if (budgetUsed >= dailyLimit()) return false;
  budgetUsed++;
  return true;
}

/** Kembalikan jatah bila panggilan model ternyata gagal. */
export function refundBudget(): void {
  if (budgetDay === today() && budgetUsed > 0) budgetUsed--;
}

/* ---------------------------------------------------------------- */
/* Cache jawaban                                                      */
/* ---------------------------------------------------------------- */

const CACHE_TTL_MS = 24 * 60 * MINUTE;
const CACHE_MAX_ENTRIES = 500;

type CacheEntry<T> = { value: T; at: number };
const answerCache = new Map<string, CacheEntry<unknown>>();

/** Kunci cache: pertanyaan dinormalkan agar variasi ejaan tetap kena. */
export function cacheKey(question: string): string {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function cacheGet<T>(key: string): T | null {
  const entry = answerCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    answerCache.delete(key);
    return null;
  }
  // Sentuh ulang agar entri yang sering dipakai bertahan (LRU sederhana).
  answerCache.delete(key);
  answerCache.set(key, entry);
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T): void {
  if (answerCache.size >= CACHE_MAX_ENTRIES) {
    const oldest = answerCache.keys().next().value;
    if (oldest !== undefined) answerCache.delete(oldest);
  }
  answerCache.set(key, { value, at: Date.now() });
}

/* ---------------------------------------------------------------- */
/* Identitas pemanggil                                                */
/* ---------------------------------------------------------------- */

/** Ambil IP pemanggil dari header proxy Vercel. */
export function callerIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "tidak-dikenal";
}
