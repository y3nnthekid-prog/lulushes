"use client";

import * as React from "react";
import Image from "next/image";
import { Heart, Mail, MessageSquareWarning, QrCode } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

const KATEGORI = [
  { nilai: "koreksi", label: "Koreksi informasi yang keliru" },
  { nilai: "fitur", label: "Usul fitur baru" },
  { nilai: "bug", label: "Lapor tampilan atau tombol yang rusak" },
  { nilai: "lain", label: "Lainnya" },
] as const;

/**
 * Kritik, saran, dan donasi.
 *
 * Formulirnya tidak mengirim apa pun ke server mana pun — ia hanya menyusun
 * surel lalu menyerahkannya ke aplikasi surel bawaan perangkat. Konsekuensinya
 * jujur: tidak ada basis data yang perlu dijaga, tidak ada data siapa pun yang
 * tersimpan di sini, dan pengirim melihat persis apa yang dikirim sebelum
 * menekan kirim.
 */
export function Dukungan() {
  const [kategori, setKategori] = React.useState<string>(KATEGORI[0].nilai);
  const [halaman, setHalaman] = React.useState("");
  const [pesan, setPesan] = React.useState("");

  const labelKategori =
    KATEGORI.find((k) => k.nilai === kategori)?.label ?? kategori;

  const subjek = `[Lulus HES] ${labelKategori}`;
  const badan = [
    pesan.trim(),
    "",
    halaman.trim() ? `Halaman terkait: ${halaman.trim()}` : "",
    "",
    "— dikirim dari halaman Dukungan Lulus HES",
  ]
    .filter((b, i, a) => !(b === "" && a[i - 1] === ""))
    .join("\n");

  const tautanSurel = `mailto:${site.dukungan.email}?subject=${encodeURIComponent(
    subjek,
  )}&body=${encodeURIComponent(badan)}`;

  const siap = pesan.trim().length >= 10;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Kritik dan saran */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <MessageSquareWarning className="size-4.5" aria-hidden />
          </span>
          <h3 className="font-heading text-base font-semibold">
            Kritik dan saran
          </h3>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          {site.dukungan.intro}
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label
              htmlFor="kategori-masukan"
              className="text-sm font-medium"
            >
              Jenis masukan
            </label>
            <select
              id="kategori-masukan"
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {KATEGORI.map((k) => (
                <option key={k.nilai} value={k.nilai}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="halaman-terkait" className="text-sm font-medium">
              Halaman terkait <span className="text-muted-foreground">(opsional)</span>
            </label>
            <Input
              id="halaman-terkait"
              value={halaman}
              onChange={(e) => setHalaman(e.target.value)}
              placeholder="misalnya /tahapan/munaqosyah"
              className="mt-1.5"
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="isi-masukan" className="text-sm font-medium">
              Masukanmu
            </label>
            <textarea
              id="isi-masukan"
              value={pesan}
              onChange={(e) => setPesan(e.target.value)}
              rows={5}
              placeholder="Tulis sedetail mungkin. Kalau ini koreksi aturan, sebutkan sumbernya kalau ada — itu yang paling menolong."
              className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {pesan.trim().length < 10
                ? "Minimal sepuluh huruf."
                : `${pesan.trim().length} huruf.`}
            </p>
          </div>

          {/* Memakai gaya tombol pada elemen <a> yang sebenarnya, bukan
              membungkus <a> di dalam komponen Button. Base UI menganggap
              Button sebagai <button> asli, dan menyusupkan <a> ke dalamnya
              menghapus semantik aslinya — persis peringatan yang muncul di
              konsol saat ini dicoba. */}
          <a
            href={siap ? tautanSurel : undefined}
            aria-disabled={!siap}
            className={cn(
              buttonVariants({ size: "lg" }),
              "w-full",
              !siap && "pointer-events-none opacity-50",
            )}
          >
            <Mail aria-hidden />
            Buka aplikasi surel
          </a>

          <p className="text-xs text-muted-foreground">
            Tombol ini membuka aplikasi surel di perangkatmu dengan isian yang
            sudah terisi. Tidak ada yang dikirim dari halaman ini, dan tidak ada
            satu pun yang tersimpan di website.
          </p>
        </div>
      </div>

      {/* Donasi */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand text-brand-foreground">
            <Heart className="size-4.5" aria-hidden />
          </span>
          <h3 className="font-heading text-base font-semibold">
            {site.dukungan.donasi.heading}
          </h3>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          {site.dukungan.donasi.catatan}
        </p>

        <figure className="mt-4">
          <div className="mx-auto w-fit rounded-2xl border bg-white p-3">
            <Image
              src={site.dukungan.donasi.qris}
              alt={`Kode QRIS untuk donasi kepada ${site.dukungan.donasi.nama}`}
              // Ditampilkan selebar 224 piksel; 448 memberi ketajaman dua
              // kali lipat untuk layar rapat tanpa mengunduh berkas 1080.
              width={448}
              height={448}
              className="h-auto w-56 max-w-full"
            />
          </div>
          <figcaption className="mt-3 text-center text-sm">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <QrCode className="size-4 text-brand" aria-hidden />
              QRIS atas nama {site.dukungan.donasi.nama}
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Pindai lewat aplikasi bank atau dompet digital mana pun.
            </span>
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
