"use client";

import * as React from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Info, Moon } from "lucide-react";

import { agenda } from "@/lib/agenda";
import { formatRentang, sedangBerlangsung, uraiTanggal } from "@/lib/tanggal";
import {
  formatHijriah,
  keHijriah,
  puasaPada,
  puasaUtama,
  type JenisPuasa,
} from "@/lib/puasa";
import { cn } from "@/lib/utils";

const HARI = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const BULAN_MASEHI = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** Warna penanda puasa. Larangan memakai warna peringatan, bukan warna ajakan. */
const WARNA_PUASA: Record<JenisPuasa, string> = {
  dilarang: "bg-warn",
  ramadan: "bg-surface-accent",
  arafah: "bg-brand",
  asyura: "bg-brand",
  tasua: "bg-brand",
  syawal: "bg-brand",
  "ayyamul-bidh": "bg-brand/70",
  "senin-kamis": "bg-brand/35",
};

const langganan = () => () => {};
const isoLokal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Tanggal hari ini; `null` sampai hidup di peramban. Lihat kalender-akademik.tsx. */
function useHariIni(): Date | null {
  const iso = React.useSyncExternalStore(
    langganan,
    () => isoLokal(new Date()),
    () => null,
  );
  return iso ? uraiTanggal(iso) : null;
}

/** Sel satu bulan, disusun mulai Senin dan digenapkan jadi enam baris. */
function selBulan(tahun: number, bulan: number): Date[] {
  const pertama = new Date(tahun, bulan, 1);
  // getDay(): 0 Minggu. Kolom pertama Senin, jadi Minggu digeser ke akhir.
  const geser = (pertama.getDay() + 6) % 7;
  const mulai = new Date(tahun, bulan, 1 - geser);
  // Selalu 42 sel supaya tinggi kalendernya tidak berubah antar bulan —
  // tanpa itu halaman melompat tiap kali bulannya diganti.
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(mulai);
    d.setDate(mulai.getDate() + i);
    return d;
  });
}

function agendaPada(d: Date) {
  return agenda.filter((a) => sedangBerlangsung(a.rentang, d));
}

