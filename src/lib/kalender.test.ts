import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { agenda } from "@/lib/agenda";
import { downloads, kalender } from "@/lib/data";

/**
 * Kalender akademik terbit ulang tiap tahun akademik, dan penggantiannya
 * menyentuh tiga tempat sekaligus: berkas PDF di `public/`, entri unduhan,
 * dan tanggal-tanggal di `kalender-akademik.json`. Ketiganya gampang
 * menyimpang — dan gejalanya paling buruk: halaman menampilkan tanggal tahun
 * lalu dengan percaya diri, tanpa ada yang gagal.
 */
describe("kalender akademik", () => {
  const entri = downloads.find((d) => d.id === "kalender-akademik");

  it("punya entri di Download Center", () => {
    expect(entri).toBeDefined();
    expect(entri?.status).toBe("tersedia");
    expect(entri?.url).toBeTruthy();
  });

  it("berkas PDF-nya benar-benar ada di public/", () => {
    const url = entri?.url;
    expect(url, "entri unduhan belum punya url").toBeTruthy();
    expect(existsSync(join(process.cwd(), "public", url!))).toBe(true);
  });

  it("entri unduhan dan data kalender menunjuk berkas yang sama", () => {
    // Kalau keduanya berbeda, orang mengunduh satu dokumen tapi membaca
    // tanggal dari dokumen lain.
    expect(entri?.url).toBe(kalender.sumber.berkas);
  });

  it("tahun akademiknya konsisten antara entri unduhan dan data", () => {
    expect(entri?.version).toBe(kalender.sumber.tahunAkademik);
  });

  it("punya empat gelombang wisuda dengan nomor menaik", () => {
    expect(kalender.wisuda.length).toBe(4);
    const nomor = kalender.wisuda.map((w) => w.ke);
    expect([...nomor].sort((a, b) => a - b)).toEqual(nomor);
    expect(new Set(nomor).size).toBe(nomor.length);
  });

  it("setiap tanggal ditulis ISO dan rentangnya tidak terbalik", () => {
    const iso = /^\d{4}-\d{2}-\d{2}$/;
    const periksa = (v: unknown, jalur: string) => {
      if (typeof v === "string") {
        expect(v, jalur).toMatch(iso);
        return;
      }
      if (v && typeof v === "object" && "mulai" in v && "selesai" in v) {
        const r = v as { mulai: string; selesai: string };
        expect(r.mulai, `${jalur}.mulai`).toMatch(iso);
        expect(r.selesai, `${jalur}.selesai`).toMatch(iso);
        // Rentang terbalik akan menggambar batang berlebar negatif di
        // kalender — tidak terlihat, dan tidak ada yang memberi tahu.
        expect(
          r.selesai >= r.mulai,
          `${jalur}: selesai (${r.selesai}) mendahului mulai (${r.mulai})`,
        ).toBe(true);
      }
    };

    for (const w of kalender.wisuda) {
      for (const [k, v] of Object.entries(w)) {
        if (k === "ke") continue;
        periksa(v, `wisuda ke-${w.ke} · ${k}`);
      }
    }
    for (const s of kalender.semester) {
      for (const [k, v] of Object.entries(s)) {
        if (k === "nama") continue;
        periksa(v, `${s.nama} · ${k}`);
      }
    }
  });

  it("sumbu waktunya memuat seluruh agenda", () => {
    const { mulai, selesai } = kalender.sumber;
    for (const a of agenda) {
      expect(a.rentang.mulai >= mulai, `${a.label} mulai sebelum sumbu`).toBe(
        true,
      );
      expect(
        a.rentang.selesai <= selesai,
        `${a.label} selesai sesudah sumbu`,
      ).toBe(true);
    }
  });

  it("mencantumkan dua semester, ganjil lebih dulu", () => {
    expect(kalender.semester.length).toBe(2);
    expect(kalender.semester[0].nama).toMatch(/Ganjil/);
    expect(kalender.semester[1].nama).toMatch(/Genap/);
  });
});
