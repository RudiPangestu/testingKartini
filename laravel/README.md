# SIPRES Kartini — Versi Laravel (Blade + Livewire)

Port penuh SIPRES Kartini dari **NestJS + Prisma + React** ke **PHP + Laravel (Blade + Livewire)**.
Aplikasi monolitik server-side: backend dan tampilan jadi satu, murni PHP/Laravel.

> **Status fondasi: ✅ TERVERIFIKASI BERJALAN** — diuji end-to-end di **Laravel 13 + Livewire 4 + PHP 8.5**:
> migrasi 20 tabel, seeder akun demo, login (session, RBAC), dan dashboard semuanya jalan.
> Modul-modul aplikasi (CRUD Livewire) masih dibangun bertahap — lihat [Peta Modul & Progress](#peta-modul--progress).

Ini adalah **project Laravel lengkap** (bisa langsung dijalankan), bukan sekadar potongan file.

---

## Stack

| Lapisan | Teknologi |
|---|---|
| Bahasa | PHP 8.2+ (diuji di 8.5) |
| Framework | Laravel 13 |
| UI | Blade + **Livewire 4** (server-driven, tanpa React) |
| Styling | Tailwind CSS (via Play CDN — bisa diupgrade ke Vite) |
| Auth | Session bawaan Laravel + RBAC (middleware `role`) |
| Database | SQLite (default) / PostgreSQL / MySQL |
| Excel | `phpoffice/phpspreadsheet` (menyusul di modul Laporan/Impor) |

---

## Cara Menjalankan

```bash
# 1) Pasang PHP + Composer (macOS):
brew install php composer

# 2) Masuk ke folder ini & pasang dependency:
cd laravel
composer install

# 3) Environment + app key:
cp .env.example .env
php artisan key:generate

# 4) Database (SQLite = paling cepat, sudah jadi default .env):
touch database/database.sqlite
php artisan migrate --seed

# 5) Jalankan:
php artisan serve
```

Buka **http://localhost:8000** → login dengan salah satu akun demo di bawah.

### Akun demo (dari seeder)
| Role | Email | Password |
|---|---|---|
| Admin | `admin@kartini.sch.id` | `password` |
| Guru | `guru@kartini.sch.id` | `password` |
| Ortu | `ortu@kartini.sch.id` | `password` |
| Murid | `murid@kartini.sch.id` | `password` |

> **Pakai PostgreSQL/Neon?** Ubah di `.env`: `DB_CONNECTION=pgsql` + isi `DB_HOST/DB_PORT/DB_DATABASE/DB_USERNAME/DB_PASSWORD`. Untuk Neon tambahkan `'sslmode' => 'require'` pada koneksi `pgsql` di `config/database.php`.

---

## Catatan Teknis

- **UUID** sebagai primary key semua tabel (mirror skema Prisma lama).
- **Password** disimpan di kolom `password_hash`; `User::getAuthPassword()` menunjuk ke sana. Hanya akun `is_active = true` yang bisa login.
- **RBAC**: `->middleware('role:ADMIN,GURU')` (alias didaftarkan di `bootstrap/app.php` → `App\Http\Middleware\EnsureRole`).
- **SQLite** dipilih agar zero-config. `notify_statuses` disimpan sebagai JSON (bukan array Postgres) demi portabilitas.
- **Excel** (`maatwebsite/excel`) belum bisa dipasang di PHP 8.5 (dependency `phpspreadsheet` masih membatasi `<8.5`). Modul Laporan/Impor nanti akan memakai `phpoffice/phpspreadsheet` versi terbaru secara langsung.

---

## Peta Modul & Progress

| Modul | Setara NestJS | Status |
|---|---|---|
| Skema DB (20 migration) | `prisma/schema.prisma` | ✅ |
| Model Eloquent + relasi (20) | Prisma models | ✅ |
| Enum (10) | Prisma enums | ✅ |
| Seeder (akun demo) | `prisma/seed.ts` | ✅ |
| Auth + RBAC | `auth/`, guards | ✅ |
| Layout + navigasi | `web/Layout.tsx` | ✅ |
| Dashboard | `DashboardPage.tsx` | ✅ |
| Pengguna | `users/` | ✅ |
| Kelas | `classes/` | ✅ |
| Murid + tautan ortu | `students/` | ✅ |
| Mata Pelajaran | `subjects/` | ✅ |
| Jadwal | `schedules/` | ✅ |
| Kegiatan | `events/` | ✅ |
| Periode | `terms/` | ✅ |
| Presensi | `attendance/` | ✅ |
| Daftar Hadir (matriks) | Daftar Hadir | ✅ |
| Daftar Nilai (Daflai) | `grades/` | ✅ |
| Buku Batas | `lesson-logs/` | ✅ |
| Laporan (persentase) | `reports/` | ✅ |
| Notifikasi + Pengumuman | `notifications/` | ✅ |
| Pengaturan | `settings/` | ✅ |
| Terjadwal (reminder/rekap) | `scheduler/` | ✅ |
| Portal keluarga (ORTU/MURID) | Family pages | ✅ |
| Impor / Ekspor Excel | `import/`, `reports export` | ⏳ tertunda (PHP 8.5) |

✅ = selesai & terverifikasi · ⏳ = tertunda

> Semua modul di atas diuji via login-flow (admin & ortu) → render 200, RBAC benar.
> Hanya **Impor/Ekspor Excel** yang tertunda karena `phpspreadsheet` belum mendukung PHP 8.5.