export function KalenderBulanan() {
  const hariIni = useHariIni();
  const [geser, setGeser] = React.useState(0);
  const [dipilih, setDipilih] = React.useState<string | null>(null);

  if (!hariIni) {
    // Kerangka setinggi kalender jadinya. Bulan berjalan baru diketahui di
    // peramban — halaman ini dirender statis saat build, jadi bulan apa pun
    // yang dipanggang akan salah begitu bulannya berganti.
    return <div style={{ minHeight: "31rem" }} aria-busy="true" />;
  }

  const dasar = new Date(hariIni.getFullYear(), hariIni.getMonth() + geser, 1);
  const tahun = dasar.getFullYear();
  const bulan = dasar.getMonth();
  const sel = selBulan(tahun, bulan);

  const isoHariIni = isoLokal(hariIni);
  const aktif = dipilih ? uraiTanggal(dipilih) : hariIni;
  const puasaAktif = puasaPada(aktif);
  const agendaAktif = agendaPada(aktif);
  const hijriahAktif = keHijriah(aktif);

  // Rentang Hijriah yang dilalui bulan ini, untuk subjudul.
  const hAwal = keHijriah(new Date(tahun, bulan, 1));
  const hAkhir = keHijriah(new Date(tahun, bulan + 1, 0));

  return (
    /*
     * Sengaja tanpa border dan padding sendiri.
     *
     * Versi pertama merender kartunya sendiri di dalam kartu induk — dua
     * border bertumpuk, dan padding dobel memakan 40 piksel dari lebar yang
     * tersedia. Di layar 375 piksel itu menyusutkan sel kalender jadi 34
     * piksel; ruang selebar itu terlalu berharga untuk dihabiskan menggambar
     * kotak di dalam kotak.
     */
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <CalendarDays className="size-4.5" aria-hidden />
          </span>
          <div>
            <h3 className="font-heading text-lg font-semibold">
              {BULAN_MASEHI[bulan]} {tahun}
            </h3>
            <p className="text-xs text-muted-foreground">
              {hAwal.bulan === hAkhir.bulan
                ? formatHijriah(hAwal)
                : `${formatHijriah(hAwal)} – ${formatHijriah(hAkhir)}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setGeser((n) => n - 1)}
            aria-label="Bulan sebelumnya"
            className="flex size-11 items-center justify-center rounded-xl border transition-colors hover:bg-muted"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => {
              setGeser(0);
              setDipilih(null);
            }}
            className="min-h-11 rounded-xl border px-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            Hari ini
          </button>
          <button
            type="button"
            onClick={() => setGeser((n) => n + 1)}
            aria-label="Bulan berikutnya"
            className="flex size-11 items-center justify-center rounded-xl border transition-colors hover:bg-muted"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center">
        {HARI.map((h) => (
          <div key={h} className="pb-1 text-xs font-medium text-muted-foreground">
            {h}
          </div>
        ))}

        {sel.map((d) => {
          const iso = isoLokal(d);
          const bulanIni = d.getMonth() === bulan;
          const ini = iso === isoHariIni;
          const terpilih = iso === (dipilih ?? isoHariIni);
          const p = puasaUtama(d);
          const ada = agendaPada(d).length > 0;
          const h = keHijriah(d);

          return (
            <button
              key={iso}
              type="button"
              onClick={() => setDipilih(iso)}
              aria-current={ini ? "date" : undefined}
              aria-label={`${d.getDate()} ${BULAN_MASEHI[d.getMonth()]} ${d.getFullYear()}${p ? `, ${p.nama}` : ""}`}
              className={cn(
                "relative flex min-h-12 flex-col items-center justify-center rounded-xl border border-transparent transition-colors",
                bulanIni ? "text-foreground" : "text-muted-foreground/40",
                terpilih && "border-brand bg-brand-soft",
                !terpilih && bulanIni && "hover:bg-muted",
                ini && !terpilih && "border-foreground/30",
              )}
            >
              <span className={cn("text-sm tabular-nums", ini && "font-bold")}>
                {d.getDate()}
              </span>
              <span className="text-[0.6rem] leading-none text-muted-foreground/70 tabular-nums">
                {h.hari}
              </span>

              <span className="mt-0.5 flex h-1.5 items-center gap-0.5" aria-hidden>
                {p && (
                  <span
                    className={cn("size-1.5 rounded-full", WARNA_PUASA[p.jenis])}
                  />
                )}
                {ada && <span className="size-1.5 rounded-full bg-surface-accent" />}
              </span>
            </button>
          );
        })}
      </div>

      {/* Rincian hari terpilih */}
      <div className="mt-4 rounded-2xl border bg-muted/40 p-4">
        <p className="font-heading text-sm font-semibold">
          {aktif.getDate()} {BULAN_MASEHI[aktif.getMonth()]} {aktif.getFullYear()}
          <span className="ml-2 font-sans text-xs font-normal text-muted-foreground">
            {formatHijriah(hijriahAktif)}
          </span>
        </p>

        {puasaAktif.length === 0 && agendaAktif.length === 0 ? (
          <p className="mt-1.5 text-sm text-muted-foreground">
            Tidak ada puasa sunnah maupun agenda akademik pada tanggal ini.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5 text-sm">
            {puasaAktif.map((p) => (
              <li key={p.jenis} className="flex items-start gap-2">
                <span
                  className={cn(
                    "mt-1.5 size-1.5 shrink-0 rounded-full",
                    WARNA_PUASA[p.jenis],
                  )}
                  aria-hidden
                />
                {/* text-warn, bukan text-warn-foreground: token yang ada di
                    globals.css cuma --warn dan --warn-muted. Kelas yang tidak
                    punya token tidak dibangkitkan Tailwind, dan teksnya diam-
                    diam kehilangan warnanya tanpa ada yang gagal. */}
                <span className={cn(p.larangan && "font-medium text-warn")}>
                  {p.nama}
                </span>
              </li>
            ))}
            {agendaAktif.map((a) => (
              <li key={a.id} className="flex items-start gap-2">
                <span
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-surface-accent"
                  aria-hidden
                />
                <span>
                  {a.label}{" "}
                  <span className="text-muted-foreground tabular-nums">
                    ({formatRentang(a.rentang)})
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Keterangan warna */}
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {[
          { w: "bg-brand/35", n: "Senin & Kamis" },
          { w: "bg-brand/70", n: "Ayyamul Bidh" },
          { w: "bg-brand", n: "Puasa tahunan" },
          { w: "bg-surface-accent", n: "Ramadan & agenda akademik" },
          { w: "bg-warn", n: "Dilarang puasa" },
        ].map(({ w, n }) => (
          <li key={n} className="flex items-center gap-1.5">
            <span className={cn("size-1.5 rounded-full", w)} aria-hidden />
            {n}
          </li>
        ))}
      </ul>

      <p className="mt-4 flex items-start gap-2 rounded-xl border border-warn/30 bg-warn-muted p-3 text-xs leading-relaxed">
        <Moon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <span>
          Tanggal Hijriah di sini <strong className="font-medium">dihitung</strong>{" "}
          memakai kalender Umm al-Qura, bukan hasil rukyat. Kemenag menetapkan
          awal bulan lewat sidang isbat, jadi tanggalnya bisa berbeda satu hari —
          terutama di awal bulan dan menjelang Ramadan, Syawal, serta Zulhijah.
          Untuk puasa yang tanggalnya penting, ikuti pengumuman Kemenag atau
          ormas yang kamu ikuti.
        </span>
      </p>
    </div>
  );
}

/** Dipakai halaman lain untuk menjelaskan asal penanda akademiknya. */
export function KeteranganKalender() {
  return (
    <p className="flex items-start gap-2 text-xs text-muted-foreground">
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      Titik merah muda tua menandai agenda akademik yang jendelanya terbuka pada
      hari itu.
    </p>
  );
}
