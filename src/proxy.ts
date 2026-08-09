import { NextResponse, type NextRequest } from "next/server";

/**
 * Content-Security-Policy berbasis nonce.
 *
 * Setiap permintaan mendapat nonce acak sekali-pakai. Skrip inline hanya
 * dijalankan browser bila membawa nonce yang sama — jadi payload XSS yang
 * disuntikkan penyerang (yang tidak mungkin menebak nonce) langsung diblokir.
 * Ini menggantikan `'unsafe-inline'` yang lama, yang memberi celah pada semua
 * skrip inline tanpa pandang bulu.
 *
 * Next.js membaca header CSP di sini lalu otomatis menempelkan nonce ke skrip
 * kerangkanya sendiri (React/hidrasi). Skrip inline buatan kita menariknya
 * lewat header `x-nonce` di layout.
 *
 * Catatan: nonce menuntut render dinamis per-permintaan, jadi halaman tidak
 * lagi murni statis. Untuk situs sekecil ini biayanya kecil dan sepadan.
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    // Gaya inline dari komponen animasi (motion, progress ring) tetap diizinkan;
    // risiko XSS lewat style jauh lebih kecil daripada lewat script.
    "style-src 'self' 'unsafe-inline'",
    // Kunci utama. 'self' menutupi skrip Next & Vercel Analytics (di-proxy
    // same-origin); nonce menutupi skrip inline yang sah. 'unsafe-eval' hanya
    // di dev karena React memakainya untuk pesan galat yang lebih kaya.
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ""}`,
    // ws:/http: hanya di dev untuk hot-reload; di produksi cukup same-origin.
    `connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com${
      isDev ? " ws: http:" : ""
    }`,
    // upgrade-insecure-requests akan memaksa https — jangan di dev (localhost http).
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    /*
     * Jalankan pada semua rute HTML, kecuali yang tak butuh CSP:
     * - api            (balasan JSON, bukan HTML)
     * - _next/static   (berkas statis)
     * - _next/image    (optimasi gambar)
     * - favicon.ico
     * Prefetch dari <Link> juga dilewati agar tidak render dinamis sia-sia.
     */
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
