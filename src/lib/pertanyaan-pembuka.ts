/**
 * Pertanyaan pembuka yang menunjukkan apa saja yang bisa dijawab asisten.
 *
 * Berkas tersendiri, bukan di `@/lib/assistant`, dan itu bukan soal kerapian.
 * Panel asisten adalah komponen klien; mengimpor apa pun dari `assistant.ts`
 * menyeret seluruh basis pengetahuannya — 231 entri beserta `stages.json`,
 * `faq.json`, dan `downloads.json` — ke dalam bundel peramban di SETIAP
 * halaman, hanya untuk menampilkan enam kalimat ini.
 *
 * Terukur sebelum dipisah: 22 KB gzip data dan 341 milidetik long task,
 * dibayar setiap pemuatan halaman oleh semua orang, termasuk yang tidak
 * pernah membuka asistennya.
 */
export const starterQuestions = [
  "Berapa batas Turnitin skripsi?",
  "Kapan pendaftaran sidang dibuka?",
  "Syarat daftar munaqosyah apa saja?",
  "Urutan tanda tangan setelah sidang?",
  "Cara isi SKPI di AIS",
  "Tenggat mana yang bikin mengulang?",
];
