import stagesJson from "@/data/stages.json";
import downloadsJson from "@/data/downloads.json";
import faqJson from "@/data/faq.json";
import scheduleJson from "@/data/schedule.json";
import skpiJson from "@/data/skpi.json";
import kalenderJson from "@/data/kalender-akademik.json";

import type {
  DownloadItem,
  ExamCycle,
  FaqItem,
  KalenderAkademik,
  ScheduleConfig,
  SkpiConfig,
  Stage,
  StagePhase,
} from "@/lib/types";

/*
 * `site` pindah ke `@/lib/site` supaya komponen klien yang hanya butuh nama
 * website — header, modal penyangkalan, panel dukungan — tidak ikut menyeret
 * seluruh JSON yang diimpor berkas ini.
 *
 * Diteruskan kembali di sini demi pemanggil di sisi server, yang memang sudah
 * memuat data lainnya.
 */
export { site } from "@/lib/site";

export const schedule = scheduleJson as ScheduleConfig;

/**
 * Jam tenggat pendaftaran ujian, dicetak besar-besar di beranda.
 *
 * Ditulis terpisah, bukan dikorek dari kalimat `schedule.intro` lewat regex —
 * cara itu diam-diam berhenti bekerja begitu kalimatnya diedit. Sebagai
 * gantinya `jam-tenggat.test.ts` memastikan angka ini benar-benar dipakai
 * intro dan setiap tenggat ujian. Kalau Prodi mengubah jamnya, tesnya gagal
 * alih-alih beranda menampilkan dua jam berbeda di satu layar.
 */
export const JAM_TENGGAT = "16.00";

export const skpi = skpiJson as SkpiConfig;

/**
 * Kalender akademik universitas, terbit tiap tahun akademik lewat Keputusan
 * Rektor. Yang paling dicari mahasiswa tingkat akhir ada di sini: tanggal
 * wisuda dan jendela pendaftarannya di AIS.
 */
export const kalender = kalenderJson as KalenderAkademik;

/** Ujian bulanan yang mengurus sebuah tahapan, bila ada. */
export function getExamForStage(slug: string): ExamCycle | undefined {
  return schedule.exams.find((exam) => exam.stage === slug);
}

export const stages = (stagesJson as Stage[])
  .slice()
  .sort((a, b) => a.order - b.order);

export const downloads = downloadsJson as DownloadItem[];

/** FAQ global (halaman /faq) — belum termasuk FAQ per tahapan. */
export const generalFaq = faqJson as FaqItem[];

export const stageSlugs = stages.map((s) => s.slug);

export const totalStages = stages.length;

const stageBySlug = new Map(stages.map((s) => [s.slug, s]));

export function getStage(slug: string): Stage | undefined {
  return stageBySlug.get(slug);
}

export function getDownload(id: string): DownloadItem | undefined {
  return downloads.find((d) => d.id === id);
}

export function getDownloadsForStage(slug: string): DownloadItem[] {
  return downloads.filter((d) => d.stage === slug);
}

/** Template yang direferensikan sebuah tahapan, dalam urutan yang ditulis di data. */
export function getStageDownloads(stage: Stage): DownloadItem[] {
  return stage.downloads
    .map((id) => getDownload(id))
    .filter((d): d is DownloadItem => Boolean(d));
}

export const phases: StagePhase[] = ["Proposal", "Skripsi", "Ujian", "Kelulusan"];

export function getStagesByPhase(phase: StagePhase): Stage[] {
  return stages.filter((s) => s.phase === phase);
}

/** Seluruh FAQ (global + per tahapan) untuk halaman FAQ dan pencarian. */
export const allFaq: FaqItem[] = [
  ...generalFaq,
  ...stages.flatMap((stage) =>
    stage.faq.map((item) => ({ ...item, stage: stage.slug })),
  ),
];

/** Jumlah seluruh item checklist di semua tahapan — penyebut progres global. */
export const totalChecklistItems = stages.reduce(
  (total, stage) => total + stage.checklist.length,
  0,
);

/** Sisa estimasi waktu dari sebuah tahapan sampai selesai, sebagai teks. */
export function stagesRemaining(slug: string): number {
  const stage = getStage(slug);
  if (!stage) return totalStages;
  return totalStages - stage.order;
}
