# Perencanaan Aplikasi SIPRES Kartini

Dokumen ini adalah **master plan** pengembangan aplikasi presensi terintegrasi
SMA Kartini Batam. Disusun agar tim dapat membangun produk yang efektif, efisien,
dan profesional.

---

## 1. Latar Belakang & Tujuan

SMA Kartini Batam membutuhkan sistem presensi digital yang menggantikan pencatatan
manual, memberikan transparansi kehadiran kepada orang tua secara real-time, dan
menyediakan data analitik kehadiran untuk pengambilan keputusan sekolah.

### Tujuan Bisnis

1. Orang tua menerima laporan kehadiran anak secara otomatis.
2. Sekolah mendapat data persentase kehadiran (umum & individual) per periode.
3. Mengurangi beban administrasi guru & wali kelas.
4. Reminder kegiatan sekolah agar partisipasi murid meningkat.
5. Hemat biaya — memaksimalkan layanan **free tier**.

### Sasaran Pengguna

- ± 1 admin / operator sekolah
- ± 30–60 guru
- ± 500–1000 murid + orang tua/wali

---

## 2. Ruang Lingkup (Scope)

### In-Scope (MVP)

- Autentikasi & otorisasi berbasis role (Admin, Guru, Orang Tua/Murid).
- Manajemen user oleh admin (assign role, edit semua field via GUI).
- Master data: Kelas, Murid (NISN, nama, kelas, dll.), Mata Pelajaran, Jadwal, Kegiatan.
- Input presensi manual oleh guru (per jadwal mapel & per kegiatan).
- Status kehadiran: **Hadir, Sakit, Izin, Alpha**.
- Laporan persentase kehadiran umum & individual per periode.
- Notifikasi: push (mobile), email, dan opsi WhatsApp ke orang tua.
- Reminder kegiatan sekolah **H-1** via push notification.
- Web (Admin/Guru) + Mobile (Orang Tua/Murid + Guru).

### Out-of-Scope (Fase Lanjutan)

- Presensi otomatis (QR/RFID/biometrik/GPS) — semua input manual oleh guru.
- Integrasi e-rapor / Dapodik.
- Pembayaran SPP / keuangan.
- Modul nilai akademik.

> Catatan: arsitektur dirancang **modular** agar fitur out-of-scope mudah ditambah
> di kemudian hari (misalnya presensi QR).

---

## 3. Persona & User Story

### Admin

- Sebagai admin, saya bisa **membuat & mengedit semua user** (admin/guru/ortu/murid)
  serta meng-assign rolenya lewat GUI.
- Sebagai admin, saya bisa **CRUD kelas** dan mengubah kelas yang sudah dibuat.
- Sebagai admin, saya bisa **CRUD murid** (NISN, nama, kelas, dll.) dan mengubah
  data murid yang sudah ada.
- Sebagai admin, saya bisa melihat **daftar murid dalam satu kelas** dan mengubahnya.
- Sebagai admin, saya bisa **CRUD mata pelajaran** beserta hari, jam, kelas, dan guru.
- Sebagai admin, saya bisa **CRUD kegiatan sekolah** pada hari & jam tertentu yang
  bisa diabsen.
- Sebagai admin, **semua field dapat saya edit**.

### Guru

- Sebagai guru, saya bisa melihat jadwal & kelas yang saya ampu.
- Sebagai guru, saya bisa **CRUD kelas** yang saya kelola.
- Sebagai guru, saya bisa **input presensi murid** secara manual untuk setiap
  pertemuan mapel atau kegiatan.

### Orang Tua / Murid

- Sebagai orang tua/murid, saya bisa melihat **riwayat kehadiran** murid.
- Sebagai orang tua/murid, saya bisa melihat **persentase kehadiran umum**
  (hari/minggu/bulan/mid/semester/tahun).
- Sebagai orang tua/murid, saya bisa melihat **persentase kehadiran individual**
  (triwulan/semester/tahun).
- Sebagai orang tua, saya menerima **notifikasi** saat anak tidak hadir & reminder
  kegiatan H-1.

---

## 4. Arsitektur Sistem (Ringkas)

