"use client";

import * as React from "react";
import { CalendarRange, Dot, FileDown } from "lucide-react";

import { berikutnya, yangBerlangsung } from "@/lib/agenda";
import { KalenderBulanan } from "@/components/kalender-bulanan";
import { kalender } from "@/lib/data";
import { formatTanggal, selisihHari, uraiTanggal } from "@/lib/tanggal";

/** Tanggal tidak berubah selama satu kunjungan; tidak ada yang perlu dilanggan. */
const langganan = () => () => {};

function isoLokal(d: Date) {
  const b = String(d.getMonth() + 1).padStart(2, "0");
  const h = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${b}-${h}`;
}

/**
 * Tanggal hari ini, `null` sampai komponennya hidup di peramban.
 *
 * Server tidak ikut menghitungnya. Kalau ikut, keadaan "sedang berlangsung"
 * dirender memakai jam server lalu dikoreksi di peramban — dan React
 * menganggapnya ketidakcocokan hidrasi. Selain itu beranda ini dirender
 * statis saat build; tanggal yang ikut terpanggang akan basi begitu
 * halamannya dilayani besok.
 */
function useHariIni(): Date | null {
  const iso = React.useSyncExternalStore(
    langganan,
    () => isoLokal(new Date()),
    () => null,
  );
  return iso ? uraiTanggal(iso) : null;
}

export function KalenderAkademik() {
  const hariIni = useHariIni();

  const berlangsung = hariIni ? yangBerlangsung(hariIni) : [];
  const nanti = hariIni ? berikutnya(hariIni) : null;

  return (
    <div className="rounded-3xl border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <CalendarRange className="size-4.5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-semibold">
            Kalender akademik {kalender.sumber.tahunAkademik}
          </h2>
          <p className="text-xs text-muted-foreground">
            {kalender.sumber.keputusan}
          </p>
        </div>
      </div>

      {/*
       * Ringkasan hari ini, ditaruh sebelum kalendernya.
       *
       * Ini bagian yang paling sering dibutuhkan — orang datang untuk tahu
       * "ada yang harus kukerjakan sekarang?", bukan untuk memandang grid.
       * Sebelum hidrasi bagian ini kosong, dan itu disengaja: lebih baik tidak
       * berkata apa-apa daripada menampilkan keadaan yang dihitung dari jam
       * server.
       */}
      {hariIni && (
        <div className="mt-4 space-y-2">
          {berlangsung.length > 0 ? (
            berlangsung.map((a) => {
              const sisa = selisihHari(a.rentang.selesai, hariIni);
              return (
                <p
                  key={a.id}
                  className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-brand/25 bg-brand-soft px-3 py-2 text-sm"
                >
                  <span
                    className="denyut-urut inline-flex size-2 shrink-0 rounded-full bg-brand"
                    aria-hidden
                  />
                  <strong className="font-semibold">{a.label}</strong>
                  <span className="text-muted-foreground">
                    sedang dibuka —{" "}
                    {sisa === 0 ? "hari ini hari terakhir" : `sisa ${sisa} hari`}
                  </span>
                </p>
              );
            })
          ) : (
            <p className="rounded-xl border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              Tidak ada jendela pendaftaran yang sedang dibuka hari ini.
            </p>
          )}

          {nanti && (
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 px-1 text-sm text-muted-foreground">
              <Dot className="-mx-1.5 size-5 shrink-0" aria-hidden />
              Berikutnya{" "}
              <strong className="font-medium text-foreground">{nanti.label}</strong>
              mulai {formatTanggal(nanti.rentang.mulai)}
              <span className="tabular-nums">
                ({selisihHari(nanti.rentang.mulai, hariIni)} hari lagi)
              </span>
            </p>
          )}
        </div>
      )}

      <div className="mt-4">
        <KalenderBulanan />
      </div>

      {/*
       * Daftar agenda enam baris yang dulu ada di sini sudah dihapus.
       *
       * Sesudah kalender bulanannya masuk, daftar itu mengulang informasi yang
       * sama tiga kali: sebagai titik di sel, sebagai isi panel rincian, dan
       * sebagai baris teks. Seksinya sempat setinggi 1.498 piksel — hampir dua
       * layar ponsel untuk satu seksi beranda.
       */}
      <p className="mt-5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
        <FileDown className="size-3.5 shrink-0" aria-hidden />
        Ditetapkan {kalender.sumber.ditetapkan}. Tanggal masih bisa bergeser —
        cocokkan dengan pengumuman resmi.
        <a
          href={kalender.sumber.berkas}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-brand underline underline-offset-3 hover:text-foreground pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center"
        >
          Unduh berkasnya
        </a>
      </p>
    </div>
  );
}
