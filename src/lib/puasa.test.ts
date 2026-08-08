import { describe, expect, it } from "vitest";

import { formatHijriah, keHijriah, puasaPada, puasaUtama } from "@/lib/puasa";

/** Pembantu: tanggal lokal, bukan UTC. */
const t = (tahun: number, bulan: number, hari: number) =>
  new Date(tahun, bulan - 1, hari);

/** Mencari tanggal Masehi pertama yang jatuh pada tanggal Hijriah tertentu. */
function cariHijriah(bulanH: number, hariH: number, mulai: Date, batas = 400) {
  const d = new Date(mulai);
  for (let i = 0; i < batas; i++) {
    const h = keHijriah(d);
    if (h.bulan === bulanH && h.hari === hariH) return new Date(d);
    d.setDate(d.getDate() + 1);
  }
  throw new Error(`tidak ketemu ${hariH}/${bulanH} dalam ${batas} hari`);
}

describe("penanggalan Hijriah", () => {
  it("mengonversi tanggal Masehi ke Hijriah", () => {
    const h = keHijriah(t(2026, 8, 9));
    expect(h.tahun).toBe(1448);
    expect(h.bulan).toBe(2);
    expect(h.hari).toBe(26);
  });

  it("tahunnya berupa angka, bukan NaN", () => {
    // Intl kadang mengembalikan "1448 AH"; Number() atas string itu NaN dan
    // gejalanya cuma "NaN" kecil di sudut kalender.
    for (const d of [t(2026, 1, 1), t(2026, 8, 9), t(2027, 6, 30)]) {
      expect(Number.isFinite(keHijriah(d).tahun)).toBe(true);
    }
  });

  it("menuliskan nama bulannya dalam bahasa Indonesia", () => {
    expect(formatHijriah({ hari: 26, bulan: 2, tahun: 1448 })).toBe(
      "26 Safar 1448",
    );
    expect(formatHijriah({ hari: 10, bulan: 1, tahun: 1448 })).toBe(
      "10 Muharram 1448",
    );
  });
});

describe("puasa mingguan", () => {
  it("menandai Senin dan Kamis", () => {
    // 10 Agustus 2026 Senin, 13 Agustus 2026 Kamis.
    expect(t(2026, 8, 10).getDay()).toBe(1);
    expect(puasaPada(t(2026, 8, 10)).some((p) => p.jenis === "senin-kamis")).toBe(
      true,
    );
    expect(t(2026, 8, 13).getDay()).toBe(4);
    expect(puasaPada(t(2026, 8, 13)).some((p) => p.jenis === "senin-kamis")).toBe(
      true,
    );
  });

  it("tidak menandai hari lain", () => {
    expect(puasaPada(t(2026, 8, 11)).some((p) => p.jenis === "senin-kamis")).toBe(
      false,
    );
  });
});

describe("Ayyamul Bidh", () => {
  it("jatuh pada 13, 14, dan 15 Hijriah", () => {
    for (const tgl of [13, 14, 15]) {
      const d = cariHijriah(2, tgl, t(2026, 7, 1));
      expect(
        puasaPada(d).some((p) => p.jenis === "ayyamul-bidh"),
        `${tgl} Safar`,
      ).toBe(true);
    }
  });

  it("tidak menandai 12 dan 16 Hijriah", () => {
    for (const tgl of [12, 16]) {
      const d = cariHijriah(2, tgl, t(2026, 7, 1));
      expect(puasaPada(d).some((p) => p.jenis === "ayyamul-bidh")).toBe(false);
    }
  });
});

describe("hari yang diharamkan berpuasa", () => {
  it("Idulfitri, Iduladha, dan tiga hari tasyriq", () => {
    const kasus: [number, number, string][] = [
      [10, 1, "Idulfitri"],
      [12, 10, "Iduladha"],
      [12, 11, "tasyriq"],
      [12, 12, "tasyriq"],
      [12, 13, "tasyriq"],
    ];
    for (const [bulanH, hariH] of kasus) {
      const d = cariHijriah(bulanH, hariH, t(2026, 1, 1));
      const hasil = puasaPada(d);
      expect(hasil.length, `${hariH}/${bulanH}`).toBe(1);
      expect(hasil[0].larangan, `${hariH}/${bulanH}`).toBe(true);
    }
  });

  it("13 Zulhijah TIDAK dianjurkan sebagai Ayyamul Bidh", () => {
    // Tumpang tindih yang paling mudah salah: 13 Zulhijah memenuhi syarat
    // Ayyamul Bidh sekaligus hari tasyriq. Aturan naif akan menganjurkan
    // puasa pada hari yang justru dilarang.
    const d = cariHijriah(12, 13, t(2026, 1, 1));
    expect(puasaPada(d).some((p) => p.jenis === "ayyamul-bidh")).toBe(false);
    expect(puasaUtama(d)?.larangan).toBe(true);
  });

  it("larangan mengalahkan Senin/Kamis", () => {
    // Iduladha bisa jatuh Senin atau Kamis; larangannya tetap menang.
    for (let tahun = 2026; tahun <= 2032; tahun++) {
      const d = cariHijriah(12, 10, t(tahun, 1, 1));
      if (d.getDay() === 1 || d.getDay() === 4) {
        expect(puasaPada(d).every((p) => p.larangan)).toBe(true);
        return;
      }
    }
  });
});

describe("puasa tahunan", () => {
  it("Arafah pada 9 Zulhijah", () => {
    const d = cariHijriah(12, 9, t(2026, 1, 1));
    expect(puasaPada(d).some((p) => p.jenis === "arafah")).toBe(true);
  });

  it("Tasua dan Asyura pada 9 dan 10 Muharram", () => {
    expect(
      puasaPada(cariHijriah(1, 9, t(2026, 1, 1))).some((p) => p.jenis === "tasua"),
    ).toBe(true);
    expect(
      puasaPada(cariHijriah(1, 10, t(2026, 1, 1))).some(
        (p) => p.jenis === "asyura",
      ),
    ).toBe(true);
  });

  it("enam hari Syawal dimulai sehari sesudah Idulfitri", () => {
    expect(
      puasaPada(cariHijriah(10, 2, t(2026, 1, 1))).some(
        (p) => p.jenis === "syawal",
      ),
    ).toBe(true);
    expect(
      puasaPada(cariHijriah(10, 8, t(2026, 1, 1))).some(
        (p) => p.jenis === "syawal",
      ),
    ).toBe(false);
  });

  it("Ramadan ditandai sebagai puasa wajib, bukan sunnah", () => {
    const d = cariHijriah(9, 5, t(2026, 1, 1));
    const hasil = puasaPada(d);
    expect(hasil.length).toBe(1);
    expect(hasil[0].jenis).toBe("ramadan");
  });
});
