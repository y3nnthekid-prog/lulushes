# Keamanan & Runbook Respons Insiden

Dokumen ini punya dua bagian:

1. **Cara melaporkan kerentanan** — untuk siapa pun yang menemukan celah.
2. **Runbook respons insiden** — langkah baku saat situs (lulushes.my.id) diserang atau bermasalah.

---

## 1. Melaporkan kerentanan

**Jangan** membuka issue publik untuk kerentanan keamanan. Gunakan pelaporan privat GitHub:

> Repo ini → tab **Security** → **Report a vulnerability**

Laporan hanya terlihat oleh pemilik repo. Sertakan langkah reproduksi dan dampaknya. Kami usahakan membalas dalam 72 jam.

---

## 2. Runbook respons insiden

> **Cara tercepat:** buka sesi Claude Code lalu bilang **"jalankan runbook: \<jenis insiden\>"**. Claude bisa mengerjakan langkah kode (revert, ubah config, redeploy lewat git). Langkah yang butuh **memasukkan kredensial atau menekan tombol di dashboard** harus kamu lakukan sendiri — Claude tidak memasukkan kunci/token atas namamu.

### Tanda-tanda insiden
- CI "Keamanan" tiba-tiba gagal, atau alert Dependabot kritikal.
- Lonjakan trafik/errors tak wajar di Vercel Analytics.
- **Lonjakan biaya di Anthropic Console** (tanda `/api/tanya` disalahgunakan).
- Tampilan situs berubah (defacement) atau muncul kode/skrip asing.
- Ada laporan kunci/token bocor.

---

### A. Secret bocor (API key/token ter-commit atau tersebar) — ⏱️ PALING MENDESAK

Anggap secret yang pernah bocor **sudah dikuasai orang**. Rotasi, jangan cuma dihapus.

1. **Rotasi semua kunci terdampak** (kamu, di dashboard masing-masing):
   - `ANTHROPIC_API_KEY` → [console.anthropic.com](https://console.anthropic.com) → API Keys → buat baru, cabut yang lama.
   - Token Upstash Redis (`KV_REST_API_TOKEN` / `UPSTASH_REDIS_REST_TOKEN`) → [console.upstash.com](https://console.upstash.com) → database → rotate.
   - Token Vercel/GitHub bila terlibat → dashboard masing-masing.
2. **Pasang kunci baru** di Vercel → Project → **Settings → Environment Variables**, lalu **Redeploy**.
3. **Pasang spend limit** di Anthropic Console sebagai batas keras.
4. Bila secret ter-commit: revert + (opsional) bersihkan history. *(Claude bisa bantu revert.)* Rotasi tetap wajib meski sudah dihapus.

### B. Penyalahgunaan `/api/tanya` / lonjakan biaya AI

1. **Batas keras dulu:** turunkan/aktifkan **spend limit di Anthropic Console**. Ini yang benar-benar menghentikan tagihan.
2. Turunkan jatah harian: env `ASISTEN_LIMIT_HARIAN` (default 150) di Vercel → redeploy. *(Claude bisa bantu.)*
3. Rate limit sudah terdistribusi via Upstash (`checkRateGlobal`); bila perlu perketat `MAX_REQUESTS_PER_WINDOW`/`WINDOW_MS` di `src/lib/ai/guard.ts`. *(Claude bisa bantu.)*
4. **Vercel → Firewall** → nyalakan **Attack Challenge Mode**, dan blokir IP penyerang.

### C. Banjir trafik / DDoS

1. **Vercel → Firewall → Attack Challenge Mode: ON** (tantang semua pengunjung sementara).
2. Tambah **rate-limit rule** di Vercel Firewall untuk path/asal yang digempur.
3. Matikan Challenge Mode setelah reda (ia menambah friksi bagi pengguna asli).

### D. Defacement / kode berbahaya ter-deploy (akun/repo dikompromi)

1. **Rollback instan:** Vercel → **Deployments** → pilih deploy bersih terakhir → **Promote to Production**. Tidak perlu build ulang.
2. **Revert** commit jahat di git lalu push. *(Claude bisa bantu.)*
3. **Rotasi kredensial GitHub & Vercel** (anggap akun bocor). Cek **Settings → Security log** GitHub.
4. Periksa apakah ruleset "Lindungi main" masih aktif & tak ada kolaborator/aksi mencurigakan.

### E. Kerentanan dependensi kritikal

1. Merge PR Dependabot yang relevan (sudah lolos CI), atau jalankan `npm audit fix` lalu deploy. *(Claude bisa bantu.)*

---

## Referensi cepat

| Sumber daya | Tautan | Untuk |
|---|---|---|
| Vercel — Deployments | vercel.com/dashboard | Rollback |
| Vercel — Firewall | Project → Firewall | Challenge Mode, blokir IP |
| Vercel — Env Vars | Project → Settings → Environment Variables | Pasang kunci baru |
| Anthropic Console | console.anthropic.com | Rotasi key, spend limit |
| Upstash Console | console.upstash.com | Rotasi token Redis |
| GitHub Security | repo → tab Security | Alert, laporan kerentanan, secret scanning |

**Env yang dipakai situs ini:** `ANTHROPIC_API_KEY`, `ASISTEN_MODEL` (opsional), `ASISTEN_LIMIT_HARIAN` (opsional), dan kredensial Upstash (`KV_REST_API_URL`/`KV_REST_API_TOKEN` atau `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`).
