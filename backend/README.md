# Backend SIPRES Kartini

API REST untuk Sistem Presensi SMA Kartini Batam. Dibangun dengan **NestJS**,
**Prisma**, dan **PostgreSQL**.

## Status Implementasi

| Modul | Status |
|-------|--------|
| Fondasi (Nest + Prisma + config) | ✅ Fase 0 |
| Auth (JWT access/refresh, RBAC global) | ✅ Fase 1 |
| Users (CRUD admin + assign role) | ✅ Fase 1 |
| Classes, Students, Subjects, Schedules, Events, Terms | ✅ Fase 2 |
| Attendance (sesi + input + trigger notif) | ✅ Fase 3 |
| Reports (persentase umum & individual) | ✅ Fase 4 |
| Notifications (push Expo + email) + Scheduler H-1 | ✅ Fase 5 |
| Frontend Web (Admin/Guru) | ⏳ Fase berikutnya |
| Mobile App (Ortu/Murid/Guru) | ⏳ Fase berikutnya |

Seluruh backend (API + logika) sudah lengkap. Skema database penuh ada di
`prisma/schema.prisma`.

## Prasyarat

- Node.js 20+ (diuji pada Node 22)
- PostgreSQL (lokal atau Supabase/Neon free tier)

## Setup

```bash
cd backend
cp .env.example .env          # isi DATABASE_URL & secrets
npm install
npm run prisma:generate       # generate Prisma Client
npm run prisma:migrate        # buat tabel (butuh DATABASE_URL aktif)
npm run seed                  # buat akun admin awal
npm run start:dev             # jalankan API (default :3000)
```

API tersedia di `http://localhost:3000/api/v1`.

## Endpoint yang Sudah Aktif

| Method | Endpoint | Role | Keterangan |
|--------|----------|------|-----------|
| POST | `/auth/login` | publik | Login → access + refresh token |
| POST | `/auth/refresh` | publik | Tukar refresh token |
| GET | `/auth/me` | login | Profil sendiri |
| GET | `/users` | ADMIN | List + filter `role`, `search`, paginasi |
| POST | `/users` | ADMIN | Buat user + assign role |
| GET | `/users/:id` | ADMIN | Detail user |
| PATCH | `/users/:id` | ADMIN | Edit semua field user |
| DELETE | `/users/:id` | ADMIN | Hapus user |
| GET/POST/PATCH/DELETE | `/classes` | ADMIN/GURU | CRUD kelas |
| GET | `/classes/:id/students` | ADMIN/GURU | Murid dalam kelas |
| GET/POST/PATCH/DELETE | `/students` | ADMIN (read: GURU) | CRUD murid |
| POST | `/students/:id/parents` | ADMIN | Tautkan akun ortu/wali |
| CRUD | `/subjects` `/schedules` `/events` `/terms` | ADMIN (read: GURU) | Master data |
| POST | `/attendance/sessions` | ADMIN/GURU | Buka sesi presensi |
| PUT | `/attendance/sessions/:id` | ADMIN/GURU | Simpan presensi (memicu notif ortu) |
| GET | `/attendance/student/:id` | semua | Riwayat kehadiran murid |
| GET | `/reports/general` | ADMIN/GURU | Persentase umum per periode |
| GET | `/reports/student/:id` | semua | Persentase individual |
| POST | `/auth/push-token` | login | Daftarkan token push mobile |
| GET | `/notifications` | login | Inbox notifikasi |

Contoh login:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kartini.sch.id","password":"admin12345"}'
```

Pakai `accessToken` pada header: `Authorization: Bearer <accessToken>`.

## Keamanan

- Password di-hash dengan **argon2**.
- **JwtAuthGuard** global — semua endpoint butuh JWT kecuali yang `@Public()`.
- **RolesGuard** global — endpoint dengan `@Roles(...)` dibatasi sesuai role.

## Struktur

```
backend/
├── prisma/
│   ├── schema.prisma   # skema DB lengkap
│   └── seed.ts         # seed admin awal
└── src/
    ├── main.ts
    ├── app.module.ts
    ├── prisma/         # PrismaService global
    ├── common/         # decorators (Roles, Public, CurrentUser) + guards
    ├── auth/           # login, refresh, JWT strategy, guards
    └── users/          # CRUD user (admin)
```