```
                ┌──────────────────────────────────────────┐
                │              KLIEN (Frontend)             │
                │                                            │
  Web (Admin/   │   React + Vite          React Native      │  Mobile (Ortu/
  Guru) ───────►│   + Tailwind     +      (Expo)            │◄── Murid/Guru)
                └───────────────┬──────────────┬────────────┘
                                │  REST/HTTPS   │
                                ▼               ▼
                ┌──────────────────────────────────────────┐
                │            BACKEND API (NestJS)            │
                │  Auth · Users · Classes · Students ·       │
                │  Subjects · Schedules · Events ·           │
                │  Attendance · Reports · Notifications      │
                │                                            │
                │  node-cron (scheduler reminder H-1)        │
                └───────┬───────────────┬───────────────┬────┘
                        │               │               │
                        ▼               ▼               ▼
                 ┌────────────┐  ┌────────────┐  ┌──────────────┐
                 │ PostgreSQL │  │ Expo/FCM   │  │ SMTP / WA    │
                 │ (Supabase) │  │ Push       │  │ Gateway      │
                 └────────────┘  └────────────┘  └──────────────┘
```

Detail lengkap di [ARSITEKTUR.md](ARSITEKTUR.md).

---

## 5. Modul & Fitur per Role

| Modul | Admin | Guru | Ortu/Murid |
|-------|:-----:|:----:|:----------:|
| Manajemen User | CRUD penuh | — | Profil sendiri |
| Kelas | CRUD penuh | CRUD kelas diampu | Lihat |
| Murid | CRUD penuh | Lihat | Lihat (anaknya) |
| Mata Pelajaran | CRUD penuh | Lihat | — |
| Jadwal | CRUD penuh | Lihat | Lihat |
| Kegiatan | CRUD penuh | Input absen | Lihat + notif |
| Presensi | Lihat/edit semua | Input & edit | Lihat |
| Laporan Persentase | Semua | Kelas diampu | Anaknya |
| Notifikasi | Atur template | — | Terima |

---

## 6. Strategi Notifikasi

| Kanal | Teknologi (Gratis) | Use Case |
|-------|--------------------|----------|
| Push Mobile | Expo Push / FCM | Laporan kehadiran harian, reminder H-1 |
| Email | Gmail SMTP / Resend free | Laporan kehadiran, rekap mingguan |
| WhatsApp (opsi) | Fonnte / WA gateway free tier | Laporan ke ortu via nomor HP |

- **Trigger laporan kehadiran**: saat guru menyimpan presensi, sistem mengirim notif
  ke orang tua murid yang **Sakit/Izin/Alpha** (atau semua, sesuai pengaturan).
- **Reminder H-1**: `node-cron` berjalan harian (mis. 17:00), mencari kegiatan
  besok, lalu mengirim push ke murid/ortu terkait.

Detail di [NOTIFIKASI.md](NOTIFIKASI.md).

---

## 7. Perhitungan Persentase Kehadiran

- **Umum (general)**: agregat kehadiran seluruh murid per periode
  (hari/minggu/bulan/mid/semester/tahun).
- **Individual**: kehadiran per murid per periode (triwulan/semester/tahun).

Rumus dasar:

```
% Kehadiran = (Jumlah Hadir / Total Pertemuan Terjadwal) × 100
```

Rumus, definisi periode (mid, triwulan, semester), dan penanganan
Sakit/Izin/Alpha dijelaskan lengkap di
[PERHITUNGAN-KEHADIRAN.md](PERHITUNGAN-KEHADIRAN.md).

---

## 8. Tech Stack & Justifikasi (Free First)

| Komponen | Pilihan | Free Tier | Alasan |
|----------|---------|-----------|--------|
| Backend | NestJS | ✅ Open source | Modular, TypeScript, cocok tim |
| DB | PostgreSQL via Supabase/Neon | ✅ | Relasional, free tier memadai |
| ORM | Prisma | ✅ | Migrasi & type-safety |
| Web | React + Vite + Tailwind + shadcn/ui | ✅ | UI/UX modern, cepat |
| Mobile | React Native (Expo) | ✅ EAS free | 1 codebase, OTA update |
| Push | Expo Push / FCM | ✅ | Notifikasi gratis |
| Email | Gmail SMTP / Resend | ✅ | Gratis untuk volume sekolah |
| WA | Fonnte (free tier) | ⚠️ terbatas | Alternatif jika perlu WA |
| Hosting API | Railway/Render/Fly.io | ✅ | Deploy gratis |
| Hosting Web | Vercel/Netlify | ✅ | Deploy gratis |
| CI/CD | GitHub Actions | ✅ | Otomatisasi gratis |

