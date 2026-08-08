import { CalendarDays, FileDown } from "lucide-react";

import { kalender } from "@/lib/data";
import { formatRentang, formatTanggal } from "@/lib/tanggal";

/**
 * Jadwal wisuda dari kalender akademik universitas.
 *
 * Tahap wisuda selama ini cuma bisa berkata "mengikuti jadwal universitas" —
 * benar, tapi tidak menolong orang yang justru datang untuk mencari
 * tanggalnya. Sekarang keempat gelombangnya tampil apa adanya, lengkap dengan
 * jendela pendaftaran di AIS yang biasanya tutup jauh sebelum hari-H.
 *
 * Sumbernya disebutkan di bawah, bukan disembunyikan: tanggal seperti ini
 * berubah tiap tahun akademik, dan pembaca berhak tahu ia sedang melihat
 * keputusan yang mana.
 */
export function JadwalWisuda() {
  const { wisuda, sumber } = kalender;

  return (
    <section id="jadwal-wisuda" aria-labelledby="jadwal-wisuda-heading">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <CalendarDays className="size-4.5" aria-hidden />
        </span>
        <h2
          id="jadwal-wisuda-heading"
          className="font-heading text-lg font-semibold"
        >
          Jadwal wisuda {sumber.tahunAkademik}
        </h2>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        Empat gelombang dalam satu tahun akademik. Yang paling sering terlewat
        bukan hari-H-nya, melainkan{" "}
        <strong className="font-medium text-foreground">
          jendela pendaftaran di AIS
        </strong>{" "}
        — pendaftaran gelombang berikutnya kerap sudah dibuka sebelum wisuda
        sebelumnya digelar.
      </p>

      <ol className="mt-4 space-y-3">
        {wisuda.map((w) => (
          <li key={w.ke} className="rounded-2xl border bg-card p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h3 className="font-heading text-base font-semibold">
                Wisuda ke-{w.ke}
              </h3>
              <p className="font-heading text-sm font-semibold text-brand tabular-nums">
                {formatRentang(w.pelaksanaan)}
              </p>
            </div>

            <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
              {[
                {
                  k: "Pendaftaran online di AIS",
                  v: formatRentang(w.pendaftaran),
                },
                { k: "Penyerahan peserta", v: formatTanggal(w.penyerahanPeserta) },
                { k: "Gladi resik", v: formatTanggal(w.gladiResik) },
              ].map(({ k, v }) => (
                <div key={k}>
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ol>

      <p className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
        <FileDown className="size-3.5 shrink-0" aria-hidden />
        Sumber: {sumber.keputusan}, ditetapkan {sumber.ditetapkan}.
        <a
          href={sumber.berkas}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-brand underline underline-offset-3 hover:text-foreground pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center"
        >
          Unduh kalender akademik
        </a>
      </p>
    </section>
  );
}
