import { allFaq, downloads, getStage, stages } from "@/lib/data";

export type ResultKind = "Tahapan" | "Template" | "FAQ" | "Tips";

export type SearchEntry = {
  id: string;
  kind: ResultKind;
  title: string;
  subtitle: string;
  href: string;
  /** Teks gabungan yang dicocokkan dengan kata kunci. */
  haystack: string;
};

/**
 * Indeks pencarian, dibangun dari seluruh JSON: tahapan, template, FAQ, tips.
 *
 * Berkas tersendiri supaya bisa dimuat belakangan. Sebelumnya indeks ini
 * dirakit di module scope komponen kotak pencarian — komponen klien yang ada
 * di header setiap halaman. Akibatnya `stages.json` (77 KB), `faq.json`, dan
 * `downloads.json` ikut ke bundel peramban di semua halaman, dan haystack-nya
 * dirangkai untuk setiap tahap, template, FAQ, dan tips sebelum seorang pun
 * menekan tombol cari.
 *
 * Kotak pencarian hanya perlu data ini setelah dibuka. Jadi sekarang ongkosnya
 * dibayar saat itu, bukan oleh semua orang di setiap kunjungan.
 */
export const indeks: SearchEntry[] = [
  ...stages.map((stage) => ({
    id: `stage-${stage.slug}`,
    kind: "Tahapan" as const,
    title: stage.title,
    subtitle: `Tahap ${stage.order} · ${stage.estimatedDuration}`,
    href: `/tahapan/${stage.slug}`,
    haystack: [
      stage.title,
      stage.shortTitle,
      stage.description,
      stage.goal,
      ...stage.requirements.map((r) => r.text),
      ...stage.documents.map((d) => d.name),
      ...stage.steps.map((s) => `${s.title} ${s.detail}`),
      ...stage.checklist.map((c) => c.label),
    ].join(" "),
  })),
  ...downloads.map((item) => ({
    id: `download-${item.id}`,
    kind: "Template" as const,
    title: item.name,
    subtitle: `${item.format} · ${getStage(item.stage)?.title ?? item.stage}`,
    href: `/download#${item.id}`,
    haystack: `${item.name} ${item.description} ${item.format}`,
  })),
  ...allFaq.map((item, i) => ({
    id: `faq-${i}`,
    kind: "FAQ" as const,
    title: item.question,
    subtitle: item.stage
      ? (getStage(item.stage)?.title ?? "Umum")
      : "Pertanyaan umum",
    href: item.stage ? `/tahapan/${item.stage}#faq` : "/faq",
    haystack: `${item.question} ${item.answer}`,
  })),
  ...stages.flatMap((stage) =>
    stage.tips.map((tip, i) => ({
      id: `tip-${stage.slug}-${i}`,
      kind: "Tips" as const,
      title: tip,
      subtitle: `Tips alumni · ${stage.title}`,
      href: `/tahapan/${stage.slug}#tips`,
      haystack: tip,
    })),
  ),
];

// Fungsi pencocokannya sengaja TIDAK di sini, melainkan di komponen kotak
// pencarian. Ia logika murni tanpa data — dan kalau diletakkan di modul ini,
// mengimpornya akan ikut menarik `indeks` di atas beserta seluruh JSON-nya,
// membatalkan tujuan pemisahan ini.
