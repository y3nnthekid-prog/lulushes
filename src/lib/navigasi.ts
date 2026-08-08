/**
 * Daftar halaman website, satu-satunya.
 *
 * Sebelumnya daftar ini ditulis tiga kali — di header, di footer, dan di
 * sitemap — dan ketiganya sudah mulai berbeda urutannya. Menambah halaman
 * baru berarti mengingat tiga tempat sekaligus, dan yang paling mudah
 * terlupakan justru sitemap, karena tidak terlihat saat membuka website.
 *
 * Sengaja tidak memuat ikon: berkas ini ikut diimpor `sitemap.ts` yang
 * berjalan di server, dan menyeret komponen ikon ke sana tidak ada gunanya.
 * Pemetaan ikonnya ada di header, tempat ikon itu benar-benar digambar.
 */
export type Halaman = {
  href: string;
  label: string;
  /** Prioritas di sitemap, 0–1. Beranda tertinggi. */
  prioritas: number;
};

export const halaman: Halaman[] = [
  { href: "/", label: "Home", prioritas: 1 },
  { href: "/roadmap", label: "Roadmap", prioritas: 0.9 },
  { href: "/tahapan", label: "Tahapan", prioritas: 0.9 },
  { href: "/kalender", label: "Kalender", prioritas: 0.8 },
  { href: "/download", label: "Download", prioritas: 0.8 },
  { href: "/main", label: "Main", prioritas: 0.5 },
  { href: "/faq", label: "FAQ", prioritas: 0.7 },
  { href: "/tentang", label: "Tentang", prioritas: 0.5 },
];

/** Halaman selain beranda; dipakai navigasi yang sudah punya logo ke beranda. */
export const halamanSelainBeranda = halaman.filter((h) => h.href !== "/");