> **Catatan penting soal WhatsApp**: WhatsApp Business API resmi **berbayar**.
> Untuk gratis, gunakan **email** sebagai kanal utama ke orang tua, dan WA gateway
> pihak ketiga (mis. Fonnte) sebagai opsi dengan kuota terbatas. Push notification
> mobile adalah kanal utama yang sepenuhnya gratis.

---

## 9. Roadmap & Milestone

| Fase | Durasi | Deliverable | Definition of Done |
|------|--------|-------------|--------------------|
| **0. Persiapan** | 1 mgg | Repo, tooling, CI, konvensi | Lint + CI hijau, struktur folder siap |
| **1. Fondasi & Auth** | 2 mgg | DB schema, auth JWT, manajemen user | Admin bisa login & CRUD user + assign role |
| **2. Master Data** | 2 mgg | CRUD kelas, murid, mapel, jadwal, kegiatan | Admin bisa kelola semua master data via GUI |
| **3. Presensi** | 2 mgg | Input presensi guru | Guru bisa input & edit presensi per pertemuan |
| **4. Laporan** | 2 mgg | Dashboard & persentase | Persentase umum & individual akurat per periode |
| **5. Notifikasi** | 2 mgg | Push, email/WA, reminder H-1 | Ortu terima notif kehadiran & reminder |
| **6. Mobile App** | 3 mgg | App Expo (ortu/murid + guru) | Login, lihat kehadiran, terima push |
| **7. Finalisasi** | 2 mgg | Testing, deploy, dok, pelatihan | UAT lolos, produksi live, manual book |

**Total estimasi: ± 14 minggu** (dapat dipersingkat dengan paralelisasi web & backend).

### Prioritas MVP (rilis pertama tercepat)

`Auth → Master Data → Presensi → Laporan dasar` → rilis internal untuk guru.
Notifikasi & mobile menyusul di iterasi berikutnya.

---

## 10. Standar Kualitas & UI/UX

- **Desain**: konsisten (design tokens), responsif, aksesibel (kontras, font ≥14px).
- **Komponen**: shadcn/ui + Tailwind untuk konsistensi & kecepatan.
- **Bahasa**: seluruh UI dalam Bahasa Indonesia.
- **Empty/Loading/Error state** ditangani di setiap halaman.
- **Validasi**: di frontend (UX) & backend (keamanan) — gunakan Zod/class-validator.
- **Audit log**: catat perubahan penting (siapa mengubah apa) untuk akuntabilitas.

---

## 11. Keamanan & Privasi

- Password di-hash (bcrypt/argon2), autentikasi **JWT** + refresh token.
- Otorisasi berbasis role (RBAC) di setiap endpoint.
- Data murid bersifat sensitif → akses dibatasi sesuai role; ortu hanya melihat anaknya.
- HTTPS wajib, rate limiting, validasi input, proteksi terhadap SQL injection (ORM).
- Backup database berkala (free tier Supabase menyediakan backup).
- Patuh prinsip minimalisasi data pribadi.

---

## 12. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| WA API berbayar | Notif WA terbatas | Andalkan push + email gratis; WA opsional |
| Free tier limit (DB/hosting) | Layanan terganggu saat scale | Monitor kuota, siapkan rencana upgrade murah |
| Guru lupa input presensi | Data tidak lengkap | Reminder ke guru + dashboard kelas "belum diabsen" |
| Data orang tua tidak update | Notif gagal terkirim | Verifikasi nomor/email saat onboarding |
| Adopsi pengguna rendah | Sistem tak terpakai | UI sederhana + pelatihan + manual book |

---

## 13. Langkah Selanjutnya

1. **Konfirmasi tech stack** & kanal notifikasi (email vs WA) dengan pihak sekolah.
2. Setup **Fase 0**: scaffold `backend/`, `web/`, `mobile/`, CI GitHub Actions.
3. Implementasi **Fase 1** (Auth & manajemen user) sebagai fondasi.
4. Iterasi sesuai roadmap di atas dengan demo per fase.

> Lihat dokumen pendukung di folder [`docs/`](.) untuk detail arsitektur, database,
> API, notifikasi, dan perhitungan kehadiran.
