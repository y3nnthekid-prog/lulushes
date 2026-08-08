import {
  allFaq,
  downloads,
  getStage,
  kalender,
  schedule,
  skpi,
  stages,
  totalStages,
} from "@/lib/data";
import { formatRentang, formatTanggal } from "@/lib/tanggal";
import type { SourceLevel } from "@/lib/types";

/**
 * Mesin jawab untuk asisten tanya jawab.
 *
 * Jawaban diambil dari data yang sudah ada di website, bukan dikarang. Kalau
 * tidak ada yang cocok, asisten mengaku tidak tahu dan mengarahkan ke Prodi —
 * jauh lebih aman daripada menebak untuk urusan administrasi kelulusan.
 */

export type AnswerKind =
  | "FAQ"
  | "Tahapan"
  | "Dokumen"
  | "Tenggat"
  | "Langkah"
  | "Template"
  | "Jadwal"
  | "Tips"
  | "SKPI";

/**
 * Entri yang hanya boleh muncul kalau pertanyaannya memang menanyakan urutan.
 * Tanpa gerbang ini, entri "Setelah Sidang Munaqosyah, apa berikutnya?" akan
 * merebut pertanyaan biasa seperti "syarat sidang munaqosyah" — judulnya
 * kebetulan memuat kata yang sama.
 */
export type Gate = "lanjut" | "balik";

export type Answer = {
  id: string;
  kind: AnswerKind;
  title: string;
  body: string;
  href?: string;
  hrefLabel?: string;
  source?: SourceLevel;
  gate?: Gate;
  /** Tahap yang menjadi asal entri ini, kalau ada. */
  stage?: string;
  /** Teks yang dicocokkan dengan pertanyaan. */
  haystack: string;
  /** Kata-kata judul dan isi, untuk pencocokan per kata. */
  titleWords: string[];
  bodyWords: string[];
  /** Bentuk dasar kata judul dan isi, untuk pencocokan lintas imbuhan. */
  titleStems: Set<string>;
  bodyStems: Set<string>;
};

/**
 * Singkatan dan ejaan alternatif yang lazim dipakai mahasiswa.
 *
 * Tiap nilai adalah daftar *alternatif*. Alternatif yang berisi spasi adalah
 * satu frasa utuh: seluruh katanya harus muncul supaya dianggap cocok.
 *
 * Perbedaan itu penting. "SKPI" membentang jadi "surat keterangan pendamping
 * ijazah"; kalau tiap katanya boleh cocok sendiri-sendiri, entri apa pun yang
 * menyebut "ijazah" ikut dianggap menjawab pertanyaan tentang SKPI — dan itu
 * benar-benar terjadi sebelum aturan frasa ini dipasang.
 *
 * Kata sepanjang dua huruf tidak pernah sampai ke sini karena disaring lebih
 * dulu, jadi singkatan seperti "PA" atau "TU" tidak didaftarkan.
 */
const aliases: Record<string, string[]> = {
  // "proposal" sendirian sudah cukup menandakan sempro di lingkungan ini —
  // tanpa alternatif itu, FAQ yang judulnya berbunyi "…mengajukan proposal
  // kalau SKS baru 95?" tidak dikenali sebagai jawaban soal sempro.
  sempro: ["seminar proposal", "proposal"],
  semprop: ["seminar proposal", "proposal"],
  kompre: ["komprehensif"],
  munaqosah: ["munaqosyah"],
  munaqasyah: ["munaqosyah"],
  munaqosyah: ["munaqasyah"],
  sidang: ["munaqosyah"],
  ttd: ["tanda tangan"],
  dosbing: ["dosen pembimbing"],
  pembimbing: ["dosen pembimbing"],
  kaprodi: ["ketua program studi"],
  sekprodi: ["sekretaris program studi"],
  prodi: ["program studi"],
  perpus: ["perpustakaan"],
  fsh: ["fakultas syariah hukum"],
  uin: ["universitas islam negeri"],
  skl: ["surat keterangan lulus"],
  skpi: ["surat keterangan pendamping ijazah"],
  krs: ["kartu rencana studi"],
  sks: ["satuan kredit semester"],
  ipk: ["indeks prestasi kumulatif"],
  gform: ["google form", "formulir"],
  form: ["formulir"],
  yudis: ["yudisium"],
  wisudaan: ["wisuda"],
  plagiasi: ["plagiarisme", "turnitin", "similarity"],
  turnitin: ["plagiasi", "similarity"],
  syarat: ["persyaratan"],
  berkas: ["dokumen"],
  ngurus: ["mengurus"],

  // Bentuk percakapan. Mahasiswa mengetik "milih", bukan "memilih" — dan
  // pemenggalan awalan otomatis untuk bahasa Indonesia terlalu sering salah
  // (misalnya "berkas" jadi "kas"), jadi bentuk yang memang sering dipakai
  // didaftarkan saja satu per satu.
  milih: ["memilih", "pilih"],
  ngisi: ["mengisi", "diisi", "pengisian"],
  isi: ["mengisi", "diisi", "pengisian"],
  ngambil: ["mengambil", "pengambilan"],
  ambil: ["mengambil", "pengambilan"],
  ngumpulin: ["mengumpulkan", "pengumpulan"],
  nyerahin: ["menyerahkan", "penyerahan"],
  ngajuin: ["mengajukan", "pengajuan"],
  ajuin: ["mengajukan", "pengajuan"],
  daftar: ["pendaftaran", "mendaftar"],
  ulang: ["mengulang", "pengulangan"],
  nunggu: ["menunggu"],
  ganti: ["mengganti", "penggantian"],
};

/**
 * Kata yang terlalu umum untuk membedakan jawaban.
 *
 * Termasuk di sini kata tanya dan penanda urutan. Sinyalnya tidak dibuang
 * begitu saja — `bacaMaksud` membacanya lebih dulu dari kalimat utuh, lalu
 * memakainya untuk mengangkat jenis jawaban yang cocok. Yang dibuang cuma
 * perannya sebagai kata kunci pencarian.
 */
