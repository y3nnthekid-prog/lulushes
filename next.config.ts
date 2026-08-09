import type { NextConfig } from "next";

/**
 * Header keamanan statis untuk setiap permintaan.
 *
 * Content-Security-Policy TIDAK di sini — ia butuh nonce acak per-permintaan,
 * jadi disusun di `src/proxy.ts`. Header di bawah ini bernilai tetap sehingga
 * cocok dipasang di tingkat konfigurasi.
 */
const securityHeaders = [
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
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
