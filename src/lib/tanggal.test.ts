import { describe, expect, it } from "vitest";

import {
  formatRentang,
  formatTanggal,
  posisi,
  sedangBerlangsung,
  selisihHari,
  uraiTanggal,
} from "@/lib/tanggal";

describe("membaca tanggal", () => {
  it("membaca ISO sebagai tanggal kalender, bukan tengah malam UTC", () => {
    // `new Date("2026-09-01")` adalah tengah malam UTC — di zona negatif ia
    // mundur ke 31 Agustus. Tanggal kalender akademik tidak punya jam, jadi
    // pergeseran seperti itu murni kesalahan.
    const d = uraiTanggal("2026-09-01");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(8);
    expect(d.getDate()).toBe(1);
  });

  it("menulis tanggal tunggal dalam bahasa Indonesia", () => {
    expect(formatTanggal("2026-11-09")).toBe("9 November 2026");
    expect(formatTanggal("2027-01-15")).toBe("15 Januari 2027");
  });
});

describe("menyusun rentang", () => {
  it("meringkas bila bulannya sama", () => {
    expect(formatRentang({ mulai: "2026-11-28", selesai: "2026-11-29" })).toBe(
      "28–29 November 2026",
    );
  });

  it("menyebut dua bulan bila tahunnya sama", () => {
    expect(formatRentang({ mulai: "2026-09-01", selesai: "2026-10-19" })).toBe(
      "1 September – 19 Oktober 2026",
    );
  });

  it("menyebut dua tahun bila menyeberang pergantian tahun", () => {
    expect(formatRentang({ mulai: "2026-12-01", selesai: "2027-01-15" })).toBe(
      "1 Desember 2026 – 15 Januari 2027",
    );
  });

  it("tidak mengulang tanggal yang sama dua kali", () => {
    expect(formatRentang({ mulai: "2027-05-10", selesai: "2027-05-10" })).toBe(
      "10 Mei 2027",
    );
  });
});

describe("menilai posisi hari ini", () => {
  const r = { mulai: "2026-07-20", selesai: "2026-08-19" };

  it("kedua ujung rentang ikut terhitung berlangsung", () => {
    expect(sedangBerlangsung(r, new Date(2026, 6, 20))).toBe(true);
    expect(sedangBerlangsung(r, new Date(2026, 7, 19))).toBe(true);
  });

  it("sehari sebelum dan sesudahnya tidak", () => {
    expect(sedangBerlangsung(r, new Date(2026, 6, 19))).toBe(false);
    expect(sedangBerlangsung(r, new Date(2026, 7, 20))).toBe(false);
  });

  it("mengabaikan jam pada hari yang diperiksa", () => {
    // Pengunjung yang membuka pukul 23.30 harus melihat keadaan yang sama
    // dengan yang membuka pukul 08.00 di hari itu.
    expect(sedangBerlangsung(r, new Date(2026, 7, 19, 23, 30))).toBe(true);
  });

  it("menghitung selisih hari, negatif bila sudah lewat", () => {
    expect(selisihHari("2026-08-19", new Date(2026, 7, 9))).toBe(10);
    expect(selisihHari("2026-08-09", new Date(2026, 7, 9))).toBe(0);
    expect(selisihHari("2026-08-01", new Date(2026, 7, 9))).toBe(-8);
  });
});

describe("menempatkan pada sumbu waktu", () => {
  const sumbu = { mulai: "2026-07-20", selesai: "2027-08-29" };

  it("ujung-ujungnya jatuh tepat di 0 dan 1", () => {
    expect(posisi("2026-07-20", sumbu)).toBe(0);
    expect(posisi("2027-08-29", sumbu)).toBe(1);
  });

  it("menjepit tanggal di luar sumbu, tidak melompat keluar bidang", () => {
    expect(posisi("2025-01-01", sumbu)).toBe(0);
    expect(posisi("2030-01-01", sumbu)).toBe(1);
  });

  it("tengah-tengah berada di sekitar 0,5", () => {
    const p = posisi("2027-02-08", sumbu);
    expect(p).toBeGreaterThan(0.4);
    expect(p).toBeLessThan(0.6);
  });
});
