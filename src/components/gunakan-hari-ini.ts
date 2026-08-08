"use client";

import * as React from "react";

import { uraiTanggal } from "@/lib/tanggal";

/** Tanggal tidak berubah selama satu kunjungan; tidak ada yang perlu dilanggan. */
const langganan = () => () => {};

/** "2026-08-09" dari waktu lokal, bukan UTC seperti toISOString(). */
export function isoLokal(d: Date): string {
  const b = String(d.getMonth() + 1).padStart(2, "0");
  const h = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${b}-${h}`;
}

/**
 * Tanggal hari ini, `null` sampai komponennya hidup di peramban.
 *
 * Server tidak ikut menghitungnya, karena dua alasan yang sama-sama menentukan:
 *
 * 1. Kalau server ikut, keadaan "sedang berlangsung" dirender memakai jam
 *    server lalu dikoreksi di peramban — React menganggapnya ketidakcocokan
 *    hidrasi.
 * 2. Halaman-halaman ini dirender statis saat build. Tanggal yang ikut
 *    terpanggang akan basi begitu halamannya dilayani besok.
 *
 * Dulu ditulis dua kali di dua komponen kalender. Menyalin logika yang
 * menyangkut hidrasi adalah cara yang rapi untuk membuat salah satunya
 * diperbaiki dan yang lain tertinggal.
 */
export function useHariIni(): Date | null {
  const iso = React.useSyncExternalStore(
    langganan,
    () => isoLokal(new Date()),
    () => null,
  );
  return iso ? uraiTanggal(iso) : null;
}
