import type { NextConfig } from "next";

/**
 * Content-Security-Policy.
 *
 * Menutup jalur XSS yang paling umum: hanya sumber dari situs ini sendiri yang
 * boleh dimuat, ditambah beberapa domain yang memang dipakai.
 *
 *   - script/connect va.vercel-scripts.com + vitals.vercel-insights.com
 *     dibutuhkan oleh @vercel/analytics.
 *   - 'unsafe-inline' pada script masih diperlukan karena ada <script> inline
 *     kecil di <head> (kelas js-reveal) dan skrip bootstrap Next.js. Langkah
 *     penguatan berikutnya: ganti dengan nonce agar 'unsafe-inline' bisa dicabut.
 *   - font di-self-host oleh next/font, jadi cukup 'self'.
 *   - frame-ancestors 'none' mencegah situs disematkan di iframe (anti-clickjacking).
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
  "connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com",
  "upgrade-insecure-requests",
].join("; ");

/** Header keamanan yang dikirim untuk setiap permintaan. */
const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
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
