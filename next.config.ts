import type { NextConfig } from "next";

import { susunCsp } from "./src/lib/csp";

/**
 * Header keamanan statis untuk setiap permintaan.
 *
 * Versi ber-nonce dari CSP disusun di `src/proxy.ts`, dan ia menimpa yang di
 * sini pada permintaan biasa. Yang di sini adalah LANTAI: ia berlaku juga pada
 * respons yang tidak dilewati proxy — terutama permintaan ber-header
 * `Purpose: prefetch`, yang sebelumnya keluar tanpa CSP sama sekali.
 *
 * Bedanya hanya `script-src`: di sini `'unsafe-inline'`, karena respons yang
 * melewati proxy tidak punya nonce untuk dirujuk. Seluruh direktif lain sama
 * persis, termasuk yang paling bernilai — `object-src 'none'`,
 * `frame-ancestors 'none'`, dan `connect-src` yang membatasi eksfiltrasi.
 */
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: susunCsp({
      skripInline: "'unsafe-inline'",
      dev: process.env.NODE_ENV === "development",
    }),
  },
  {
    // Paksa HTTPS selama dua tahun, termasuk subdomain. 'preload' adalah
    // komitmen: sekali masuk daftar preload browser, sulit dibatalkan.
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  // Sembunyikan header "X-Powered-By: Next.js" — bocoran kecil soal framework
  // yang dipakai penyerang untuk menyaring target.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