const stopwords = new Set([
  "apa","apakah","yang","untuk","dari","dan","di","ke","itu","ini","saya","aku",
  "kamu","harus","bisa","boleh","gimana","bagaimana","kapan","berapa","kenapa",
  "mengapa","dengan","pada","dalam","atau","juga","sudah","belum","tidak","ada",
  "adalah","akan","kalau","jika","saja","nya","the","aja","dong","ya","sih","ku",
  "mau","ingin","perlu","butuh","cara","tolong","mohon","min","kak","mana","kok",
  "setelah","sesudah","sebelum","habis","abis","kelar","terus","lanjut","usai",
  "berikutnya","selanjutnya","ngapain","gmn","kpn","brp",
  // Ragam percakapan. Tanpa ini "kalo proposal ditolak gimana" tidak terjawab
  // sama sekali: "kalo" ikut dihitung sebagai konsep yang harus dicakup,
  // sehingga cakupannya jatuh di bawah ambang.
  "kalo","klo","udah","blm","gak","nggak","engga","enggak","yg","utk","dgn",
  "bgt","banget","nih","tuh","deh","emang","pas","sama","biar","supaya",
  // Basa-basi pembuka dan kata pengisi. Semuanya kata nyata yang ada di kamus,
  // tapi tidak satu pun menunjukkan apa yang sedang dicari — dan kalau ikut
  // dihitung, pertanyaan sopan yang panjang justru gagal dijawab hanya karena
  // cakupannya jatuh. "siapa" ikut ke sini karena perannya sama dengan
  // "kapan": penunjuk maksud, bukan kata kunci.
  "siapa","permisi","nanya","tanya","misalnya","misal","ternyata","solusinya",
  "solusi","halo","hai","assalamualaikum","maaf","bingung","gitu","begitu",
  "hari","sekarang","banyak","lagi","kira","seharusnya","biasanya",
  // "buat" hampir selalu berarti "untuk" dalam percakapan — "IPK minimal buat
  // yudisium". Dibiarkan sebagai kata kunci, ia bertemu bentuk dasar
  // "membuat" dan meloloskan "dokumen buat bikin paspor".
  "buat","bikin",
]);

/**
 * Kata tanya yang menunjukkan jenis jawaban yang dicari.
 *
 * Sebelumnya sinyal ini hilang sama sekali: "kapan" dibuang sebagai stopword,
 * sehingga "kapan sidang munaqosyah" dan "syarat sidang munaqosyah" dinilai
 * sama persis padahal yang dicari jelas berbeda.
 */
const intentRules: { pola: RegExp; kinds: AnswerKind[] }[] = [
  {
    pola: /\b(kapan|kpn|jadwal|tenggat|deadline|periode|dibuka|ditutup|tanggal)\b/,
    kinds: ["Jadwal", "Tenggat"],
  },
  {
    pola: /\b(cara|caranya|bagaimana|gimana|gmn|langkah|urutan|alur|prosedur|proses)\b/,
    kinds: ["Langkah"],
  },
  {
    pola: /\b(dokumen|berkas|syarat|persyaratan|lampiran|siapkan|bawa)\b/,
    kinds: ["Dokumen"],
  },
  {
    pola: /\b(template|contoh|format|unduh|download|formulir|form|file)\b/,
    kinds: ["Template"],
  },
  { pola: /\b(tips|saran|pengalaman|supaya|biar|hindari)\b/, kinds: ["Tips"] },
];

/**
 * Kata yang menyatakan *bentuk* jawaban, bukan pokok bahasannya.
 *
 * Kecocokan pada kata-kata ini saja tidak pernah cukup untuk menjawab. "jadwal
 * sholat hari ini" dan "jadwal ujian komprehensif" sama-sama memuat "jadwal",
 * tapi hanya satu yang benar-benar tentang website ini — pembedanya justru ada
 * pada kata yang lain.
 */
const strukturalWords = new Set([
  "jadwal", "tenggat", "deadline", "periode", "tanggal",
  "langkah", "urutan", "alur", "prosedur", "proses",
  "dokumen", "berkas", "syarat", "persyaratan", "lampiran",
  "template", "contoh", "format", "unduh", "download", "formulir", "form", "file",
  "tips", "saran", "pengalaman",
  "daftar", "pendaftaran", "mendaftar",
]);

function struktural(group: Group): boolean {
  return group.inti.every((w) => strukturalWords.has(w));
}

const POLA_LANJUT =
  /\b(setelah|sesudah|habis|abis|selesai|kelar|usai|lanjut|berikutnya|selanjutnya|terus|ngapain)\b/;
const POLA_BALIK = /\b(sebelum|sebelumnya|persiapan)\b/;

type Maksud = {
  kinds: Set<AnswerKind>;
  lanjut: boolean;
  balik: boolean;
};

