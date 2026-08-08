/**
 * Tipe data untuk seluruh konten Lulus HES.
 *
 * Semua konten website berasal dari file JSON di `src/data`.
 * Tidak ada teks tahapan yang ditulis langsung di komponen.
 */

/** Sumber sebuah informasi. Dipakai untuk menandai mana yang resmi, mana yang perlu dikonfirmasi. */
export type SourceLevel =
  /** Tertulis pada Surat Dekan FSH No. B-252/F4/PP.01.1/01/2024. */
  | "resmi"
  /** Praktik umum / pengalaman alumni. Sebaiknya dikonfirmasi ke Prodi. */
  | "alumni";

export type Fact = {
  text: string;
  source: SourceLevel;
};

export type StageDocument = {
  name: string;
  note?: string;
  source: SourceLevel;
};

export type StageStep = {
  title: string;
  detail: string;
  /** Siapa yang mengerjakan / dituju pada langkah ini. */
  actor?: string;
};

export type ChecklistItem = {
  id: string;
  label: string;
};

export type FaqItem = {
  question: string;
  answer: string;
  /** Slug tahapan terkait, untuk halaman FAQ global. */
  stage?: string;
};

export type ImportantLink = {
  label: string;
  url: string;
  note?: string;
};

export type StagePhase = "Proposal" | "Skripsi" | "Ujian" | "Kelulusan";

export type Stage = {
  /** Urutan tahap, dimulai dari 1. */
  order: number;
  slug: string;
  title: string;
  /** Judul pendek untuk node roadmap dan breadcrumb. */
  shortTitle: string;
  /** Nama ikon lucide-react (lihat `src/lib/icons.ts`). */
  icon: string;
  phase: StagePhase;
  description: string;
  /** Apa yang ingin dicapai di tahap ini. Satu kalimat. */
  goal: string;
  estimatedDuration: string;
  requirements: Fact[];
  documents: StageDocument[];
  steps: StageStep[];
  checklist: ChecklistItem[];
  /** Batas waktu / jebakan administratif yang bikin mahasiswa mengulang. */
  warnings: Fact[];
  tips: string[];
  faq: FaqItem[];
  /** Id template pada `downloads.json`. */
  downloads: string[];
  importantLinks: ImportantLink[];
  previousStage: string | null;
  nextStage: string | null;
  /** Modul tambahan yang dirender di halaman tahapan, misalnya "skpi". */
  extras?: string[];
};

export type DownloadStatus =
  /** File sudah diunggah dan tautannya aktif. */
  | "tersedia"
  /** Metadata sudah ada, file belum diunggah ke Google Drive. */
  | "menunggu-unggah"
  /** Ada, tetapi kemungkinan sudah berubah — konfirmasi ke Prodi dulu. */
  | "perlu-verifikasi";

export type DownloadItem = {
  id: string;
  name: string;
  description: string;
  /** Slug tahapan pemilik template. */
  stage: string;
  version: string;
  format: string;
  size: string;
  status: DownloadStatus;
  /** ISO date, kapan metadata / file terakhir diperbarui. */
  updatedAt: string;
  /** Tautan Google Drive. `null` berarti belum diunggah. */
  url: string | null;
};

/** Satu jenis ujian dalam siklus bulanan Prodi. */
export type ExamCycle = {
  id: string;
  /** Slug tahapan yang diurus oleh ujian ini. */
  stage: string;
  name: string;
  schedulePattern: string;
  deadlinePattern: string;
  /** Contoh tanggal dari satu periode nyata, untuk memberi gambaran. */
  example: string;
  registrationUrl: string;
  requirement: string;
};

export type ScheduleConfig = {
  heading: string;
  intro: string;
  warning: string;
  exams: ExamCycle[];
  reminders: string[];
};

/**
 * Rentang tanggal kalender, ditulis ISO (YYYY-MM-DD).
 *
 * Sengaja ISO, bukan kalimat siap-tampil seperti "1 September – 19 Oktober
 * 2026". Kalender di beranda perlu membandingkan tanggal dengan hari ini
 * untuk menandai apa yang sedang berlangsung, dan kalimat tidak bisa
 * dibandingkan. Teks tampilannya dibangkitkan dari sini oleh `formatRentang`,
 * jadi yang terbaca dan yang terhitung tidak mungkin berbeda.
 */
export type Rentang = {
  mulai: string;
  selesai: string;
};

/** Satu gelombang wisuda beserta jendela pendaftarannya. */
export type Wisuda = {
  ke: number;
  pendaftaran: Rentang;
  penyerahanPeserta: string;
  gladiResik: string;
  pelaksanaan: Rentang;
};

/** Tanggal administratif satu semester yang menyangkut mahasiswa tingkat akhir. */
export type SemesterAkademik = {
  nama: string;
  perkuliahan: Rentang;
  pembayaranUkt: Rentang;
  pengajuanCuti: Rentang;
  pengisianErs: Rentang;
  validasiErs: Rentang;
  pengisianNilai: Rentang;
};

/**
 * Kalender akademik universitas.
 *
 * Berbeda dari `schedule.json` yang mengurus siklus ujian bulanan Prodi: yang
 * ini terbit setahun sekali lewat Keputusan Rektor dan mengatur hal-hal
 * setingkat universitas — kapan wisuda digelar dan kapan pendaftarannya
 * dibuka di AIS. Sengaja disimpan terpisah supaya penggantian tahunannya
 * tidak menyentuh data Prodi.
 */
export type KalenderAkademik = {
  sumber: {
    judul: string;
    keputusan: string;
    ditetapkan: string;
    tahunAkademik: string;
    berkas: string;
    /** Sumbu waktu kalender: dari agenda paling awal sampai paling akhir. */
    mulai: string;
    selesai: string;
  };
  wisuda: Wisuda[];
  semester: SemesterAkademik[];
};

export type SkpiEntry = {
  nama: string;
  kategori: string;
  jenis: string;
  tingkat: string;
};

export type SkpiConfig = {
  heading: string;
  intro: string;
  rules: string[];
  entries: SkpiEntry[];
  note: string;
};

export type SiteConfig = {
  name: string;
  tagline: string;
  description: string;
  program: string;
  faculty: string;
  university: string;
  /** Alamat kanonik website, dipakai metadata dan sitemap. */
  url: string;
  officialSource: {
    title: string;
    number: string;
    date: string;
    issuer: string;
  };
  /** Folder Google Drive berisi seluruh template. */
  driveFolderUrl: string | null;
  disclaimer: {
    title: string;
    intro: string;
    points: string[];
    consent: string;
  };
  contacts: ImportantLink[];
  about: {
    heading: string;
    paragraphs: string[];
  };
  dukungan: {
    heading: string;
    intro: string;
    /** Alamat tujuan kritik dan saran; tampil publik di halaman Tentang. */
    email: string;
    donasi: {
      heading: string;
      nama: string;
      catatan: string;
      /** Berkas gambar QRIS di folder public. */
      qris: string;
    };
  };
};
