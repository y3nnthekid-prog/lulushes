"use client";

import * as React from "react";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { site } from "@/lib/site";
import { useProgress } from "@/lib/progress";

/**
 * Modal disclaimer yang tampil sekali di kunjungan pertama.
 * Persetujuan disimpan di Local Storage, jadi tidak muncul lagi setelah disetujui.
 */
export function DisclaimerModal() {
  const { hydrated, disclaimerAccepted, acceptDisclaimer } = useProgress();
  const [agreed, setAgreed] = React.useState(false);

  // Dilepas dari DOM begitu disetujui. Membiarkannya tetap terpasang dengan
  // `open={false}` membuat Base UI menahan popup di keadaan setengah tertutup,
  // karena permintaan tutupnya sengaja diabaikan di bawah.
  if (!hydrated || disclaimerAccepted) return null;

  return (
    <Dialog
      open
      // Modal ini tidak bisa ditutup dengan Esc atau klik di luar —
      // persetujuan hanya melalui tombol.
      onOpenChange={() => {}}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md"
        aria-describedby="disclaimer-intro"
      >
        <DialogHeader>
          <div className="flex size-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <Compass className="size-5" aria-hidden />
          </div>
          <DialogTitle className="text-lg">
            {site.disclaimer.title}
          </DialogTitle>
          <DialogDescription id="disclaimer-intro">
            {site.disclaimer.intro}
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 text-sm text-muted-foreground">
          {site.disclaimer.points.map((point) => (
            <li key={point} className="flex gap-2.5">
              <span
                className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/50"
                aria-hidden
              />
              <span>{point}</span>
            </li>
          ))}
        </ul>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
          <Checkbox
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked === true)}
            className="mt-0.5"
          />
          <span>{site.disclaimer.consent}</span>
        </label>

        <Button
          size="lg"
          disabled={!agreed}
          onClick={acceptDisclaimer}
          className="w-full"
        >
          Mulai
        </Button>
      </DialogContent>
    </Dialog>
  );
}
