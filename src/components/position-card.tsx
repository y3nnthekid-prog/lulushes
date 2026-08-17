"use client";

import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

import { LinkButton } from "@/components/link-button";
import { ProgressRing } from "@/components/progress-ring";
import { StageIcon } from "@/components/stage-icon";
import { TiltCard } from "@/components/tilt-card";
import { WizardDialog } from "@/components/wizard-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { getStage, totalStages } from "@/lib/data";
import { phaseStyle } from "@/lib/phase";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

/**
 * Kartu "Posisi Anda" dengan 60fps 3D perspective tilt & layout bersih.
 */
export function PositionCard({ className }: { className?: string }) {
  const { hydrated, currentStage, stageProgress, overall, nextAction } =
    useProgress();

  if (!hydrated) {
    return (
      <Card className={cn("animate-pulse border-border/60 bg-card", className)}>
        <CardContent className="h-60" />
      </Card>
    );
  }

  const progress = stageProgress(currentStage.slug);
  const phase = phaseStyle(currentStage.phase);
  const next = currentStage.nextStage ? getStage(currentStage.nextStage) : null;
  const remaining = totalStages - currentStage.order;

  return (
    <TiltCard
      maxTilt={4}
      glowColor="rgba(255, 79, 163, 0.08)"
      className={className}
      cardClassName="border-border/80 bg-card/90 backdrop-blur-xl shadow-md"
    >
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
              <span className="relative flex size-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-brand" />
              </span>
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              <span>Posisi kamu sekarang</span>
            </div>

            <h2 className="mt-2.5 font-heading text-xl leading-tight font-bold tracking-tight text-balance text-foreground">
              <Link
                href={`/tahapan/${currentStage.slug}`}
                className="transition-colors hover:text-brand"
              >
                {currentStage.title}
              </Link>
            </h2>

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-xs",
                  phase.soft,
                )}
              >
                <StageIcon name={currentStage.icon} className="size-3.5" />
                {currentStage.phase}
              </span>
              <span className="rounded-md bg-muted/60 px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
                Tahap {currentStage.order} dari {totalStages}
              </span>
            </div>
          </div>

          <div className="shrink-0 transition-transform duration-200 hover:scale-105">
            <ProgressRing
              percent={overall.percent}
              label={`${progress.done}/${progress.total}`}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-muted/40 p-3.5 backdrop-blur-sm">
          <p className="text-[11px] font-semibold tracking-wider text-brand uppercase">
            Aksi Berikutnya
          </p>
          <p className="mt-1 text-sm font-medium text-balance text-foreground">
            {nextAction
              ? nextAction.label
              : `Semua langkah tahap ini selesai. Lanjut ke ${
                  next ? next.title : "pengambilan ijazah"
                }.`}
          </p>
        </div>

        <div className="space-y-2">
          <LinkButton
            href={`/tahapan/${currentStage.slug}`}
            className="w-full shadow-md shadow-brand/20 transition-transform duration-200 hover:scale-[1.01] active:scale-[0.98]"
          >
            Buka Panduan Tahap
            <ArrowRight aria-hidden data-icon="inline-end" />
          </LinkButton>
          <WizardDialog
            label="Bukan di sini? Cek ulang posisi"
            variant="outline"
            size="sm"
            className="w-full border-border/80 text-xs font-medium transition-colors hover:bg-muted"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          {remaining === 0 || !next ? (
            "🎉 Ini adalah tahap akhir kelulusanmu!"
          ) : (
            <>
              Tersisa <strong className="text-foreground tabular-nums">{remaining} tahap</strong> lagi. Setelah ini:{" "}
              <Link
                href={`/tahapan/${next.slug}`}
                className="font-medium text-brand underline underline-offset-3 hover:text-foreground"
              >
                {next.title}
              </Link>
            </>
          )}
        </p>
      </div>
    </TiltCard>
  );
}
