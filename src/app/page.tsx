import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  ExternalLink,
  FileText,
  FolderDown,
  ListChecks,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Hero } from "@/components/hero";
import { KalenderRingkas } from "@/components/kalender-ringkas";
import { LinkButton } from "@/components/link-button";
import { PositionCard } from "@/components/position-card";
import { Reveal } from "@/components/reveal";
import { Roadmap } from "@/components/roadmap";
import {
  JAM_TENGGAT,
  getStagesByPhase,
  phases,
  schedule,
  site,
  totalStages,
} from "@/lib/data";
import { phaseStyle } from "@/lib/phase";
import { cn } from "@/lib/utils";

const questions = [
  {
    icon: MapPin,
    question: "Saya di mana?",
    answer: `Kartu posisi menunjukkan tahap kamu sekarang dari ${totalStages} tahap.`,
  },
  {
    icon: ListChecks,
    question: "Sekarang ngapain?",
    answer: "Langkah berurutan dan checklist yang tersimpan sendiri.",
  },
  {
    icon: FolderDown,
    question: "Butuh dokumen apa?",
    answer: "Template dikelompokkan per tahap, bukan satu tumpukan.",
  },
  {
    icon: ArrowRight,
    question: "Habis ini apa?",
    answer: "Tiap halaman menutup dengan tahap sesudahnya.",
  },
];

