import { kalender } from "@/lib/data";
import { sedangBerlangsung, selisihHari, uraiTanggal } from "@/lib/tanggal";
import type { Rentang } from "@/lib/types";

/**
 * Jenis agenda menentukan warnanya di kalender.
 *
 * Dibedakan karena bobotnya berbeda bagi mahasiswa tingkat akhir: yang
 * `tenggat` punya batas akhir yang kalau terlewat harus menunggu periode
 * berikutnya, sedangkan `periode` cuma menerangkan kita sedang di bagian
 * tahun yang mana.
 */
export type JenisAgenda = "wisuda" | "tenggat" | "periode";

export type Agenda = {
  id: string;
  label: string;
  detail: string;
  jenis: JenisAgenda;
  rentang: Rentang;
};

/**
 * Seluruh agenda kalender akademik dalam satu daftar datar, terurut waktu.
 *
 * Diturunkan dari `kalender`, tidak ditulis ulang. Menyalinnya jadi daftar
 * kedua akan membuat kalender di beranda dan daftar di tahap wisuda bisa
 * menampilkan tanggal berbeda untuk hal yang sama — persis jenis kesalahan
 * yang paling sulit disadari.
 */
export const agenda: Agenda[] = [
  ...kalender.semester.flatMap((s) => [
    {
      id: `ukt-${s.nama}`,
      label: "Pembayaran UKT",
      detail: s.nama,
      jenis: "tenggat" as const,
      rentang: s.pembayaranUkt,
    },
    {
      id: `kuliah-${s.nama}`,
      label: "Perkuliahan",
      detail: s.nama,
      jenis: "periode" as const,
      rentang: s.perkuliahan,
    },
  ]),

  ...kalender.wisuda.flatMap((w) => [
    {
      id: `daftar-wisuda-${w.ke}`,
      label: `Pendaftaran wisuda ke-${w.ke}`,
      detail: "Online di AIS",
      jenis: "tenggat" as const,
      rentang: w.pendaftaran,
    },
    {
      id: `wisuda-${w.ke}`,
      label: `Wisuda ke-${w.ke}`,
      detail: "Pelaksanaan",
      jenis: "wisuda" as const,
      rentang: w.pelaksanaan,
    },
  ]),
].sort(
  (a, b) =>
    uraiTanggal(a.rentang.mulai).getTime() -
    uraiTanggal(b.rentang.mulai).getTime(),
);

/** Agenda yang jendelanya sedang terbuka hari ini. */
export function yangBerlangsung(hari: Date): Agenda[] {
  return agenda.filter((a) => sedangBerlangsung(a.rentang, hari));
}

/**
 * Agenda terdekat yang belum dimulai.
 *
 * Mengembalikan `null` bila tahun akademiknya sudah lewat seluruhnya — dan
 * itu bukan keadaan darurat, cuma tanda kalendernya perlu diganti dengan
 * terbitan tahun berikutnya.
 */
export function berikutnya(hari: Date): Agenda | null {
  return agenda.find((a) => selisihHari(a.rentang.mulai, hari) > 0) ?? null;
}
