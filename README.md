# SIPRES Kartini — Sistem Presensi Terintegrasi SMA Kartini Batam

> Aplikasi presensi sekolah terintegrasi (Web + Mobile) dengan notifikasi otomatis
> ke orang tua/wali, rekap kehadiran, dan analitik persentase kehadiran.

[![Status](https://img.shields.io/badge/status-planning-yellow)]()
[![Lisensi](https://img.shields.io/badge/lisensi-MIT-blue)]()

---

## 🎯 Ringkasan

**SIPRES Kartini** (Sistem Presensi Kartini) adalah platform presensi digital untuk
SMA Kartini Batam yang menghubungkan **Admin**, **Guru**, dan **Orang Tua/Murid**
dalam satu ekosistem terintegrasi.

Tujuan utama:

1. **Kehadiran murid otomatis ter-report ke orang tua** (push notification + email/WA).
2. **Persentase kehadiran umum** per hari / minggu / bulan / mid / semester / tahun.
3. **Persentase kehadiran individual** per triwulan / semester / tahun.
4. **Reminder kegiatan sekolah H-1** lewat push notification di aplikasi mobile.
5. Semua report terhubung ke **nomor HP / email** yang didaftarkan.

## 👥 Peran Pengguna (Role)

| Role | Akses Utama |
|------|-------------|
| **Admin** | Kontrol penuh — kelola semua user, kelas, murid, mapel, jadwal, kegiatan, dan seluruh field bisa diedit lewat GUI |
| **Guru** | CRUD kelas yang diampu & input presensi murid (manual) |
| **Orang Tua / Murid** | Melihat kehadiran murid + persentase kehadiran (umum & individual) |

## 🧩 Fitur Inti

- 🔐 Autentikasi & manajemen role (Admin / Guru / Orang Tua / Murid)
- 🏫 CRUD Kelas, Murid (NISN, nama, kelas, dll.), Mata Pelajaran, Jadwal, Kegiatan
- ✅ Input presensi manual oleh guru (Hadir / Sakit / Izin / Alpha)
- 📲 Push notification mobile (laporan kehadiran harian + reminder kegiatan H-1)
- 📧 Notifikasi ke orang tua via email & WhatsApp gateway (opsi gratis)
- 📊 Dashboard & laporan persentase kehadiran (umum + individual)
- 🌐 Web (Admin/Guru) + 📱 Mobile (Orang Tua/Murid, Guru)

## 🛠️ Tech Stack (Prioritas Gratis)

| Lapisan | Teknologi | Alasan |
|---------|-----------|--------|
| Backend API | **NestJS (Node.js + TypeScript)** | Terstruktur, scalable, gratis |
| Database | **PostgreSQL** (Supabase / Neon free tier) | Relasional, free tier memadai |
| ORM | **Prisma** | Type-safe, migrasi mudah |
| Web Frontend | **React + Vite + TypeScript** + Tailwind + shadcn/ui | UI/UX modern & cepat |
| Mobile | **React Native (Expo)** | 1 codebase Android/iOS, build gratis (EAS) |
| Push Notif | **Expo Push / Firebase Cloud Messaging (FCM)** | Gratis |
| Email | **Gmail SMTP / Resend free tier** | Gratis |
| WhatsApp | **Fonnte / WA gateway free tier** (opsional) | Alternatif gratis |
| Hosting API | **Railway / Render / Fly.io free tier** | Gratis |
| Hosting Web | **Vercel / Netlify** | Gratis |
| Scheduler | **node-cron** (reminder H-1) | Gratis, built-in |

> Rincian lengkap, justifikasi, dan rencana fase ada di **[docs/PERENCANAAN.md](docs/PERENCANAAN.md)**.

## 📚 Dokumentasi

| Dokumen | Isi |
|---------|-----|
| [docs/PERENCANAAN.md](docs/PERENCANAAN.md) | Perencanaan lengkap: arsitektur, modul, roadmap, milestone |
| [docs/ARSITEKTUR.md](docs/ARSITEKTUR.md) | Arsitektur sistem & diagram |
| [docs/DATABASE.md](docs/DATABASE.md) | Skema database (ERD) & penjelasan tabel |
| [docs/API.md](docs/API.md) | Rancangan endpoint REST API |
| [docs/NOTIFIKASI.md](docs/NOTIFIKASI.md) | Strategi notifikasi (push, email, WA) |
| [docs/PERHITUNGAN-KEHADIRAN.md](docs/PERHITUNGAN-KEHADIRAN.md) | Rumus & logika persentase kehadiran |

## 🗺️ Roadmap Singkat

- **Fase 0 — Persiapan** (1 minggu): setup repo, tooling, CI.
- **Fase 1 — Fondasi & Auth** (2 minggu): database, auth, manajemen user.
- **Fase 2 — Master Data** (2 minggu): CRUD kelas, murid, mapel, jadwal, kegiatan.
- **Fase 3 — Presensi** (2 minggu): input presensi guru + status kehadiran.
- **Fase 4 — Laporan & Analitik** (2 minggu): persentase umum & individual.
- **Fase 5 — Notifikasi** (2 minggu): push, email/WA, reminder H-1.
- **Fase 6 — Mobile App** (3 minggu): React Native untuk ortu/murid & guru.
- **Fase 7 — Finalisasi** (2 minggu): testing, deploy, dokumentasi, pelatihan.

## 📁 Struktur Repository (Rencana)

```
testingKartini/
├── README.md
├── docs/                  # Dokumentasi perencanaan
├── backend/               # NestJS API (Fase 1+)
├── web/                   # React web admin/guru (Fase 1+)
├── mobile/                # React Native Expo (Fase 6+)
└── .github/workflows/     # CI/CD
```

## 📄 Lisensi

MIT © SMA Kartini Batam
