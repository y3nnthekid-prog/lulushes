import type { Metadata } from "next";

import { Breadcrumb } from "@/components/breadcrumb";
import { JadwalWisuda } from "@/components/jadwal-wisuda";
import { KalenderAkademik } from "@/components/kalender-akademik";
import { Reveal } from "@/components/reveal";
import { kalender } from "@/lib/data";

export const metadata: Metadata = {
  title: "Kalender Akademik",
  description:
    "Kalender akademik UIN Jakarta beserta penanggalan Hijriah dan hari puasa sunnah. Jadwal wisuda, tenggat pembayaran UKT, pengajuan cuti, dan pengisian e-RS dalam satu tampilan bulanan.",
  alternates: { canonical: "/kalender" },
};

export default function KalenderPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumb items={[{ label: "Kalender Akademik" }]} />

      <Reveal as="section" className="mt-4">
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Kalender akademik {kalender.sumber.tahunAkademik}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Tenggat administrasi dan jadwal wisuda dari {kalender.sumber.keputusan},
          disandingkan dengan penanggalan Hijriah dan hari-hari puasa sunnah.
          Klik tanggal mana pun untuk melihat isinya.
        </p>
      </Reveal>

      <Reveal delay={90} className="mt-6">
        <KalenderAkademik />
      </Reveal>

      <Reveal delay={140} className="mt-10">
        <JadwalWisuda />
      </Reveal>
    </div>
  );
}
