import siteJson from "@/data/site.json";

import type { SiteConfig } from "@/lib/types";

/**
 * Identitas website: nama, deskripsi, tautan resmi, penyangkalan.
 *
 * Berkas tersendiri, bukan bagian dari `@/lib/data`, dan alasannya soal
 * ukuran bundel. `data.ts` adalah barrel yang mengimpor SELURUH JSON —
 * stages (77 KB), faq, downloads, jadwal, skpi, kalender. Komponen klien yang
 * cuma butuh nama website tetap menyeret semuanya, dan header ada di setiap
 * halaman, jadi ongkos itu dibayar di mana-mana.
 *
 * Data lain yang dipakai komponen klien sebaiknya ikut dipecah begini kalau
 * pemakainya tidak benar-benar butuh sisanya.
 */
export const site = siteJson as SiteConfig;