function bacaMaksud(teks: string): Maksud {
  const kinds = new Set<AnswerKind>();
  for (const rule of intentRules) {
    if (rule.pola.test(teks)) for (const k of rule.kinds) kinds.add(k);
  }
  const balik = POLA_BALIK.test(teks);
  // "sebelum" lebih tegas daripada "ngapain". Kalau keduanya muncul —
  // "sebelum sempro harus ngapain" — yang dimaksud jelas arah mundur.
  return { kinds, lanjut: !balik && POLA_LANJUT.test(teks), balik };
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Imbuhan akhir yang bisa dilepas tanpa mengubah kata dasarnya.
 *
 * Hanya klitik, bukan imbuhan penuh. Pemenggalan awalan bahasa Indonesia
 * terlalu sering merusak makna — "berkas" akan jadi "kas", "sempro" jadi
 * "mpro" — jadi bentuk berawalan yang memang sering diketik didaftarkan
 * manual di peta `aliases` saja.
 */
const clitics = ["nya", "kah", "lah", "pun", "ku", "mu"];

function lepasKlitik(word: string): string | null {
  for (const c of clitics) {
    if (word.endsWith(c) && word.length - c.length >= 4) {
      return word.slice(0, -c.length);
    }
  }
  return null;
}

/**
 * Awalan dan akhiran yang dilepas untuk mendapatkan bentuk dasar.
 *
 * Urutannya penting: awalan yang lebih panjang diperiksa lebih dulu, supaya
 * "mengulang" terpotong di "meng-" dan bukan di "me-".
 *
 * "se-" dan "ke-" sengaja tidak ada. Keduanya merusak kata yang sering muncul
 * di sini — "sempro" akan jadi "mpro" dan "keterangan" jadi "terangan".
 */
const awalan = ["meng", "meny", "peng", "peny", "mem", "men", "pem", "pen", "ber", "ter", "per", "di", "ke", "me"];
const akhiran = ["kan", "an", "i"];

/**
 * Bentuk dasar sebuah kata, dipakai sama persis pada pertanyaan maupun pada
 * basis pengetahuan.
 *
 * Kuncinya simetri, bukan ketepatan linguistik. "sempro" boleh saja terpotong
 * keliru asal terpotong keliru dengan cara yang sama di kedua sisi — hasilnya
 * tetap bertemu. Yang penting pasangan seperti "pendaftaran"/"daftar",
 * "perpustakaan"/"pustaka", dan "diulang"/"mengulang" akhirnya bertemu; tanpa
 * ini "kompre boleh diulang berapa kali" tidak terjawab sama sekali.
 */
function stem(word: string): string {
  let w = lepasKlitik(word) ?? word;
  for (const p of awalan) {
    if (w.startsWith(p) && w.length - p.length >= 4) {
      w = w.slice(p.length);
      break;
    }
  }
  for (const s of akhiran) {
    if (w.endsWith(s) && w.length - s.length >= 4) {
      w = w.slice(0, -s.length);
      break;
    }
  }
  return w;
}

function stemSet(words: string[]): Set<string> {
  const set = new Set<string>();
  for (const w of words) if (w.length >= 4) set.add(stem(w));
  return set;
}

/**
 * Satu konsep dari pertanyaan, dengan tiga tingkat keyakinan.
 *
 * Dipisah karena bobotnya harus berbeda. Dulu semuanya dianggap setara,
 * sehingga "skpi itu apa" bisa dijawab entri mana pun yang memuat kata
 * "ijazah" — sebab "ijazah" ikut terbawa saat singkatan SKPI dibentangkan.
 */
type Group = {
  /** Bentuk yang benar-benar diketik pengguna. */
  inti: string[];
  /** Bentangan singkatan; tiap frasa harus cocok seluruh katanya. */
  alias: string[][];
  /** Bentuk dasar, untuk bertemu lintas imbuhan. */
  stem: string[];
  /** Tebakan pembetulan salah ketik. Paling longgar. */
  fuzzy: string[];
  /** Benar bila kata ini sama sekali asing bagi basis pengetahuan. */
  asing: boolean;
};

const BOBOT_INTI = 1;
const BOBOT_ALIAS = 0.6;
const BOBOT_STEM = 0.55;
const BOBOT_FUZZY = 0.45;

/**
 * Kecocokan di judul jauh lebih berarti daripada di badan teks.
 *
 * Angkanya sempat 3 dan itu terlalu rendah: entri yang tidak menyebut topiknya
 * di judul sama sekali bisa menang hanya karena badan teksnya kebetulan
 * memuat kata pengisi seperti "lupa". Judul menyatakan entri itu *tentang*
 * apa; badan teks cuma menyatakan apa yang kebetulan disinggung.
 */
const BOBOT_JUDUL = 4;
const BOBOT_ISI = 1;

/* ---------------------------------------------------------------- */
/* Pembetulan salah ketik                                            */
/* ---------------------------------------------------------------- */

let kosakata: {
  /** Calon pembetulan ejaan; sengaja hanya kata panjang. */
  calon: string[];
  /** SELURUH kata di basis pengetahuan, berapa pun panjangnya. */
  kata: Set<string>;
  /** Bentuk dasar seluruh kata tersebut. */
  dasar: Set<string>;
} | null = null;

/**
 * Kosakata basis pengetahuan.
 *
 * `calon` dan `kata` sengaja dipisah. Keduanya sempat satu daftar yang sama —
 * daftar kata minimal lima huruf, yang memang tepat untuk mencari pembetulan
 * ejaan — dan itu membuat setiap kata pendek seperti "lama" dan "buat"
 * dianggap asing bagi basis pengetahuan, padahal keduanya bertebaran di sana.
 */
function vocab() {
  if (!kosakata) {
    const kata = new Set<string>();
    const dasar = new Set<string>();
    for (const answer of knowledge) {
      for (const word of answer.bodyWords) {
        /*
         * Angka murni tidak dianggap kosakata.
         *
         * Kosakata ini dipakai untuk menilai apakah sebuah kata dalam
         * pertanyaan "asing" — dan kata asing itulah yang membuat asisten
         * menolak menjawab. Angka tidak membuktikan apa pun soal topik:
         * begitu data kalender akademik masuk, "2026" dan "2027" ikut jadi
         * kosakata, dan "cara daftar cpns 2026" mendadak terasa cukup dikenal
         * untuk dijawab. Tahun yang sama muncul di pertanyaan CPNS, jadwal
         * kereta, harga tiket — mengenalinya bukan tanda apa-apa.
         */
        if (/^\d+$/.test(word)) continue;
        kata.add(word);
        if (word.length >= 4) dasar.add(stem(word));
      }
    }
    kosakata = {
      calon: [...kata].filter((w) => w.length >= 5),
      kata,
      dasar,
    };
  }
  return kosakata;
}

/** Jarak sunting dengan ambang; berhenti lebih awal begitu melewati batas. */
function jarakSunting(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      if (row[j] < best) best = row[j];
    }
    if (best > max) return max + 1;
    prev = row;
  }
  return prev[b.length];
}

