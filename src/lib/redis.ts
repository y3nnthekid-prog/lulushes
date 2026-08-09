/**
 * Penyimpanan papan skor global.
 *
 * Memakai Upstash Redis lewat REST — tanpa pustaka tambahan, hanya `fetch`.
 * Perintahnya dikirim sebagai badan JSON, bukan disusun di jalur URL, supaya
 * nama pemain yang memuat garis miring atau tanda tanya tidak merusak
 * permintaannya.
 *
 * Kalau variabel lingkungannya belum diisi, seluruh fungsi di sini
 * mengembalikan null. Pemanggilnya lalu jatuh kembali ke papan skor lokal —
 * website tetap berjalan, hanya skornya belum bisa dilihat bersama.
 */

type Kredensial = { url: string; token: string };

function kredensial(): Kredensial | null {
  // Vercel memasang KV_* saat integrasi Upstash dipasang lewat Marketplace;
  // UPSTASH_* dipakai bila kredensialnya disalin manual.
  const url =
    process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? "";
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? "";
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

export function penyimpananSiap(): boolean {
  return kredensial() !== null;
}

/**
 * Variabel lingkungan mana yang terpasang.
 *
 * Hanya NAMA dan status terisi/kosong — nilainya tidak pernah ikut. Ini yang
 * dipakai memastikan integrasi Upstash benar-benar tersambung tanpa perlu
 * membocorkan token ke mana pun.
 */
export function diagnosaPenyimpanan(): Record<string, boolean> {
  const nama = [
    "KV_REST_API_URL",
    "KV_REST_API_TOKEN",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "REDIS_URL",
    "KV_URL",
  ];
  const hasil: Record<string, boolean> = {};
  for (const n of nama) hasil[n] = Boolean(process.env[n]);
  return hasil;
}

/** Memastikan Redis benar-benar menjawab, bukan sekadar kredensialnya ada. */
export async function ujiKoneksi(): Promise<boolean> {
  return (await perintah(["PING"])) !== null;
}

/** Menjalankan satu perintah Redis. Mengembalikan null bila gagal. */
async function perintah(args: (string | number)[]): Promise<unknown | null> {
  const k = kredensial();
  if (!k) return null;
  try {
    const res = await fetch(k.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${k.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
      // Papan skor harus selalu segar; menyimpannya di cache justru
      // menyembunyikan skor yang baru masuk.
      cache: "no-store",
    });
    if (!res.ok) return null;
    const isi = (await res.json()) as { result?: unknown; error?: string };
    if (isi.error) return null;
    return isi.result ?? null;
  } catch {
    // Jaringan putus atau kredensial salah — pemanggil memakai papan lokal.
    return null;
  }
}

export type HasilLaju = {
  allowed: boolean;
  /** Detik yang harus ditunggu sebelum boleh mencoba lagi. */
  retryAfter: number;
  remaining: number;
};

/**
 * Rate limit terdistribusi dengan jendela tetap.
 *
 * Berbeda dengan penjaga in-memory, hitungan ini dibagi lintas SEMUA instance
 * serverless — jadi "20 per jendela" benar-benar 20, bukan 20 per instance yang
 * mudah ditembus dengan menyebar permintaan. Nomor jendela ikut di dalam kunci,
 * jadi kunci berganti sendiri tiap periode; PEXPIRE hanya membersihkan sisa.
 *
 * Mengembalikan null bila Redis tidak terpasang atau tidak menjawab, supaya
 * pemanggil bisa jatuh kembali ke penjaga in-memory.
 */
export async function batasiLaju(
  ip: string,
  opsi: { batas: number; jendelaMs: number; prefiks: string },
): Promise<HasilLaju | null> {
  if (!kredensial()) return null;

  const jendela = Math.floor(Date.now() / opsi.jendelaMs);
  const kunci = `${opsi.prefiks}:${ip}:${jendela}`;

  const jumlah = await perintah(["INCR", kunci]);
  if (typeof jumlah !== "number") return null; // Redis gagal -> pakai cadangan

  // Baru pertama di jendela ini: pasang kedaluwarsa agar kunci tak menumpuk.
  if (jumlah === 1) await perintah(["PEXPIRE", kunci, opsi.jendelaMs]);

  if (jumlah > opsi.batas) {
    const sisaMs = await perintah(["PTTL", kunci]);
    const retryAfter =
      typeof sisaMs === "number" && sisaMs > 0
        ? Math.ceil(sisaMs / 1000)
        : Math.ceil(opsi.jendelaMs / 1000);
    return { allowed: false, retryAfter, remaining: 0 };
  }

  return { allowed: true, retryAfter: 0, remaining: opsi.batas - jumlah };
}

export type SkorGlobal = { nama: string; skor: number };

/**
 * Menyimpan skor bila lebih tinggi daripada milik nama tersebut.
 *
 * Memakai `GT`, jadi satu nama hanya punya satu baris: skor terbaiknya. Tanpa
 * itu papan akan penuh oleh satu orang yang bermain berkali-kali.
 */
export async function simpanSkor(
  kunci: string,
  nama: string,
  skor: number,
): Promise<boolean> {
  const hasil = await perintah(["ZADD", kunci, "GT", "CH", skor, nama]);
  return hasil !== null;
}

/** Mengambil beberapa skor tertinggi, terurut menurun. */
export async function ambilSkor(
  kunci: string,
  banyak: number,
): Promise<SkorGlobal[] | null> {
  const hasil = await perintah([
    "ZRANGE",
    kunci,
    "0",
    String(banyak - 1),
    "REV",
    "WITHSCORES",
  ]);
  if (!Array.isArray(hasil)) return null;

  // Balasannya berselang-seling: nama, skor, nama, skor, …
  const daftar: SkorGlobal[] = [];
  for (let i = 0; i + 1 < hasil.length; i += 2) {
    const nama = String(hasil[i]);
    const skor = Number(hasil[i + 1]);
    if (!Number.isFinite(skor)) continue;
    daftar.push({ nama, skor: Math.floor(skor) });
  }
  return daftar;
}
