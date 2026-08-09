import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";

import { Assistant } from "@/components/assistant";
import { CursorLucu } from "@/components/cursor-lucu";
import { DisclaimerModal } from "@/components/disclaimer-modal";
import { Providers } from "@/components/providers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/lib/data";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  /*
   * Tanpa ini Next.js tidak tahu alamat mana yang jadi acuan, sehingga setiap
   * URL di metadata hanya berupa jalur relatif — dan pratinjau saat ditautkan
   * di WhatsApp atau grup kelas jadi tidak lengkap. Diambil dari site.json,
   * jadi pindah domain lagi cukup mengubah satu baris data.
   */
  metadataBase: new URL(site.url),
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "Lulus HES",
    "skripsi HES",
    "Hukum Ekonomi Syariah",
    "UIN Jakarta",
    "seminar proposal",
    "munaqosyah",
    "ujian komprehensif",
    "yudisium",
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Nonce dipasang oleh src/proxy.ts. Skrip inline di bawah harus membawanya,
  // kalau tidak akan diblokir CSP.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/*
          Menyalakan animasi muncul-saat-tergulir. Keadaan tersembunyinya di CSS
          dikunci di balik kelas ini, jadi kalau JavaScript mati atau gagal
          dimuat, seluruh isi website tetap tampil apa adanya. Dijalankan di
          <head> supaya tidak ada kedipan sebelum gaya sempat berlaku.
        */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('js-reveal')`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">
        <Providers nonce={nonce}>
          <a
            href="#konten"
            className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-background focus:px-3 focus:py-2 focus:ring-2 focus:ring-ring"
          >
            Lompat ke konten
          </a>
          <SiteHeader />
          <main id="konten" className="flex-1">
            {children}
          </main>
          <SiteFooter />
          <Assistant />
          <DisclaimerModal />
          <CursorLucu />
        </Providers>
        {/*
          Vercel Web Analytics. Menghitung kunjungan per halaman tanpa cookie
          dan tanpa mengikuti pengguna antar situs, jadi tidak mengubah janji
          "tidak ada akun, tidak ada data pengguna yang disimpan". Datanya baru
          benar-benar terkumpul kalau Analytics juga dinyalakan di dashboard
          Vercel — komponen ini saja tidak cukup.
        */}
        <Analytics />
      </body>
    </html>
  );
}
