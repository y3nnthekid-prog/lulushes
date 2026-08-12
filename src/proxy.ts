import { NextResponse, type NextRequest } from "next/server";

import { susunCsp } from "@/lib/csp";

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
 *
 * Direktifnya ada di `@/lib/csp`, dipakai bersama dengan versi dasar di
 * `next.config.ts`. Permintaan prefetch melewati proxy ini, dan versi dasar
 * itulah yang menjaganya supaya tidak keluar tanpa CSP sama sekali.
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  const csp = susunCsp({ skripInline: `'nonce-${nonce}'`, dev: isDev });

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