/**
 * Menebak kata yang dimaksud saat ejaannya meleset.
 *
 * Sengaja pelit: huruf pertama wajib sama, panjangnya tidak boleh beda jauh,
 * dan kata pendek tidak dibetulkan sama sekali. Pembetulan yang terlalu murah
 * hati membuat pertanyaan di luar topik ikut terjawab, dan itu justru
 * kesalahan yang paling merugikan di sini.
 */
function tebakEjaan(word: string): string | null {
  if (word.length < 5) return null;
  const max = word.length >= 8 ? 2 : 1;
  let terbaik: string | null = null;
  let jarakTerbaik = max + 1;

  for (const kandidat of vocab().calon) {
    if (kandidat[0] !== word[0]) continue;
    if (Math.abs(kandidat.length - word.length) > max) continue;
    const d = jarakSunting(word, kandidat, jarakTerbaik - 1);
    if (d < jarakTerbaik) {
      jarakTerbaik = d;
      terbaik = kandidat;
      if (d === 1) break;
    }
  }
  return jarakTerbaik <= max ? terbaik : null;
}

/**
 * Memecah pertanyaan menjadi kelompok istilah. Satu kata beserta bentangan
 * singkatannya dihitung sebagai SATU konsep, bukan beberapa kata — kalau tidak,
 * mengetik "sks" malah menurunkan skor karena menambah kata yang jarang muncul.
 */
function termGroups(text: string): Group[] {
  const groups: Group[] = [];
  const sudah = new Set<string>();

  for (const word of normalize(text).split(" ")) {
    if (word.length <= 2 || stopwords.has(word) || sudah.has(word)) continue;
    sudah.add(word);

    const inti = new Set([word]);
    const dasar = lepasKlitik(word);
    if (dasar && !stopwords.has(dasar)) inti.add(dasar);

    const alias: string[][] = [];
    for (const bentuk of inti) {
      for (const alternatif of aliases[bentuk] ?? []) {
        const kata = alternatif.split(" ").filter((k) => k.length > 2);
        if (kata.length > 0) alias.push(kata);
      }
    }

    const dikenal = [...inti].some(
      (b) => vocab().kata.has(b) || (b.length >= 4 && vocab().dasar.has(stem(b))),
    );

    // Pembetulan ejaan hanya untuk kata yang memang tidak dikenal. Kalau
    // singkatannya sudah terdaftar, ejaannya jelas tidak meleset.
    const fuzzy = new Set<string>();
    if (alias.length === 0 && !dikenal) {
      for (const bentuk of inti) {
        const tebakan = tebakEjaan(bentuk);
        if (tebakan) fuzzy.add(tebakan);
      }
    }

    // Bentuk dasar tetap disimpan walau sama dengan kata aslinya: sisi basis
    // pengetahuan juga dibandingkan dalam bentuk dasar, jadi "daftar" perlu
    // ada di sini supaya bertemu "pendaftaran".
    const stems = new Set<string>();
    for (const bentuk of inti) if (bentuk.length >= 4) stems.add(stem(bentuk));

    groups.push({
      inti: [...inti],
      alias,
      stem: [...stems],
      fuzzy: [...fuzzy],
      asing: !dikenal && alias.length === 0 && fuzzy.size === 0,
    });
  }
  return groups;
}

function entry(
  a: Omit<
    Answer,
    "haystack" | "titleWords" | "bodyWords" | "titleStems" | "bodyStems"
  > & {
    haystack?: string;
    /** Nama pendek yang setara judul, misalnya "Sempro" untuk Seminar Proposal. */
    titleExtra?: string;
  },
): Answer {
  const haystack = normalize(`${a.title} ${a.body} ${a.haystack ?? ""}`);
  const titleWords = normalize(`${a.title} ${a.titleExtra ?? ""}`)
    .split(" ")
    .filter(Boolean);
  const bodyWords = haystack.split(" ").filter(Boolean);
  return {
    ...a,
    haystack,
    titleWords,
    bodyWords,
    titleStems: stemSet(titleWords),
    bodyStems: stemSet(bodyWords),
  };
}

/**
 * Cocok bila ada kata yang sama persis, atau salah satunya awalan yang lain.
 * Sengaja tidak memakai pencocokan substring: "kopi" tidak boleh cocok dengan
 * "fotokopi", dan itu pernah membuat pertanyaan di luar topik terjawab.
 */
function matches(words: string[], variants: string[]): boolean {
  if (variants.length === 0) return false;
  return words.some((word) =>
    variants.some(
      (v) =>
        word === v ||
        (v.length >= 4 && word.startsWith(v)) ||
        // Arah sebaliknya dibatasi selisih dua huruf. Tanpa batas itu
        // "karyawan" cocok dengan "karya", dan "kapan gaji karyawan cair"
        // ikut terjawab oleh Lembar Pernyataan Keaslian Karya.
        (word.length >= 4 && v.length - word.length <= 2 && v.startsWith(word)),
    ),
  );
}

/** Seberapa yakin kelompok istilah ini muncul di kumpulan kata tersebut. */
function bobotCocok(words: string[], stems: Set<string>, group: Group): number {
  if (matches(words, group.inti)) return BOBOT_INTI;
  // Frasa hanya dianggap cocok kalau seluruh katanya ada.
  if (group.alias.some((frasa) => frasa.every((k) => matches(words, [k])))) {
    return BOBOT_ALIAS;
  }
  if (group.stem.some((s) => stems.has(s))) return BOBOT_STEM;
  if (matches(words, group.fuzzy)) return BOBOT_FUZZY;
  return 0;
}

