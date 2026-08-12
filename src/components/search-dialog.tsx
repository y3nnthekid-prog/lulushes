"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, HelpCircle, Lightbulb, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
// Hanya tipe — impor tipe dihapus saat build, jadi datanya tidak ikut terseret.
// Mengimpor `cari` dari modul yang sama akan membatalkan seluruh perubahan ini,
// karena modul itu juga merakit `indeks` dari JSON.
import type { ResultKind, SearchEntry } from "@/lib/indeks-pencarian";
import { cn } from "@/lib/utils";

/*
 * Indeksnya pindah ke `@/lib/indeks-pencarian` dan dimuat belakangan.
 *
 * Kotak pencarian ini duduk di header setiap halaman. Selama indeksnya
 * dirakit di sini, stages.json (77 KB), faq.json, dan downloads.json ikut ke
 * bundel peramban di semua halaman — dan haystack tiap tahap, template, FAQ,
 * serta tips dirangkai sebelum seorang pun menekan tombol cari.
 */

const kindIcon: Record<ResultKind, React.ElementType> = {
  Tahapan: FileText,
  Template: FileText,
  FAQ: HelpCircle,
  Tips: Lightbulb,
};

/** Mencocokkan kata kunci; judul diprioritaskan, tahapan naik ke atas. */
function cari(query: string, dari: SearchEntry[]): SearchEntry[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  return dari
    .map((entry) => {
      const hay = entry.haystack.toLowerCase();
      if (!terms.every((t) => hay.includes(t))) return null;
      const title = entry.title.toLowerCase();
      const titleHits = terms.filter((t) => title.includes(t)).length;
      const score = titleHits * 10 + (entry.kind === "Tahapan" ? 5 : 0);
      return { entry, score };
    })
    .filter((r): r is { entry: SearchEntry; score: number } => r !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((r) => r.entry);
}

export function SearchDialog() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [indeks, setIndeks] = React.useState<SearchEntry[] | null>(null);
  const router = useRouter();

  /*
   * Indeksnya diambil begitu kotak ini dibuka pertama kali, lalu disimpan.
   * Impornya di dalam efek, bukan di puncak berkas, supaya datanya tidak ikut
   * ke bundel awal — itu seluruh alasan perubahan ini.
   */
  React.useEffect(() => {
    if (!open || indeks) return;
    let batal = false;
    import("@/lib/indeks-pencarian").then((m) => {
      if (!batal) setIndeks(m.indeks);
    });
    return () => {
      batal = true;
    };
  }, [open, indeks]);

  const results = React.useMemo(
    () => (indeks ? cari(query, indeks) : []),
    [query, indeks],
  );

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function openChange(next: boolean) {
    setOpen(next);
    if (!next) setQuery("");
  }

  function go(href: string) {
    openChange(false);
    router.push(href);
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        // Di bawah sm labelnya disembunyikan, jadi tombolnya menyusut jadi
        // ikon saja — tingginya cukup tapi lebarnya tinggal 40 piksel.
        className="gap-2 text-muted-foreground pointer-coarse:min-w-11 sm:min-w-52 sm:justify-start"
        aria-label="Cari tahapan, template, atau FAQ"
      >
        <Search aria-hidden />
        <span className="hidden sm:inline">Cari…</span>
        <kbd className="ml-auto hidden rounded border bg-muted px-1.5 font-sans text-[10px] sm:inline">
          Ctrl K
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={openChange}>
        <DialogContent className="top-24 max-w-lg translate-y-0 gap-0 p-0 sm:max-w-lg">
          <DialogTitle className="sr-only">Pencarian</DialogTitle>
          <DialogDescription className="sr-only">
            Cari tahapan, template, FAQ, dan tips alumni.
          </DialogDescription>

          <div className="flex items-center gap-2 border-b px-3 py-2.5">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <Input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari tahapan, template, FAQ, tips…"
              className="h-7 border-0 px-0 focus-visible:ring-0"
            />
          </div>

          <div className="max-h-[min(60vh,26rem)] overflow-y-auto p-1.5">
            {query.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Ketik untuk mencari. Coba{" "}
                <button
                  type="button"
                  className="underline underline-offset-3"
                  onClick={() => setQuery("turnitin")}
                >
                  turnitin
                </button>
                ,{" "}
                <button
                  type="button"
                  className="underline underline-offset-3"
                  onClick={() => setQuery("skpi")}
                >
                  skpi
                </button>
                , atau{" "}
                <button
                  type="button"
                  className="underline underline-offset-3"
                  onClick={() => setQuery("bimbingan")}
                >
                  bimbingan
                </button>
                .
              </p>
            )}

            {query.length > 0 && results.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Tidak ada hasil untuk &ldquo;{query}&rdquo;.
              </p>
            )}

            <ul>
              {results.map((entry) => {
                const Icon = kindIcon[entry.kind];
                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => go(entry.href)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left",
                        "hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
                      )}
                    >
                      <Icon
                        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {entry.title}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {entry.subtitle}
                        </span>
                      </span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {entry.kind}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            Tidak menemukan yang kamu cari?{" "}
            <Link
              href="/faq"
              onClick={() => openChange(false)}
              className="underline underline-offset-3"
            >
              Buka FAQ
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
