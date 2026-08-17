"use client";

import * as React from "react";
import { ArrowRight, MousePointerClick } from "lucide-react";

import { CountUp } from "@/components/count-up";
import { InteractiveParticleCanvas } from "@/components/interactive-particle-canvas";
import { KataBerputar } from "@/components/kata-berputar";
import { LinkButton } from "@/components/link-button";
import { StageIcon } from "@/components/stage-icon";
import { WizardDialog } from "@/components/wizard-dialog";
import { downloads, stages, totalStages } from "@/lib/data";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

const JUDUL = "Berhenti menebak-nebak";

const ikonMengambang = [
  { i: 0, top: "10%", right: "5%", dur: "5.4s", delay: "0s", kecil: true },
  { i: 4, top: "56%", right: "8%", dur: "4.6s", delay: "0.8s", kecil: true },
  { i: 10, top: "31%", right: "20%", dur: "6.2s", delay: "0.4s", kecil: true },
  { i: 2, top: "76%", right: "24%", dur: "5.8s", delay: "1.2s", kecil: false },
  { i: 5, top: "14%", right: "35%", dur: "6.6s", delay: "0.2s", kecil: false },
  { i: 8, top: "48%", right: "43%", dur: "5.2s", delay: "1.6s", kecil: false },
];

export function Hero() {
  const siapUnduh = downloads.filter((d) => d.url !== null).length;
  const kata = JUDUL.split(" ");

  return (
    <section className="px-4 pt-4">
      <div className="aurora grain surface-brand relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-brand/20 px-6 py-12 shadow-xl shadow-brand/10 sm:px-10 sm:py-16">
        {/* Living interactive particle canvas */}
        <InteractiveParticleCanvas
          particleColor="rgba(156, 15, 80, 0.45)"
          lineColor="rgba(156, 15, 80, 0.15)"
          maxParticles={32}
          className="opacity-70"
        />

        {/* Gumpalan aurora ketiga */}
        <span className="aurora-3" aria-hidden />

        {/* Ikon tahap yang mengambang dengan glassmorphism & micro-spring */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {ikonMengambang.map((f) => {
            const stage = stages[f.i];
            if (!stage) return null;
            return (
              <span
                key={stage.slug}
                className={cn(
                  "float-soft absolute flex items-center justify-center rounded-2xl bg-white/60 text-surface-accent shadow-md shadow-brand/10 ring-1 ring-white/80 backdrop-blur-md transition-transform duration-300",
                  "size-10 sm:size-12",
                  !f.kecil && "hidden md:flex",
                )}
                style={
                  {
                    top: f.top,
                    right: f.right,
                    "--dur": f.dur,
                    "--delay": f.delay,
                  } as React.CSSProperties
                }
              >
                <StageIcon name={stage.icon} className="size-4.5 sm:size-5.5" />
              </span>
            );
          })}
        </div>

        <div className="relative z-1 inline-flex items-center gap-2 rounded-full bg-white/70 px-3.5 py-1 text-xs font-semibold text-surface-accent shadow-xs ring-1 ring-black/5 backdrop-blur-md">
          <span className="relative flex size-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-surface-accent opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-surface-accent" />
          </span>
          {site.program} • {site.faculty}
        </div>

        {/* Judul kinetik */}
        <h1 className="relative z-1 mt-5 font-heading text-[clamp(2.2rem,6.8vw,4.85rem)] leading-[1.01] font-extrabold tracking-[-0.035em] text-pretty">
          {kata.map((k, i) => (
            <React.Fragment key={`${k}-${i}`}>
              <span
                className="word-rise"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                {k}
              </span>{" "}
            </React.Fragment>
          ))}
          <span
            className="word-rise"
            style={{ animationDelay: `${kata.length * 90}ms` }}
          >
            <KataBerputar />
          </span>
        </h1>

        {/* Garis perjalanan yang menggambar dirinya sendiri */}
        <svg
          viewBox="0 0 640 40"
          className="relative z-1 mt-6 h-8 w-full max-w-lg"
          fill="none"
          aria-hidden
        >
          <path
            d="M4 30 C 120 30, 130 8, 240 8 S 400 32, 512 20 S 610 8, 636 10"
            stroke="var(--surface-accent)"
            strokeWidth="3"
            strokeLinecap="round"
            className="draw-line"
            style={{ "--len": 760 } as React.CSSProperties}
            opacity="0.65"
          />
          <circle cx="636" cy="10" r="5" fill="var(--surface-accent)" />
        </svg>

        <p className="relative z-1 mt-4 max-w-2xl text-base font-medium text-pop-foreground/85 text-pretty sm:text-lg">
          Dari persiapan proposal sampai ijazah di tangan — satu alur runtut,
          lengkap dengan tenggat resmi yang paling sering bikin mahasiswa
          mengulang.
        </p>

        {/* Ajakan utama dengan haptic spring feel */}
        <div className="relative z-1 mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
          <WizardDialog
            label="Cek, aku di tahap mana?"
            className="w-full rounded-xl bg-surface-accent text-white shadow-lg shadow-brand/30 transition-all duration-200 hover:scale-[1.02] hover:bg-surface-accent/90 active:scale-[0.98] sm:w-auto"
          />
          <LinkButton
            href="/roadmap"
            size="lg"
            className="rounded-xl border-black/15 bg-white/80 text-pop-foreground backdrop-blur-md transition-all duration-200 hover:scale-[1.02] hover:bg-white active:scale-[0.98] dark:border-black/15 dark:bg-white/80 dark:hover:bg-white"
            variant="outline"
          >
            Lihat roadmap
            <ArrowRight aria-hidden data-icon="inline-end" />
          </LinkButton>
        </div>

        <p className="relative z-1 mt-3.5 flex items-center gap-1.5 text-sm font-medium text-pop-foreground/80">
          <MousePointerClick className="size-4 shrink-0 text-surface-accent" aria-hidden />
          Klik di situ: sepuluh pertanyaan singkat, langsung ketahuan tahapmu
          sekarang dan apa lanjutannya.
        </p>

        {/* Dynamic Metric Badges */}
        <dl className="relative z-1 mt-8 flex flex-wrap gap-x-8 gap-y-4 border-t border-black/10 pt-6">
          {[
            { label: "Tahapan Lengkap", value: totalStages },
            { label: "Template Dokumen", value: downloads.length },
            { label: "Siap Unduh Langsung", value: siapUnduh },
          ].map((stat) => (
            <div key={stat.label} className="transition-transform duration-200 hover:translate-y-[-2px]">
              <dd className="font-heading text-3xl leading-none font-extrabold tracking-tight">
                <CountUp value={stat.value} />
              </dd>
              <dt className="mt-1 text-xs font-semibold text-pop-foreground/80">
                {stat.label}
              </dt>
            </div>
          ))}
          <div className="transition-transform duration-200 hover:translate-y-[-2px]">
            <dd className="font-heading text-3xl leading-none font-extrabold tracking-tight">
              100% Gratis
            </dd>
            <dt className="mt-1 text-xs font-semibold text-pop-foreground/80">Tanpa akun / registrasi</dt>
          </div>
        </dl>
      </div>
    </section>
  );
}
