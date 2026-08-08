/**
 * Penanggalan Hijriah dan hari-hari puasa.
 *
 * PENTING soal ketepatan tanggal. Konversi di sini memakai kalender
 * Umm al-Qura lewat `Intl` — kalender HISAB yang dihitung, dipakai Arab
 * Saudi. Indonesia menetapkan awal bulan lewat sidang isbat Kemenag yang
 * mempertimbangkan rukyat, jadi tanggal Hijriah di sini bisa meleset satu
 * hari dari ketetapan Kemenag, terutama di awal bulan.
 *
 * Itu bukan cacat yang bisa diperbaiki dengan rumus lain: rukyat memang
 * tidak bisa dihitung di muka. Yang bisa dilakukan adalah mengatakannya
 * terus terang di layar, dan itu dilakukan komponen kalendernya.
 */

export type JenisPuasa =
  | "senin-kamis"
  | "ayyamul-bidh"
  | "asyura"
  | "tasua"
  | "arafah"
  | "syawal"
  | "ramadan"
  | "dilarang";

export type Puasa = {
  jenis: JenisPuasa;
  nama: string;
  /** Benar untuk hari yang justru diharamkan berpuasa. */
  larangan?: boolean;
};

export type TanggalHijriah = {
  hari: number;
  bulan: number;
  tahun: number;
};

/** Nama bulan Hijriah, indeks 1–12. */
export const BULAN_HIJRIAH = [
  "",
  "Muharram",
  "Safar",
  "Rabiul Awal",
  "Rabiul Akhir",
  "Jumadil Awal",
  "Jumadil Akhir",
  "Rajab",
  "Syaban",
  "Ramadan",
  "Syawal",
  "Zulkaidah",
  "Zulhijah",
];

// Dibuat sekali. Membuat Intl.DateTimeFormat per pemanggilan mahal, dan
// kalender bulanan memanggilnya untuk setiap sel di layar.
const formatter = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
});

export function keHijriah(d: Date): TanggalHijriah {
  const bagian = Object.fromEntries(
    formatter
      .formatToParts(d)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value]),
  );
  return {
    hari: Number(bagian.day),
    // Tahun Hijriah kadang berakhiran " AH"; Number() atas string itu NaN,
    // jadi angkanya diambil eksplisit.
    bulan: Number(bagian.month),
    tahun: parseInt(String(bagian.year), 10),
  };
}

/** "26 Safar 1448" */
export function formatHijriah(h: TanggalHijriah): string {
  return `${h.hari} ${BULAN_HIJRIAH[h.bulan] ?? "?"} ${h.tahun}`;
}

/**
 * Hari-hari puasa pada sebuah tanggal.
 *
 * Mengembalikan daftar karena beberapa bisa bertumpuk — Ayyamul Bidh yang
 * jatuh pada hari Senin, misalnya.
 *
 * Hari yang diharamkan berpuasa diperiksa LEBIH DULU dan menggantikan
 * seluruh isinya. Ini bukan detail kecil: tanggal 13 Zulhijah adalah
 * Ayyamul Bidh sekaligus hari tasyriq, dan aturan naif akan menganjurkan
 * puasa pada hari yang justru dilarang.
 */
export function puasaPada(d: Date): Puasa[] {
  const h = keHijriah(d);
  const hari = d.getDay(); // 0 Minggu … 6 Sabtu

  // 1 Syawal, 10 Zulhijah, dan tiga hari tasyriq (11–13 Zulhijah).
  if (h.bulan === 10 && h.hari === 1)
    return [{ jenis: "dilarang", nama: "Idulfitri — dilarang puasa", larangan: true }];
  if (h.bulan === 12 && h.hari === 10)
    return [{ jenis: "dilarang", nama: "Iduladha — dilarang puasa", larangan: true }];
  if (h.bulan === 12 && h.hari >= 11 && h.hari <= 13)
    return [{ jenis: "dilarang", nama: "Hari tasyriq — dilarang puasa", larangan: true }];

  if (h.bulan === 9) {
    return [{ jenis: "ramadan", nama: `Ramadan hari ke-${h.hari}` }];
  }

  const keluar: Puasa[] = [];

  if (h.bulan === 12 && h.hari === 9) {
    keluar.push({ jenis: "arafah", nama: "Puasa Arafah" });
  }
  if (h.bulan === 1 && h.hari === 9) {
    keluar.push({ jenis: "tasua", nama: "Puasa Tasua" });
  }
  if (h.bulan === 1 && h.hari === 10) {
    keluar.push({ jenis: "asyura", nama: "Puasa Asyura" });
  }
  // Enam hari Syawal boleh kapan saja sesudah Idulfitri; yang ditandai di
  // sini rentang yang paling lazim dijalankan berurutan.
  if (h.bulan === 10 && h.hari >= 2 && h.hari <= 7) {
    keluar.push({ jenis: "syawal", nama: "Puasa enam hari Syawal" });
  }
  if (h.hari >= 13 && h.hari <= 15) {
    keluar.push({ jenis: "ayyamul-bidh", nama: `Ayyamul Bidh (${h.hari})` });
  }
  if (hari === 1 || hari === 4) {
    keluar.push({
      jenis: "senin-kamis",
      nama: hari === 1 ? "Puasa Senin" : "Puasa Kamis",
    });
  }

  return keluar;
}

/** Puasa yang paling menonjol pada sebuah hari, untuk penanda kecil di sel. */
export function puasaUtama(d: Date): Puasa | null {
  const semua = puasaPada(d);
  if (semua.length === 0) return null;
  const urutan: JenisPuasa[] = [
    "dilarang",
    "ramadan",
    "arafah",
    "asyura",
    "tasua",
    "syawal",
    "ayyamul-bidh",
    "senin-kamis",
  ];
  return (
    semua.slice().sort((a, b) => urutan.indexOf(a.jenis) - urutan.indexOf(b.jenis))[0] ??
    null
  );
}
