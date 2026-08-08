"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Compass,
  FolderDown,
  HelpCircle,
  Info,
  ListChecks,
  Map,
  Menu,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";

import { SearchDialog } from "@/components/search-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { site } from "@/lib/data";
import { halaman } from "@/lib/navigasi";
import { useProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

/**
 * Ikon tiap halaman.
 *
 * Daftar halamannya sendiri ada di `@/lib/navigasi` — satu sumber yang juga
 * dipakai footer dan sitemap. Yang tinggal di sini hanya ikonnya, karena cuma
 * di sinilah ikon itu digambar.
 */
const ikonHalaman: Record<string, LucideIcon> = {
  "/": Compass,
  "/roadmap": Map,
  "/tahapan": ListChecks,
  "/kalender": CalendarDays,
  "/download": FolderDown,
  "/main": Sparkles,
  "/faq": HelpCircle,
  "/tentang": Info,
};

const navItems = halaman.map((h) => ({
  ...h,
  icon: ikonHalaman[h.href] ?? Compass,
}));

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const { hydrated, overall } = useProgress();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-medium transition-transform hover:scale-[1.03] pointer-coarse:min-h-11"
        >
          <span className="flex size-8 items-center justify-center rounded-xl bg-brand text-brand-foreground shadow-sm shadow-brand/30">
            <Compass className="size-4.5" aria-hidden />
          </span>
          <span className="font-heading text-base">{site.name}</span>
        </Link>

        {/* Navigasi layar lebar. Tautannya diperbesar dan diberi garis bawah
            yang melebar saat aktif, supaya halaman yang sedang dibuka kelihatan
            tanpa perlu membaca. */}
        <nav className="ml-3 hidden items-center gap-0.5 md:flex">
          {navItems.slice(1).map((item) => {
            const aktif = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={aktif ? "page" : undefined}
                className={cn(
                  "relative rounded-lg px-3 py-2 text-[0.95rem] transition-colors",
                  aktif
                    ? "font-semibold text-brand"
                    : "text-muted-foreground hover:bg-brand-soft/70 hover:text-foreground",
                )}
              >
                {item.label}
                <span
                  className={cn(
                    "absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-brand transition-transform duration-300",
                    aktif ? "scale-x-100" : "scale-x-0",
                  )}
                  aria-hidden
                />
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <SearchDialog />
          <ThemeToggle />

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              render={
                <Button
                  size="sm"
                  className="gap-1.5 bg-brand px-3 text-brand-foreground shadow-sm shadow-brand/30 hover:bg-brand/90 md:hidden"
                  aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
                />
              }
            >
              <Menu aria-hidden />
              Menu
            </SheetTrigger>

            <SheetContent side="right" className="w-[19rem]">
              <SheetHeader className="flex-row items-center justify-between">
                <SheetTitle className="text-lg">Menu</SheetTitle>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Tutup menu"
                >
                  <X aria-hidden />
                </Button>
              </SheetHeader>

              {/* Sasaran sentuh dibesarkan ke 48px dan diberi ikon. Versi
                  sebelumnya berupa teks kecil satu warna, dan itu yang bikin
                  menunya susah dilihat di layar ponsel. */}
              <nav className="flex flex-col gap-1 px-3">
                {navItems.map((item) => {
                  const aktif = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      aria-current={aktif ? "page" : undefined}
                      className={cn(
                        "flex min-h-12 items-center gap-3 rounded-xl px-3 text-base transition-colors",
                        aktif
                          ? "bg-brand text-brand-foreground font-semibold shadow-sm shadow-brand/25"
                          : "text-foreground hover:bg-brand-soft",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-8 items-center justify-center rounded-lg",
                          aktif ? "bg-white/20" : "bg-brand-soft text-brand",
                        )}
                      >
                        {React.createElement(item.icon, {
                          className: "size-4",
                          "aria-hidden": true,
                        })}
                      </span>
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              {hydrated && overall.done > 0 && (
                <div className="mt-auto border-t px-5 py-4 text-sm text-muted-foreground">
                  Progres kamu:{" "}
                  <span className="font-semibold text-brand">
                    {overall.percent}%
                  </span>{" "}
                  ({overall.done}/{overall.total} langkah)
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
