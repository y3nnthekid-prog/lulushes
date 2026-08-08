"use client";

import * as React from "react";
import { CalendarRange, Dot, FileDown } from "lucide-react";

import { agenda, berikutnya, yangBerlangsung } from "@/lib/agenda";
import { kalender } from "@/lib/data";
import {
  formatRentang,
  formatTanggal,
  posisi,
  selisihHari,
  uraiTanggal,
} from "@/lib/tanggal";
import { cn } from "@/lib/utils";
import type { JenisAgenda } from "@/lib/agenda";

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
 * Server tidak ikut menghitungnya. Kalau ikut, penanda "hari ini" akan
 * dirender memakai jam server lalu dikoreksi di peramban — dan React
 * menganggapnya ketidakcocokan hidrasi. Selain itu halaman ini dirender
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

const WARNA: Record<JenisAgenda, { batang: string; titik: string }> = {
  wisuda: { batang: "bg-brand", titik: "bg-brand" },
  tenggat: { batang: "bg-surface-accent/85", titik: "bg-surface-accent" },
  periode: { batang: "bg-brand/25", titik: "bg-brand/40" },
};

const JALUR: { jenis: JenisAgenda; nama: string }[] = [
  { jenis: "periode", nama: "Perkuliahan" },
  { jenis: "tenggat", nama: "Tenggat" },
  { jenis: "wisuda", nama: "Wisuda" },
];

/**
 * Bulan-bulan yang dilalui sumbu waktu, untuk garis dan label.
 *
 * Dihitung sekali di tingkat modul, bukan lewat useMemo: sumbernya data
 * statis yang tidak berubah sepanjang umur aplikasi, jadi menghitungnya
 * ulang per komponen tidak ada gunanya.
 */
function bulanSumbu() {
  const a = uraiTanggal(kalender.sumber.mulai);
  const b = uraiTanggal(kalender.sumber.selesai);
  const keluar: { iso: string; label: string }[] = [];
  const kursor = new Date(a.getFullYear(), a.getMonth(), 1);
  while (kursor <= b) {
    keluar.push({
      iso: isoLokal(kursor),
      label: kursor.toLocaleDateString("id-ID", { month: "short" }),
    });
    kursor.setMonth(kursor.getMonth() + 1);
  }
  return keluar;
}

const SUMBU = {
  mulai: kalender.sumber.mulai,
  selesai: kalender.sumber.selesai,
};
const BULAN_SUMBU = bulanSumbu();

export function KalenderAkademik() {
  const hariIni = useHariIni();
  const sumbu = SUMBU;
  const bulan = BULAN_SUMBU;

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
       * Ringkasan hari ini.
       *
       * Ini bagian yang paling sering dibutuhkan, jadi ditaruh sebelum
       * grafiknya — bukan sesudah. Sebelum hidrasi bagian ini kosong, dan itu
       * disengaja: lebih baik tidak berkata apa-apa daripada menampilkan
       * keadaan yang dihitung dari jam server.
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
                  <span className="denyut-urut inline-flex size-2 shrink-0 rounded-full bg-brand" aria-hidden />
                  <strong className="font-semibold">{a.label}</strong>
                  <span className="text-muted-foreground">
                    sedang dibuka — {sisa === 0 ? "hari ini hari terakhir" : `sisa ${sisa} hari`}
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
              Berikutnya <strong className="font-medium text-foreground">{nanti.label}</strong>
              mulai {formatTanggal(nanti.rentang.mulai)}
              <span className="tabular-nums">
                ({selisihHari(nanti.rentang.mulai, hariIni)} hari lagi)
              </span>
            </p>
          )}
        </div>
      )}

      {/* Sumbu waktu. Di layar sempit ia digulir mendatar, bukan dipadatkan
          sampai labelnya bertumpuk. */}
      <div className="mt-5 -mx-1 overflow-x-auto pb-2">
        <div className="relative min-w-[42rem] px-1">
          {/* Garis bulan */}
          <div className="relative h-5">
            {bulan.map((b) => (
              <span
                key={b.iso}
                className="absolute top-0 text-[0.7rem] text-muted-foreground"
                style={{ left: `${posisi(b.iso, sumbu) * 100}%` }}
              >
                {b.label}
              </span>
            ))}
          </div>

          <div className="relative">
            {bulan.map((b) => (
              <span
                key={b.iso}
                className="absolute inset-y-0 w-px bg-border"
                style={{ left: `${posisi(b.iso, sumbu) * 100}%` }}
                aria-hidden
              />
            ))}

            {JALUR.map(({ jenis, nama }) => (
              <div key={jenis} className="relative h-9">
                <span className="absolute -top-0.5 left-0 z-1 text-[0.7rem] font-medium text-muted-foreground">
                  {nama}
                </span>
                {agenda
                  .filter((a) => a.jenis === jenis)
                  .map((a) => {
                    const kiri = posisi(a.rentang.mulai, sumbu) * 100;
                    const kanan = posisi(a.rentang.selesai, sumbu) * 100;
                    const aktif =
                      hariIni !== null &&
                      selisihHari(a.rentang.mulai, hariIni) <= 0 &&
                      selisihHari(a.rentang.selesai, hariIni) >= 0;
                    return (
                      <span
                        key={a.id}
                        title={`${a.label} · ${formatRentang(a.rentang)}`}
                        className={cn(
                          "absolute top-4 h-3 rounded-full transition-all",
                          WARNA[jenis].batang,
                          aktif && "ring-2 ring-brand ring-offset-1 ring-offset-card",
                        )}
                        style={{
                          left: `${kiri}%`,
                          // Lebar minimum supaya acara satu-dua hari tetap
                          // terlihat; tanpa ini wisuda menghilang jadi garis.
                          width: `max(0.65rem, ${kanan - kiri}%)`,
                        }}
                      />
                    );
                  })}
              </div>
            ))}

            {/* Penanda hari ini */}
            {hariIni && (
              <span
                className="pointer-events-none absolute inset-y-0 z-2 w-0.5 bg-foreground"
                style={{ left: `${posisi(isoLokal(hariIni), sumbu) * 100}%` }}
                aria-hidden
              >
                <span className="absolute -top-1 -left-1 size-2.5 rounded-full bg-foreground" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/*
       * Daftar teks: kalender di atas untuk orientasi, ini untuk dibaca.
       *
       * Hanya yang belum berakhir. Versi pertama menampilkan kedua belas
       * agenda dan kartunya jadi 986 piksel — lebih tinggi dari satu layar
       * ponsel untuk satu seksi saja. Tanggal yang sudah lewat tidak menolong
       * siapa pun di beranda; yang lengkap tetap ada di berkas PDF-nya.
       *
       * Jumlahnya dijaga tetap enam sebelum dan sesudah hidrasi supaya tinggi
       * kartunya tidak melompat begitu tanggal hari ini diketahui.
       */}
      <ul className="mt-5 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {(hariIni
          ? agenda.filter((a) => selisihHari(a.rentang.selesai, hariIni) >= 0)
          : agenda
        )
          .slice(0, 6)
          .map((a) => (
            <li key={a.id} className="flex items-baseline gap-2">
              <span
                className={cn(
                  "mt-1.5 size-1.5 shrink-0 rounded-full",
                  WARNA[a.jenis].titik,
                )}
                aria-hidden
              />
              <span className="min-w-0">
                <span className="font-medium">{a.label}</span>{" "}
                <span className="text-muted-foreground tabular-nums">
                  {formatRentang(a.rentang)}
                </span>
              </span>
            </li>
          ))}
      </ul>

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