/*
 * Kanonik beranda.
 *
 * Sebelumnya nilai ini disetel di layout dan otomatis diwarisi SELURUH
 * halaman — akibatnya setiap halaman mengaku duplikat beranda, dan mesin
 * pencari diberi tahu bahwa website ini cuma punya satu halaman. Sekarang
 * tiap halaman menyatakan alamatnya sendiri.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <div>
      <Hero />

      <div className="mx-auto max-w-5xl px-4">
        {/* Posisi pengguna + empat pertanyaan */}
        <section className="grid gap-6 py-12 lg:grid-cols-[21rem_1fr] lg:items-start">
          <Reveal>
            <PositionCard />
          </Reveal>

          <Reveal delay={90} className="lg:pt-1">
            <h2 className="font-heading text-xl font-semibold text-balance sm:text-2xl">
              Empat pertanyaan yang bikin kamu chat senior jam 11 malam
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Semuanya sudah dijawab di sini. Setiap halaman menjawab keempatnya
              sekaligus — tidak ada yang digantung.
            </p>

            {/*
             * Dulu empat kartu seragam berjajar 2x2 — ikon di kotak bulat,
             * judul, satu baris keterangan, keempatnya persis sama. Susunan
             * itu benar tapi tidak mengatakan apa-apa, dan justru membuang
             * kalimat terbaik di seksi ini: "chat senior jam 11 malam".
             *
             * Sekarang bentuknya utas percakapan. Pertanyaan rata kanan
             * seperti pesan yang kamu kirim, jawaban rata kiri seperti balasan
             * yang datang. Asimetrinya lahir dari isinya sendiri, bukan
             * ditempelkan, dan lebar tiap gelembung mengikuti panjang
             * kalimatnya — jadi tidak ada dua baris yang sama persis.
             *
             * <dl> dipakai karena ini memang pasangan tanya-jawab: dt untuk
             * pertanyaan, dd untuk jawabannya. Bentuknya menyerupai chat, tapi
             * strukturnya tetap jujur bagi pembaca layar.
             */}
            <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" aria-hidden />
              23.47
              <span className="h-px flex-1 bg-border" aria-hidden />
            </p>

            <dl className="mt-3 space-y-4">
              {questions.map(({ icon: Icon, question, answer }, i) => (
                // Reveal merender <div>. Kalau ia membungkus dt/dd, susunannya
                // jadi dl > div > div > dt — terlalu dalam, dan pasangan
                // tanya-jawabnya putus bagi pembaca layar. Jadi dt/dd yang
                // membungkus Reveal, bukan sebaliknya.
                <div key={question} className="space-y-1.5">
                  <dt className="flex justify-end">
                    <Reveal
                      delay={140 + i * 110}
                      className="max-w-[85%] rounded-2xl rounded-br-sm bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground shadow-sm"
                    >
                      {question}
                    </Reveal>
                  </dt>

                  <dd className="flex justify-start pr-6">
                    <Reveal
                      delay={200 + i * 110}
                      className="card-lift flex max-w-[92%] items-start gap-2.5 rounded-2xl rounded-bl-sm border bg-card px-4 py-2.5 text-sm"
                    >
                      <Icon
                        className="mt-0.5 size-4 shrink-0 text-brand"
                        aria-hidden
                      />
                      <span className="text-muted-foreground">{answer}</span>
                    </Reveal>
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </section>

        {/* Perjalanan: pita fase + roadmap ringkas, digabung jadi satu seksi
            supaya halaman depan tidak memanjang tanpa perlu. */}
        <section className="border-t py-12">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-3">
              {/* Seksi inti website — dinaikkan satu tingkat supaya tidak
                  berbunyi sama kerasnya dengan seksi pendukung di sekitarnya. */}
              <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
                Perjalananmu, empat fase
              </h2>
              <LinkButton href="/roadmap" variant="outline" size="sm">
                Roadmap lengkap
                <ArrowRight aria-hidden data-icon="inline-end" />
              </LinkButton>
            </div>

            <div
              className="journey-bar mt-4 h-2.5 w-full rounded-full"
              aria-hidden
            />

            <ol className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {phases.map((phase) => {
                const style = phaseStyle(phase);
                const inPhase = getStagesByPhase(phase);
                return (
                  <li key={phase} className="flex items-center gap-2">
                    <span
                      className={cn("size-2.5 shrink-0 rounded-full", style.dot)}
                      aria-hidden
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {phase}
                      </span>
                      <span className="block text-xs text-muted-foreground tabular-nums">
                        Tahap {inPhase[0].order}–
                        {inPhase[inPhase.length - 1].order}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </Reveal>

          <Reveal delay={120} className="mt-8">
            <Roadmap compact />
          </Reveal>
        </section>

        {/* Siklus ujian bulanan */}
        <section className="border-t py-12">
          {/*
           * Seksi ini sengaja dibalik hierarkinya.
           *
           * Judulnya turun jadi label kecil, dan yang membesar adalah jam
           * tenggatnya. Alasannya sederhana: "Siklus ujian bulanan" cuma nama
           * seksi, sedangkan 16.00 adalah satu-satunya angka di halaman ini
           * yang kalau terlewat bisa membuat orang mengulang satu periode.
           * Sebelumnya angka itu terkubur di tengah paragraf abu-abu dengan
           * ukuran yang sama dengan teks penjelas biasa.
           *
           * Ini juga yang memecah nada tipografi halaman: sesudah hero, semua
           * judul seksi berukuran nyaris sama, jadi tidak ada satu pun momen
           * yang terasa lebih penting dari yang lain.
           */}
          <Reveal>
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-blush text-blush-foreground">
                <CalendarClock className="size-4.5" aria-hidden />
              </span>
              <h2 className="font-heading text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                {schedule.heading}
              </h2>
            </div>

            {/*
             * Batas atasnya (4rem) sengaja di bawah batas atas judul hero
             * (4,75rem). Percobaan pertama memakai 14vw tanpa batas serendah
             * itu, dan hasilnya angka ini justru lebih besar daripada judul
             * halaman di layar lebar — momen besar berubah jadi hierarki yang
             * terbalik. Di layar sempit ia tetap boleh menonjol: keduanya
             * tidak pernah terlihat bersamaan di sana.
             */}
            <p className="mt-5 font-heading text-[clamp(2.75rem,8vw,4rem)] leading-[0.88] font-bold tracking-tight tabular-nums">
              {JAM_TENGGAT}
              <span className="ml-2.5 align-baseline text-[0.26em] font-semibold tracking-normal text-muted-foreground">
                WIB
              </span>
            </p>
            <p className="mt-3 max-w-md text-base font-medium text-balance">
              Jam yang sama untuk setiap pendaftaran ujian — apa pun ujiannya,
              periode ke berapa pun.
            </p>

            <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
              {schedule.intro}
            </p>
          </Reveal>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {schedule.exams.map((exam, i) => (
              <Reveal
                key={exam.id}
                delay={90 + i * 80}
                className="card-lift flex flex-col rounded-2xl border bg-card p-4"
              >
                <h3 className="font-heading text-sm font-semibold">
                  {exam.name}
                </h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">
                  {exam.schedulePattern}
                </p>
                <p className="mt-3 rounded-lg bg-blush/25 px-2.5 py-1.5 text-xs font-medium text-blush-foreground dark:text-blush">
                  Tenggat: {exam.deadlinePattern}
                </p>
                <a
                  href={exam.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand underline-offset-4 hover:underline pointer-coarse:min-h-11"
                >
                  Buka form pendaftaran
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
              </Reveal>
            ))}
          </div>

          <Reveal delay={140}>
            <p className="mt-4 rounded-xl border border-warn/30 bg-warn-muted p-3 text-xs text-foreground/80">
              {schedule.warning}
            </p>
          </Reveal>
        </section>

        {/* Kalender akademik: di sini cuma ringkasannya.
            Kalender penuhnya setinggi 1.238 piksel — hampir dua layar ponsel
            untuk satu seksi beranda — jadi ia pindah ke /kalender. Yang
            tertinggal menjawab satu pertanyaan saja: ada yang harus kukerjakan
            hari ini? */}
        <section className="border-t py-12">
          <Reveal>
            <KalenderRingkas />
          </Reveal>
        </section>

        {/* Ajakan main + dasar informasi, disatukan dalam satu bidang pink
            supaya penutup halaman tidak jadi dua blok besar berturut-turut. */}
        <section className="border-t py-12">
          <Reveal className="grain surface-brand relative overflow-hidden rounded-3xl p-6 sm:p-8">
            <div className="relative z-1 grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <span className="flex size-10 items-center justify-center rounded-xl bg-white/60 text-surface-accent">
                  <ShieldCheck className="size-5" aria-hidden />
                </span>
                <h2 className="mt-4 font-heading text-lg font-semibold">
                  Dasar informasi di website ini
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-pop-foreground/80">
                  Persyaratan berlabel{" "}
                  <strong className="text-surface-accent">Resmi</strong> mengacu
                  pada Surat {site.officialSource.issuer} No.{" "}
                  {site.officialSource.number} tanggal {site.officialSource.date}.
                  Selebihnya berlabel{" "}
                  <strong className="text-surface-accent">Alumni</strong> —
                  praktik umum yang tetap perlu kamu konfirmasi ke Prodi.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <LinkButton
                    href="/tentang"
                    size="sm"
                    className="bg-surface-accent text-white hover:bg-surface-accent/85"
                  >
                    <FileText aria-hidden />
                    Tentang website ini
                  </LinkButton>
                  <Link
                    href="/download"
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-pop-foreground/80 hover:text-pop-foreground pointer-coarse:min-h-11"
                  >
                    <FolderDown className="size-4" aria-hidden />
                    Download Center
                  </Link>
                </div>
              </div>

              <Link
                href="/main"
                className="miring group flex items-center gap-3 rounded-2xl bg-white/70 p-4 shadow-sm ring-1 ring-white/70 sm:w-56 sm:flex-col sm:items-start"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-surface-accent text-white">
                  <Sparkles className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block font-heading text-sm font-semibold text-pop-foreground">
                    Lagi jenuh baca?
                  </span>
                  <span className="mt-0.5 block text-xs text-pop-foreground/75">
                    Uji hafalan alurmu lewat dua mini game.
                  </span>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-surface-accent">
                    Masuk Ruang Main
                    <ArrowRight
                      className="size-3.5 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </span>
              </Link>
            </div>
          </Reveal>
        </section>
      </div>
    </div>
  );
}
