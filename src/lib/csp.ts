/**
 * Direktif Content-Security-Policy, satu sumber untuk dua pemakai.
 *
 * Situs ini menyajikan CSP dari dua tempat, dan itu disengaja:
 *
 * 1. `src/proxy.ts` memasang versi ber-nonce pada permintaan biasa. Nonce
 *    acak per-permintaan, jadi tidak mungkin dipasang di konfigurasi.
 * 2. `next.config.ts` memasang versi dasar pada SEMUA respons, termasuk yang
 *    tidak dilewati proxy.
 *
 * Yang kedua menutup celah yang sebelumnya terbuka. Matcher proxy sengaja
 * melewatkan permintaan ber-header `Purpose: prefetch` dan
 * `Next-Router-Prefetch` — pola resmi dari dokumentasi Next.js, supaya
 * prefetch tidak memicu render dinamis sia-sia. Akibatnya yang jarang
 * disebut: respons itu keluar TANPA CSP sama sekali. Bukan CSP lemah — nihil.
 * Tidak ada `default-src`, `object-src`, `frame-ancestors`, maupun
 * `connect-src`.
 *
 * Terverifikasi di produksi sebelum perbaikan ini:
 *   curl -H "purpose: prefetch" https://lulushes.my.id/roadmap  → 0 header CSP
 *   curl                        https://lulushes.my.id/roadmap  → 1 header CSP
 *
 * Perbedaan keduanya hanya pada `script-src`. Versi dasar memakai
 * `'unsafe-inline'` karena respons yang melewati proxy tidak punya nonce untuk
 * dirujuk; seluruh direktif lain — yang justru paling bernilai — sama persis.
 */
export type SumberSkrip = { skripInline: string; dev: boolean };

export function susunCsp({ skripInline, dev }: SumberSkrip): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    // Gaya inline dari komponen animasi (motion, progress ring) tetap
    // diizinkan; risiko XSS lewat style jauh lebih kecil daripada lewat script.
    "style-src 'self' 'unsafe-inline'",
    // 'self' menutupi skrip Next & Vercel Analytics (di-proxy same-origin).
    // `skripInline` yang membedakan kedua pemakai. 'unsafe-eval' hanya di dev
    // karena React memakainya untuk pesan galat yang lebih kaya.
    `script-src 'self' ${skripInline}${dev ? " 'unsafe-eval'" : ""}`,
    // ws:/http: hanya di dev untuk hot-reload; di produksi cukup same-origin.
    `connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com${
      dev ? " ws: http:" : ""
    }`,
    // upgrade-insecure-requests memaksa https — jangan di dev (localhost http).
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}
