"use client";

import Link from "next/link";
import { ArrowRight, CalendarRange, Moon } from "lucide-react";

import { berikutnya, yangBerlangsung } from "@/lib/agenda";
import { useHariIni } from "@/components/gunakan-hari-ini";
import { kalender } from "@/lib/data";
import { formatTanggal, selisihHari } from "@/lib/tanggal";
import { puasaPada } from "@/lib/puasa";

/**
 * Ringkasan kalender untuk beranda.
 *
 * Kalender penuhnya pindah ke halaman sendiri karena setinggi 1.238 piksel —
 * hampir dua layar ponsel untuk satu seksi. Yang ditinggal di sini cuma
 * jawaban atas pertanyaan yang membuat orang membuka kalender: ada yang
 * harus kukerjakan hari ini, dan apa berikutnya.
 *
 * Tingginya dijaga tetap lewat `min-h` supaya beranda tidak melompat saat
 * bagian ini terisi sesudah hidrasi.
 */
export function KalenderRingkas() {
  const hariIni = useHariIni();

  const berlangsung = hariIni ? yangBerlangsung(hariIni) : [];
  const nanti = hariIni ? berikutnya(hariIni) : null;
  const puasa = hariIni ? puasaPada(hariIni) : [];

  return (
    <div className="rounded-3xl border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <CalendarRange className="size-4.5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-semibold">
              Kalender akademik {kalender.sumber.tahunAkademik}
            </h2>
            <p className="text-xs text-muted-foreground">
              Jadwal wisuda, tenggat administrasi, dan hari puasa sunnah
            </p>
          </div>
        </div>

        <Link
          href="/kalender"
          className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted pointer-coarse:min-h-11"
        >
          Buka kalender
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>

      <div className="mt-4 min-h-24 space-y-2">
        {hariIni && (
          <>
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
              <p className="px-1 text-sm text-muted-foreground">
                Berikutnya{" "}
                <strong className="font-medium text-foreground">
                  {nanti.label}
                </strong>{" "}
                mulai {formatTanggal(nanti.rentang.mulai)}{" "}
                <span className="tabular-nums">
                  ({selisihHari(nanti.rentang.mulai, hariIni)} hari lagi)
                </span>
              </p>
            )}

            {puasa.length > 0 && (
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 px-1 text-sm text-muted-foreground">
                <Moon className="size-3.5 shrink-0" aria-hidden />
                Hari ini:{" "}
                <span className="font-medium text-foreground">
                  {puasa.map((p) => p.nama).join(" · ")}
                </span>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