/** Basis pengetahuan dibangun sekali dari seluruh JSON website. */
export const knowledge: Answer[] = [
  ...allFaq.map((item, i) => {
    const stage = item.stage ? getStage(item.stage) : undefined;
    return entry({
      id: `faq-${i}`,
      kind: "FAQ",
      title: item.question,
      body: item.answer,
      href: stage ? `/tahapan/${stage.slug}#faq` : "/faq",
      hrefLabel: stage ? stage.title : "Halaman FAQ",
      haystack: stage?.title,
    });
  }),

  ...stages.map((stage) =>
    entry({
      id: `stage-${stage.slug}`,
      kind: "Tahapan",
      stage: stage.slug,
      title: `Tahap ${stage.order}: ${stage.title}`,
      // Nama pendeknya diperlakukan setara judul. Orang mengetik "sempro",
      // bukan "seminar proposal", dan halaman tahapnya harus ikut terangkat.
      titleExtra: stage.shortTitle,
      body: `${stage.description}\n\nTujuan: ${stage.goal}\nEstimasi: ${stage.estimatedDuration}`,
      href: `/tahapan/${stage.slug}`,
      hrefLabel: "Buka tahap ini",
      haystack: `${stage.shortTitle} ${stage.phase} tahap ${stage.order}`,
    }),
  ),

  ...stages.map((stage) =>
    entry({
      id: `syarat-${stage.slug}`,
      kind: "Dokumen",
      stage: stage.slug,
      title: `Syarat ${stage.title}`,
      body: stage.requirements.map((r) => `• ${r.text}`).join("\n"),
      href: `/tahapan/${stage.slug}#syarat`,
      hrefLabel: "Lihat persyaratan",
      source: stage.requirements.some((r) => r.source === "resmi")
        ? "resmi"
        : "alumni",
      haystack: `syarat persyaratan ketentuan minimal boleh ikut daftar ${stage.shortTitle} ${stage.requirements.map((r) => r.text).join(" ")}`,
    }),
  ),

  ...stages.map((stage) =>
    entry({
      id: `dok-${stage.slug}`,
      kind: "Dokumen",
      stage: stage.slug,
      title: `Dokumen untuk ${stage.title}`,
      body: stage.documents
        .map((d) => `• ${d.name}${d.note ? ` — ${d.note}` : ""}`)
        .join("\n"),
      href: `/tahapan/${stage.slug}#dokumen`,
      hrefLabel: "Lihat daftar dokumen",
      haystack: `dokumen berkas syarat ${stage.shortTitle} ${stage.documents.map((d) => d.name).join(" ")}`,
    }),
  ),

  ...stages.map((stage) =>
    entry({
      id: `langkah-${stage.slug}`,
      kind: "Langkah",
      stage: stage.slug,
      title: `Langkah-langkah ${stage.title}`,
      body: stage.steps.map((s, i) => `${i + 1}. ${s.title} — ${s.detail}`).join("\n"),
      href: `/tahapan/${stage.slug}#langkah`,
      hrefLabel: "Lihat langkah lengkap",
      haystack: `langkah urutan alur prosedur ${stage.shortTitle} ${stage.steps.map((s) => s.title).join(" ")}`,
    }),
  ),

  ...stages.flatMap((stage) =>
    stage.warnings.map((w, i) =>
      entry({
        id: `warn-${stage.slug}-${i}`,
        kind: "Tenggat",
        stage: stage.slug,
        title: `Perhatian di tahap ${stage.title}`,
        body: w.text,
        href: `/tahapan/${stage.slug}`,
        hrefLabel: stage.title,
        source: w.source,
        haystack: `tenggat batas waktu deadline mengulang ${stage.shortTitle}`,
      }),
    ),
  ),

  ...stages.flatMap((stage) =>
    stage.tips.map((tip, i) =>
      entry({
        id: `tip-${stage.slug}-${i}`,
        kind: "Tips",
        stage: stage.slug,
        title: `Tips alumni · ${stage.title}`,
        body: tip,
        href: `/tahapan/${stage.slug}#tips`,
        hrefLabel: stage.title,
        haystack: `tips saran pengalaman ${stage.shortTitle}`,
      }),
    ),
  ),

  ...downloads.map((item) => {
    const stage = getStage(item.stage);
    const state =
      item.url === null
        ? "Berkasnya belum diunggah."
        : item.format === "Google Form"
          ? "Bisa langsung dibuka di Download Center."
          : "Bisa langsung diunduh di Download Center.";
    return entry({
      id: `dl-${item.id}`,
      kind: "Template",
      stage: item.stage,
      title: item.name,
      body: `${item.description}\n\n${state}`,
      href: `/download#${item.id}`,
      hrefLabel: "Buka di Download Center",
      haystack: `template formulir berkas unduh download ${item.format} ${stage?.title ?? ""}`,
    });
  }),

  ...schedule.exams.map((exam) =>
    entry({
      id: `jadwal-${exam.id}`,
      kind: "Jadwal",
      stage: exam.stage,
      title: `Jadwal dan pendaftaran ${exam.name}`,
      body: `${exam.schedulePattern}\n\nTenggat pendaftaran: ${exam.deadlinePattern}\nSyarat: ${exam.requirement}\n\n${exam.example}`,
      href: `/tahapan/${exam.stage}`,
      hrefLabel: "Buka tahapnya",
      haystack: `jadwal pendaftaran daftar tenggat deadline periode bulan kapan dibuka mulai tanggal waktu ${exam.name}`,
    }),
  ),

  entry({
    id: "jadwal-umum",
    kind: "Jadwal",
    title: "Kapan ujian digelar dan bagaimana mendaftarnya?",
    body: `${schedule.intro}\n\n${schedule.reminders.map((r) => `• ${r}`).join("\n")}`,
    href: "/",
    hrefLabel: "Lihat siklus ujian",
    haystack: "jadwal ujian bulanan pendaftaran google form tenggat 16.00 wib drive terkunci",
  }),

  /*
   * Kalender akademik universitas.
   *
   * Tiap gelombang wisuda dapat entrinya sendiri, bukan digabung jadi satu
   * daftar panjang. Orang bertanya "wisuda ke-143 kapan" atau "kapan
   * pendaftaran wisuda dibuka" — entri per gelombang membuat pertanyaan
   * seperti itu punya sasaran yang tepat, dan angka gelombangnya ikut masuk
   * haystack supaya bisa dicari langsung.
   */
  ...kalender.wisuda.map((w) =>
    entry({
      id: `wisuda-${w.ke}`,
      kind: "Jadwal",
      stage: "wisuda",
      title: `Jadwal Wisuda ke-${w.ke}`,
      /*
       * Judul wajib menyinggung apa yang ditanyakan — entri dengan nol
       * kecocokan judul dibuang sebelum dinilai. Tanpa tambahan ini "kapan
       * pendaftaran wisuda dibuka" nyasar ke FAQ pendaftaran ujian bulanan.
       *
       * Tapi kata "pendaftaran" TIDAK boleh ada di sini: batangnya bertemu
       * "daftar", dan akibatnya "cara daftar cpns 2026" ikut berlabuh ke
       * jadwal wisuda. Yang dipakai kata yang tidak punya kehidupan di luar
       * konteks kampus — AIS dan gladi resik.
       */
      titleExtra: "AIS gladi resik gelombang",
      body: `Pelaksanaan: ${formatRentang(w.pelaksanaan)}\nPendaftaran online di AIS: ${formatRentang(w.pendaftaran)}\nPenyerahan peserta dan skripsi terbaik: ${formatTanggal(w.penyerahanPeserta)}\nGladi resik: ${formatTanggal(w.gladiResik)}\n\nSumber: ${kalender.sumber.keputusan}, ditetapkan ${kalender.sumber.ditetapkan}, tahun akademik ${kalender.sumber.tahunAkademik}.`,
      href: "/tahapan/wisuda",
      hrefLabel: "Buka tahap wisuda",
      haystack: `wisuda ke-${w.ke} ke ${w.ke} gelombang jadwal kapan tanggal pendaftaran ais gladi resik toga upacara kalender akademik`,
    }),
  ),

  entry({
    id: "kalender-akademik",
    kind: "Jadwal",
    /*
     * Judulnya menyebut isinya satu per satu karena entri dengan nol
     * kecocokan judul dibuang sebelum dinilai — versi "Kalender akademik
     * 2026/2027" saja membuat "kapan pembayaran UKT" tidak terjawab.
     *
     * Tapi menyebutkannya harus hemat. Versi berikutnya memuat kata "jadwal"
     * dan angka tahunnya, dan itu justru menjebol penjaga: "cara daftar cpns
     * 2026" lolos lewat angka 2026, "jadwal kereta jakarta bandung" lolos
     * lewat kata jadwal — dua pertanyaan yang memang harus ditolak. Judul di
     * sini sengaja hanya memuat kata yang tidak dipakai di luar konteks
     * kampus.
     */
    title:
      "Kalender akademik UIN Jakarta: pembayaran UKT, cuti kuliah, e-RS, dan perkuliahan",
    titleExtra: "semester ganjil genap",
    body: `${kalender.sumber.keputusan}, ditetapkan ${kalender.sumber.ditetapkan}.\n\n${kalender.semester
      .map(
        (s) =>
          `${s.nama}\n• Perkuliahan: ${formatRentang(s.perkuliahan)}\n• Pembayaran UKT: ${formatRentang(s.pembayaranUkt)}\n• Pengajuan cuti kuliah: ${formatRentang(s.pengajuanCuti)}\n• Pengisian e-RS: ${formatRentang(s.pengisianErs)}\n• Pengisian nilai oleh dosen: ${formatRentang(s.pengisianNilai)}`,
      )
      .join("\n\n")}\n\nWisuda tahun akademik ini: ${kalender.wisuda
      .map((w) => `ke-${w.ke} (${formatRentang(w.pelaksanaan)})`)
      .join(", ")}.`,
    href: "/download#kalender-akademik",
    hrefLabel: "Unduh kalender akademik",
    haystack:
      "kalender akademik semester ganjil genap perkuliahan ukt pembayaran cuti kuliah e-rs ers nilai dosen wisuda tahun akademik keputusan rektor",
  }),

  entry({
    id: "skpi-nomenklatur",
    kind: "SKPI",
    title: skpi.heading,
    body: `${skpi.intro}\n\n${skpi.entries
      .map(
        (e) =>
          `• ${e.nama} → Kategori: ${e.kategori} · Jenis: ${e.jenis} · Tingkat: ${e.tingkat}`,
      )
      .join("\n")}\n\n${skpi.rules.map((r) => `• ${r}`).join("\n")}`,
    href: "/tahapan/munaqosyah#skpi",
    hrefLabel: "Lihat tabel lengkap",
    haystack:
      "skpi nomenklatur toefl toafl kkn bimbingan teknis mediasi litigasi sertifikat input ais kategori jenis tingkat prestasi",
  }),

  // Pertanyaan "habis ini apa?" adalah inti dari website ini, tapi jawabannya
  // tidak ada di JSON mana pun — ia tersimpan sebagai rantai antar tahap.
  // Entri berikut menerjemahkan rantai itu menjadi jawaban yang bisa dicari.
  ...stages.flatMap((stage) => {
    const next = stage.nextStage ? getStage(stage.nextStage) : undefined;
    if (!next) return [];
    return [
      entry({
        id: `lanjut-${next.slug}`,
        kind: "Tahapan",
        stage: next.slug,
        gate: "lanjut",
        title: `Setelah ${stage.title}, apa langkah berikutnya?`,
        body: `Berikutnya Tahap ${next.order}: ${next.title}.\n\n${next.description}\n\nTujuan: ${next.goal}\nEstimasi: ${next.estimatedDuration}`,
        href: `/tahapan/${next.slug}`,
        hrefLabel: `Buka ${next.shortTitle}`,
        haystack: `${stage.shortTitle} ${next.shortTitle} ${next.title}`,
      }),
    ];
  }),

  ...stages.flatMap((stage) => {
    const prev = stage.previousStage ? getStage(stage.previousStage) : undefined;
    if (!prev) return [];
    return [
      entry({
        id: `balik-${prev.slug}`,
        kind: "Tahapan",
        stage: prev.slug,
        gate: "balik",
        title: `Sebelum ${stage.title}, apa yang perlu disiapkan?`,
        body: `Tahap sebelumnya adalah Tahap ${prev.order}: ${prev.title}.\n\n${prev.description}\n\nTujuan: ${prev.goal}\nEstimasi: ${prev.estimatedDuration}`,
        href: `/tahapan/${prev.slug}`,
        hrefLabel: `Buka ${prev.shortTitle}`,
        haystack: `${stage.shortTitle} ${prev.shortTitle} ${prev.title}`,
      }),
    ];
  }),

  entry({
    id: "ringkasan-alur",
    kind: "Tahapan",
    // Judulnya sengaja memuat "mulai" dan "tahap": dua kata yang paling sering
    // dipakai orang yang belum tahu harus bertanya apa, dan sebelumnya
    // pertanyaan seperti "mulai skripsi dari mana" tidak menemukan entri ini
    // sama sekali karena judulnya tak menyinggung keduanya.
    title: `Mulai dari mana? Ringkasan ${totalStages} tahap kelulusan`,
    body: `Ada ${totalStages} tahap:\n${stages
      .map((s) => `${s.order}. ${s.title} (${s.estimatedDuration})`)
      .join("\n")}`,
    href: "/roadmap",
    hrefLabel: "Buka roadmap",
    haystack: "alur ringkasan urutan tahap keseluruhan roadmap dari awal sampai lulus ijazah",
  }),
];

