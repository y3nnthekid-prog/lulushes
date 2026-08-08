import type { Rentang } from "@/lib/types";

const BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/**
 * Membaca tanggal ISO sebagai tanggal kalender, bukan titik waktu.
 *
 * `new Date("2026-09-01")` ditafsirkan sebagai tengah malam UTC, jadi di WIB
 * ia jatuh pada 1 September pukul 07.00 — tapi di zona barat ia mundur ke 31
 * Agustus. Tanggal di kalender akademik tidak punya jam; memperlakukannya
 * sebagai titik waktu membuat tanggalnya bergeser satu hari tergantung siapa
 * yang membuka. Di sini komponennya dipecah sendiri dan dibangun sebagai
 * tanggal lokal.
 */
export function uraiTanggal(iso: string): Date {
  const [t, b, h] = iso.split("-").map(Number);
  return new Date(t, b - 1, h);
}

/** "2026-09-01" → "1 September 2026" */
export function formatTanggal(iso: string): string {
  const d = uraiTanggal(iso);
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Menyusun rentang seringkas mungkin tanpa kehilangan kejelasan:
 * sebulan sama  → "28–29 November 2026"
 * setahun sama  → "1 September – 19 Oktober 2026"
 * beda tahun    → "1 Desember 2026 – 15 Januari 2027"
 */
export function formatRentang({ mulai, selesai }: Rentang): string {
  const a = uraiTanggal(mulai);
  const b = uraiTanggal(selesai);

  if (mulai === selesai) return formatTanggal(mulai);

  if (a.getFullYear() === b.getFullYear()) {
    if (a.getMonth() === b.getMonth()) {
      return `${a.getDate()}–${b.getDate()} ${BULAN[b.getMonth()]} ${b.getFullYear()}`;
    }
    return `${a.getDate()} ${BULAN[a.getMonth()]} – ${b.getDate()} ${BULAN[b.getMonth()]} ${b.getFullYear()}`;
  }

  return `${formatTanggal(mulai)} – ${formatTanggal(selesai)}`;
}

/** Benar bila `hari` berada di dalam rentang, termasuk kedua ujungnya. */
export function sedangBerlangsung(r: Rentang, hari: Date): boolean {
  const a = uraiTanggal(r.mulai);
  const b = uraiTanggal(r.selesai);
  const t = new Date(hari.getFullYear(), hari.getMonth(), hari.getDate());
  return t >= a && t <= b;
}

/** Selisih hari kalender; negatif bila `iso` sudah lewat. */
export function selisihHari(iso: string, hari: Date): number {
  const a = uraiTanggal(iso);
  const t = new Date(hari.getFullYear(), hari.getMonth(), hari.getDate());
  return Math.round((a.getTime() - t.getTime()) / 86_400_000);
}

/**
 * Posisi sebuah tanggal pada sumbu waktu, 0–1.
 *
 * Dipakai untuk menempatkan batang dan penanda "hari ini" di kalender. Nilai
 * di luar rentang dijepit supaya penanda tidak pernah melompat keluar bidang
 * saat tahun akademiknya belum mulai atau sudah lewat.
 */
export function posisi(iso: string, sumbu: Rentang): number {
  const awal = uraiTanggal(sumbu.mulai).getTime();
  const akhir = uraiTanggal(sumbu.selesai).getTime();
  const t = uraiTanggal(iso).getTime();
  if (akhir <= awal) return 0;
  return Math.min(1, Math.max(0, (t - awal) / (akhir - awal)));
}
