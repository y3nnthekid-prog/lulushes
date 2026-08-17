import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  ExternalLink,
  FileText,
  FolderDown,
  Gamepad2,
  ListChecks,
  MapPin,
  MessageCircleQuestion,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Hero } from "@/components/hero";
import { KalenderRingkas } from "@/components/kalender-ringkas";
import { LinkButton } from "@/components/link-button";
import { PositionCard } from "@/components/position-card";
import { Reveal } from "@/components/reveal";
import { Roadmap } from "@/components/roadmap";
import { TiltCard } from "@/components/tilt-card";
import {
  JAM_TENGGAT,
  getStagesByPhase,
  phases,
  schedule,
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
    answer: "Langkah berurutan dan checklist yang tersimpan sendiri secara otomatis.",
  },
  {
    icon: FolderDown,
    question: "Butuh dokumen apa?",
    answer: "Template dikelompokkan per tahap, bukan satu tumpukan.",
  },
  {
    icon: ArrowRight,
    question: "Habis ini apa?",
    answer: "Tiap halaman menutup dengan rincian tahap sesudahnya.",
  },
];

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <div className="space-y-16 pb-16">
      <Hero />

      <div className="mx-auto max-w-5xl px-4 space-y-16">
        {/* Bento Grid: Posisi Kamu & Chat Senior 23:47 */}
        <section className="grid gap-6 grid-cols-1 lg:grid-cols-[21.5rem_1fr] lg:items-start">
          <Reveal>
            <PositionCard className="w-full" />
          </Reveal>

          <Reveal delay={90} className="lg:pt-1">
            <div className="rounded-3xl border border-border/80 bg-card/60 p-6 sm:p-8 backdrop-blur-xl shadow-lg">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-brand/15 text-brand">
                  <MessageCircleQuestion className="size-4" aria-hidden />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-brand">
                  Solusi Praktis Mahasiswa
                </span>
              </div>

              <h2 className="mt-3 font-heading text-2xl font-bold tracking-tight text-balance sm:text-3xl">
                Empat pertanyaan yang bikin kamu chat senior jam 11 malam
              </h2>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Semuanya sudah dijawab lengkap di sini. Setiap halaman menjawab
                keempatnya sekaligus — tidak ada lagi informasi yang digantung.
              </p>

              <div className="mt-5 flex items-center gap-2 text-xs font-mono text-muted-foreground">
                <span className="h-px flex-1 bg-border" aria-hidden />
                <span className="rounded-full bg-muted px-2.5 py-0.5 font-semibold text-brand">
                  23.47 WIB
                </span>
                <span className="h-px flex-1 bg-border" aria-hidden />
              </div>

              <dl className="mt-5 space-y-4">
                {questions.map((item, i) => (
                  <div key={item.question} className="space-y-1.5">
                    <dt className="flex justify-end">
                      <Reveal
                        delay={140 + i * 90}
                        className="max-w-[88%] rounded-2xl rounded-br-xs bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground shadow-md shadow-brand/20 transition-transform duration-200 hover:scale-[1.02]"
                      >
                        {item.question}
                      </Reveal>
                    </dt>
                    <dd className="flex justify-start pr-4 sm:pr-8">
                      <Reveal
                        delay={180 + i * 90}
                        className="card-lift flex max-w-[94%] items-start gap-3 rounded-2xl rounded-bl-xs border border-border/90 bg-card/90 px-4 py-3 text-sm shadow-xs backdrop-blur-sm"
                      >
                        <item.icon
                          className="mt-0.5 size-4.5 shrink-0 text-brand"
                          aria-hidden
                        />
                        <span className="text-foreground/90 font-medium leading-relaxed">
                          {item.answer}
                        </span>
                      </Reveal>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </section>

        {/* Perjalananmu, Empat Fase */}
        <section className="rounded-3xl border border-border/80 bg-card/40 p-6 sm:p-8 backdrop-blur-md shadow-lg">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-brand">
                  Navigasi Runtut
                </span>
                <h2 className="mt-1 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                  Perjalananmu, empat fase
                </h2>
              </div>
              <LinkButton
                href="/roadmap"
                variant="outline"
                size="sm"
                className="gap-1.5 border-brand/30 bg-background/80 hover:bg-brand-soft hover:text-brand"
              >
                Buka Roadmap Lengkap
                <ArrowRight className="size-3.5" aria-hidden data-icon="inline-end" />
              </LinkButton>
            </div>

            <div className="journey-bar mt-5 h-3 w-full rounded-full" aria-hidden />

            <ol className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {phases.map((phase) => {
                const count = getStagesByPhase(phase).length;
                const style = phaseStyle(phase);
                return (
                  <li
                    key={phase}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/70 p-2.5 transition-transform duration-200 hover:scale-[1.02]"
                  >
                    <span
                      className={cn("size-3.5 shrink-0 rounded-full shadow-xs", style.dot)}
                      aria-hidden
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {phase}
                      </span>
                      <span className="block text-xs text-muted-foreground tabular-nums">
                        {count} tahapan
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

        {/* Siklus Ujian Bulanan & Deadline 16.00 WIB */}
        <section className="rounded-3xl border border-border/80 bg-gradient-to-b from-card/80 to-card/40 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
          <Reveal>
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-brand/15 text-brand shadow-xs">
                <CalendarClock className="size-5" aria-hidden />
              </span>
              <h2 className="font-heading text-xs font-bold tracking-[0.18em] text-brand uppercase">
                {schedule.heading}
              </h2>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row sm:items-baseline gap-2">
              <p className="font-heading text-[clamp(3.2rem,9vw,4.5rem)] leading-[0.88] font-black tracking-tight tabular-nums text-foreground">
                {JAM_TENGGAT}
                <span className="ml-3 align-baseline text-[0.32em] font-bold tracking-normal text-brand">
                  WIB
                </span>
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold text-brand">
                <span className="size-2 rounded-full bg-brand animate-ping" />
                Tenggat Keras Bulanan
              </span>
            </div>

            <p className="mt-3 max-w-lg text-base font-semibold text-balance text-foreground">
              Jam yang sama untuk setiap pendaftaran ujian — apa pun ujiannya,
              periode ke berapa pun.
            </p>

            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {schedule.intro}
            </p>
          </Reveal>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {schedule.exams.map((exam, i) => (
              <Reveal key={exam.id} delay={90 + i * 80}>
                <TiltCard
                  maxTilt={5}
                  className="h-full"
                  cardClassName="card-lift flex flex-col h-full rounded-2xl border-border/90 bg-card p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-mono font-semibold text-muted-foreground uppercase">
                      Ujian #{i + 1}
                    </span>
                    <span className="size-2 rounded-full bg-brand" />
                  </div>
                  <h3 className="mt-3 font-heading text-base font-bold text-foreground">
                    {exam.name}
                  </h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground leading-relaxed">
                    {exam.schedulePattern}
                  </p>
                  <div className="mt-4 rounded-xl border border-brand/20 bg-brand-soft/80 px-3 py-2 text-xs font-semibold text-brand">
                    Tenggat: {exam.deadlinePattern}
                  </div>
                  <a
                    href={exam.registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand underline-offset-4 hover:underline pointer-coarse:min-h-11"
                  >
                    Buka Formulir Pendaftaran
                    <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                </TiltCard>
              </Reveal>
            ))}
          </div>

          <Reveal delay={140}>
            <p className="mt-5 rounded-2xl border border-warn/30 bg-warn-muted/80 p-4 text-xs font-medium text-foreground/90 flex items-start gap-2.5 backdrop-blur-sm">
              <span className="font-bold text-warn shrink-0">⚠️ PENTING:</span>
              <span>{schedule.warning}</span>
            </p>
          </Reveal>
        </section>

        {/* Kalender Akademik Ringkas */}
        <section className="rounded-3xl border border-border/80 bg-card/50 p-6 sm:p-8 backdrop-blur-md shadow-lg">
          <Reveal>
            <KalenderRingkas />
          </Reveal>
        </section>

        {/* Asymmetrical Bento Lounge: Download Center + Ruang Main */}
        <section>
          <Reveal className="grid gap-6 grid-cols-1 lg:grid-cols-12 items-stretch">
            {/* Download Center & Dasar Informasi (7 Kolom di Desktop) */}
            <div className="lg:col-span-7 grain surface-brand relative overflow-hidden rounded-[2rem] border border-white/20 p-6 sm:p-8 flex flex-col justify-between shadow-xl min-h-[300px]">
              <div className="relative z-1">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-white/70 text-surface-accent shadow-md shadow-brand/20">
                  <ShieldCheck className="size-6" aria-hidden />
                </span>
                <h2 className="mt-4 font-heading text-xl font-bold">
                  Dasar informasi di website ini
                </h2>
                <p className="mt-2 text-sm text-pop-foreground/85 leading-relaxed">
                  Persyaratan berlabel{" "}
                  <strong className="text-surface-accent font-bold">Resmi</strong>{" "}
                  mengacu pada SK Dekan Fakultas Syariah dan Hukum.
                  Selebihnya berlabel{" "}
                  <strong className="text-surface-accent font-bold">Alumni</strong>{" "}
                  — praktik lapangan umum yang tetap perlu kamu konfirmasi ke Prodi.
                </p>
              </div>

              <div className="relative z-1 mt-6 flex flex-wrap gap-2.5">
                <LinkButton
                  href="/tentang"
                  size="sm"
                  className="bg-surface-accent text-white shadow-md shadow-brand/30 hover:bg-surface-accent/85"
                >
                  <FileText aria-hidden />
                  Tentang website ini
                </LinkButton>
                <Link
                  href="/download"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white/70 px-3.5 py-2 text-sm font-semibold text-pop-foreground shadow-xs transition-transform hover:scale-105 hover:bg-white pointer-coarse:min-h-11"
                >
                  <FolderDown className="size-4" aria-hidden />
                  Download 25 Template
                </Link>
              </div>
            </div>

            {/* Ruang Main 3D Card (5 Kolom di Desktop) */}
            <TiltCard
              maxTilt={7}
              className="lg:col-span-5"
              cardClassName="glass-surface border-white/20 p-6 sm:p-8 flex flex-col justify-between rounded-[2rem] shadow-xl group cursor-pointer min-h-[300px]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-brand text-brand-foreground shadow-md shadow-brand/30">
                    <Sparkles className="size-6" aria-hidden />
                  </span>
                  <span className="rounded-full bg-brand/20 px-3 py-1 text-xs font-semibold text-brand">
                    4 Mini Games
                  </span>
                </div>

                <h3 className="mt-5 font-heading text-xl font-bold text-foreground">
                  Lagi jenuh nulis skripsi?
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Uji pemahaman alur kelulusanmu lewat game interaktif: Blast Berkas, Lari Wisuda, Tebak Tahap, dan Urutkan Alur!
                </p>
              </div>

              <Link
                href="/main"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 px-4 font-semibold text-sm text-brand-foreground shadow-lg shadow-brand/25 transition-all duration-200 group-hover:scale-[1.02] active:scale-[0.98]"
              >
                <Gamepad2 className="size-4" aria-hidden />
                Masuk Ruang Main
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </Link>
            </TiltCard>
          </Reveal>
        </section>
      </div>
    </div>
  );
}