export type SearchResult = {
  answer: Answer;
  score: number;
};

/**
 * Skor kecocokan: seberapa banyak konsep dari pertanyaan muncul, dengan bobot
 * lebih besar bila konsep itu ada di judul jawaban dan bila ejaannya persis.
 */
export function findAnswers(question: string, limit = 3): SearchResult[] {
  const teks = normalize(question);
  const groups = termGroups(question);
  if (groups.length === 0) return [];

  const maksud = bacaMaksud(teks);
  // Termasuk kata-kata umum, yang di tempat lain dibuang. Di sini justru
  // berguna: kalau pertanyaan diketik hampir sama persis dengan sebuah judul,
  // entri itulah yang dimaksud. Inilah yang memisahkan "SKPI itu apa dan
  // diisi di mana?" dari "Kapan SKPI harus diisi?" — keduanya sama-sama
  // memuat kata SKPI di judul, jadi skor kata kuncinya seri.
  const semuaKata = teks.split(" ").filter(Boolean);

  // Kata asing berbobot dua kali lipat di penyebut cakupan. Kalau pokok
  // bahasan pertanyaannya sama sekali tidak dikenal — "sholat", "paspor",
  // "gaji" — memang seharusnya lebih sulit lolos.
  const beban = (g: Group) => (g.asing ? 2 : 1);

  // Pertanyaan yang seluruh katanya dikenal boleh dijawab hanya dari kata
  // struktural: mengetik "form" saja memang berarti "tunjukkan formulirnya".
  // Begitu ada kata asing, syaratnya diperketat.
  const adaAsing = groups.some((g) => g.asing);
  const totalBeban = groups.reduce((a, g) => a + beban(g), 0);

  // Satu konsep saja, tanpa kata tanya dan tanpa penanda urutan. "setelah
  // yudisium apa" hanya menyisakan satu konsep setelah kata umum dibuang,
  // tapi jelas bukan permintaan ringkasan tahap.
  const bareTopik =
    groups.length === 1 && maksud.kinds.size === 0 && !maksud.lanjut && !maksud.balik;

  const results: SearchResult[] = [];
  for (const answer of knowledge) {
    // Entri bergerbang hanya ikut dinilai kalau pertanyaannya memang
    // menanyakan urutan.
    if (answer.gate === "lanjut" && !maksud.lanjut) continue;
    if (answer.gate === "balik" && !maksud.balik) continue;

    let cocok = 0;
    let titleHits = 0;
    let jangkar = 0;
    let score = 0;

    for (const group of groups) {
      const diJudul = bobotCocok(answer.titleWords, answer.titleStems, group);
      const diIsi = bobotCocok(answer.bodyWords, answer.bodyStems, group);
      const bobot = Math.max(diJudul, diIsi);
      if (bobot === 0) continue;
      cocok += beban(group);
      if (diJudul > 0) titleHits++;
      if (!struktural(group)) jangkar++;
      score += (diJudul > 0 ? BOBOT_JUDUL : BOBOT_ISI) * bobot;
    }

    // Judul jawaban wajib menyinggung setidaknya satu hal yang ditanyakan.
    // Tanpa syarat ini "berapa gaji lulusan hukum" ikut terjawab: kata "lulus"
    // dan "hukum" memang bertebaran di badan teks hampir semua entri.
    if (titleHits === 0) continue;

    // Begitu ada kata asing, kecocokan pada kata struktural saja tidak cukup —
    // itulah yang membedakan "jadwal ujian komprehensif" dari "jadwal sholat".
    if (adaAsing && jangkar === 0) continue;

    // Cakupan menjaga agar pertanyaan panjang tidak cocok hanya karena satu
    // kata.
    const coverage = cocok / totalBeban;
    if (coverage < 0.33) continue;

    // Kemiripan susunan kalimat dengan judul, ditambahkan sebagai nilai kecil
    // dan bukan sebagai pengali. Sebagai pengali ia sempat menggeser jawaban
    // yang sudah benar — padahal tugasnya cuma memisahkan skor yang seri.
    const rapat =
      semuaKata.filter((w) => answer.titleWords.includes(w)).length /
      semuaKata.length;

    // Jawaban resmi dan tenggat sedikit diprioritaskan.
    let bonus = answer.kind === "Tenggat" || answer.kind === "FAQ" ? 1.15 : 1;
    // Jenis jawaban yang sesuai maksud pertanyaan diangkat.
    if (maksud.kinds.has(answer.kind)) bonus *= 1.35;
    // Entri urutan sudah lolos gerbang, jadi memang itu yang dicari.
    if (answer.gate) bonus *= 1.4;
    // Satu kata saja tanpa kata tanya — "sempro", "wisuda" — artinya "ceritakan
    // soal ini". Halaman tahapannya yang menjawab itu, bukan satu FAQ sempit
    // yang kebetulan menyebut kata tersebut di judulnya.
    if (bareTopik && answer.kind === "Tahapan" && !answer.gate) bonus *= 1.5;

    // Pemecah seri kedua: judul yang lebih ringkas lebih spesifik membahas
    // kata yang dicari. "Tahap 2: Seminar Proposal" dan "Tahap 1: Persiapan
    // Proposal" sama-sama memuat kata "sempro" lewat nama pendeknya, dan
    // tanpa ini urutan pemenangnya cuma bergantung urutan penyusunan data.
    const fokus = 0.02 / answer.titleWords.length;

    results.push({
      answer,
      score: score * coverage * bonus + rapat * 0.05 + fokus,
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Pencarian longgar, khusus untuk menyusun saran "mungkin maksudmu".
 *
 * Ambangnya diturunkan karena tujuannya berbeda: bukan menjawab, melainkan
 * menawarkan jalan keluar saat pertanyaannya meleset. Menawarkan topik yang
 * kurang tepat jauh lebih ringan akibatnya daripada menjawab dengan keliru.
 */
function cariLonggar(question: string, limit: number): Answer[] {
  const groups = termGroups(question);
  if (groups.length === 0) return [];

  const results: SearchResult[] = [];
  for (const answer of knowledge) {
    if (answer.gate) continue;
    let score = 0;
    let kuat = 0;
    for (const group of groups) {
      const diJudul = bobotCocok(answer.titleWords, answer.titleStems, group);
      const diIsi = bobotCocok(answer.bodyWords, answer.bodyStems, group);
      const bobot = Math.max(diJudul, diIsi);
      if (bobot === 0) continue;
      if (bobot >= BOBOT_STEM) kuat++;
      score += diJudul > 0 ? bobot * 2 : bobot;
    }
    if (kuat === 0) continue;
    results.push({ answer, score });
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.answer);
}

export type Jawaban = {
  /** Isi jawaban yang siap ditampilkan. */
  teks: string;
  /** Entri sumber utama, untuk label dan tautan halamannya. */
  utama?: Answer;
  /** Entri lain yang berkaitan, ditawarkan sebagai pertanyaan lanjutan. */
  terkait: { id: string; title: string }[];
  /** Terisi hanya saat tidak ada jawaban: topik terdekat yang bisa dicoba. */
  saran?: string[];
  /** Benar bila mesin tidak menemukan apa pun. */
  kosong: boolean;
};

const TIDAK_TAHU =
  "Maaf, aku belum punya jawabannya. Aku hanya menjawab dari data yang ada di website ini dan tidak mau menebak untuk urusan administrasi. Coba tanyakan dengan kata lain, atau tanyakan langsung ke Sekretaris Program Studi.";

/**
 * Menyusun satu jawaban utuh dari basis pengetahuan, tanpa model bahasa.
 *
 * Selain isi entri yang paling cocok, jawaban ditutup dengan satu baris
 * "setelah ini" bila entrinya berasal dari sebuah tahap. Itu pertanyaan yang
 * hampir selalu menyusul — dan menjawabnya sekalian membuat asisten terasa
 * memahami alurnya, bukan sekadar mengembalikan potongan data.
 */
export function susunJawaban(question: string): Jawaban {
  const hasil = findAnswers(question, 6);

  if (hasil.length === 0) {
    const dekat = cariLonggar(question, 3).map((a) => a.title);
    return {
      teks: TIDAK_TAHU,
      terkait: [],
      saran: dekat.length > 0 ? dekat : starterQuestions.slice(0, 3),
      kosong: true,
    };
  }

  const utama = hasil[0].answer;
  const bagian = [utama.body];

  // Entri bergerbang sudah membahas tahap berikutnya, jadi tidak perlu
  // ditambahi lagi.
  if (!utama.gate && utama.stage) {
    const stage = getStage(utama.stage);
    const next = stage?.nextStage ? getStage(stage.nextStage) : undefined;
    if (next) {
      bagian.push(`Setelah ini: Tahap ${next.order} — ${next.title}.`);
    }
  }

  // Disaring per judul, bukan per id. Beberapa entri sengaja berbagi judul —
  // tiap peringatan sebuah tahap bernama "Perhatian di tahap X" — dan dua chip
  // berbunyi sama persis tidak menolong siapa pun, apalagi karena mengkliknya
  // menghasilkan jawaban yang itu-itu juga.
  const terpakai = new Set([utama.title]);
  const terkait: { id: string; title: string }[] = [];
  for (const { answer } of hasil.slice(1)) {
    if (terpakai.has(answer.title)) continue;
    terpakai.add(answer.title);
    terkait.push({ id: answer.id, title: answer.title });
    if (terkait.length === 2) break;
  }

  return { teks: bagian.join("\n\n"), utama, terkait, kosong: false };
}

/** Pertanyaan pembuka yang menunjukkan apa saja yang bisa dijawab. */
export const starterQuestions = [
  "Berapa batas Turnitin skripsi?",
  "Kapan pendaftaran sidang dibuka?",
  "Syarat daftar munaqosyah apa saja?",
  "Urutan tanda tangan setelah sidang?",
  "Cara isi SKPI di AIS",
  "Tenggat mana yang bikin mengulang?",
];

