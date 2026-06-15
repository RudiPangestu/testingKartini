# Rancangan REST API — SIPRES Kartini

Base URL: `/api/v1` · Format: JSON · Auth: `Authorization: Bearer <accessToken>`

Semua endpoint dilindungi **RBAC** kecuali login. Notasi role: `[ADMIN]`, `[GURU]`,
`[ORTU]`, `[MURID]`.

## 1. Auth

| Method | Endpoint | Role | Keterangan |
|--------|----------|------|-----------|
| POST | `/auth/login` | semua | Login → access + refresh token |
| POST | `/auth/refresh` | semua | Tukar refresh token |
| POST | `/auth/logout` | semua | Hapus refresh token |
| GET  | `/auth/me` | semua | Profil pengguna saat ini |
| POST | `/auth/push-token` | semua | Daftarkan Expo/FCM push token |

## 2. Users (Manajemen Pengguna)

| Method | Endpoint | Role | Keterangan |
|--------|----------|------|-----------|
| GET | `/users` | ADMIN | List + filter `role`, search |
| POST | `/users` | ADMIN | Buat user + assign role |
| GET | `/users/:id` | ADMIN | Detail user |
| PATCH | `/users/:id` | ADMIN | Edit **semua field** + role |
| DELETE | `/users/:id` | ADMIN | Nonaktifkan/hapus user |

## 3. Classes (Kelas)

| Method | Endpoint | Role | Keterangan |
|--------|----------|------|-----------|
| GET | `/classes` | ADMIN, GURU | List kelas |
| POST | `/classes` | ADMIN, GURU | Buat kelas |
| GET | `/classes/:id` | ADMIN, GURU, ORTU | Detail kelas |
| PATCH | `/classes/:id` | ADMIN, GURU | Edit kelas |
| DELETE | `/classes/:id` | ADMIN | Hapus kelas |
| GET | `/classes/:id/students` | ADMIN, GURU | Daftar murid dalam kelas |

## 4. Students (Murid)

| Method | Endpoint | Role | Keterangan |
|--------|----------|------|-----------|
| GET | `/students` | ADMIN, GURU | List + filter `classId`, search NISN/nama |
| POST | `/students` | ADMIN | Tambah murid (NISN, nama, kelas, dll.) |
| GET | `/students/:id` | ADMIN, GURU, ORTU | Detail murid |
| PATCH | `/students/:id` | ADMIN | Edit **semua field** (termasuk pindah kelas) |
| DELETE | `/students/:id` | ADMIN | Hapus murid |
| POST | `/students/:id/parents` | ADMIN | Tautkan akun ortu/wali |

## 5. Subjects (Mata Pelajaran)

| Method | Endpoint | Role | Keterangan |
|--------|----------|------|-----------|
| GET | `/subjects` | ADMIN, GURU | List mapel |
| POST | `/subjects` | ADMIN | Tambah mapel |
| PATCH | `/subjects/:id` | ADMIN | Edit mapel |
| DELETE | `/subjects/:id` | ADMIN | Hapus mapel |

## 6. Schedules (Jadwal Mapel)

| Method | Endpoint | Role | Keterangan |
|--------|----------|------|-----------|
| GET | `/schedules` | ADMIN, GURU | Filter `classId`, `teacherId`, `day` |
| POST | `/schedules` | ADMIN | Buat jadwal (mapel, hari, jam, kelas, guru) |
| PATCH | `/schedules/:id` | ADMIN | Edit jadwal |
| DELETE | `/schedules/:id` | ADMIN | Hapus jadwal |

## 7. Events (Kegiatan Sekolah)

| Method | Endpoint | Role | Keterangan |
|--------|----------|------|-----------|
| GET | `/events` | semua | Filter tanggal, kelas |
| POST | `/events` | ADMIN | Buat kegiatan (tanggal, jam, sasaran) |
| PATCH | `/events/:id` | ADMIN | Edit kegiatan |
| DELETE | `/events/:id` | ADMIN | Hapus kegiatan |

## 8. Attendance (Presensi)

| Method | Endpoint | Role | Keterangan |
|--------|----------|------|-----------|
| POST | `/attendance/sessions` | ADMIN, GURU | Buka sesi presensi (dari jadwal/kegiatan) |
| GET | `/attendance/sessions` | ADMIN, GURU | List sesi (filter tanggal, kelas) |
| PUT | `/attendance/sessions/:id` | ADMIN, GURU | Simpan/ubah presensi murid (bulk) |
| GET | `/attendance/sessions/:id` | ADMIN, GURU | Detail presensi 1 sesi |
| GET | `/attendance/student/:studentId` | ADMIN, GURU, ORTU | Riwayat kehadiran murid |

Contoh body `PUT /attendance/sessions/:id`:

```json
{
  "records": [
    { "studentId": "uuid-1", "status": "HADIR" },
    { "studentId": "uuid-2", "status": "SAKIT", "note": "Surat dokter" },
    { "studentId": "uuid-3", "status": "ALPHA" }
  ]
}
```

> Saat presensi disimpan, backend otomatis memicu **notifikasi** ke ortu murid
> yang Sakit/Izin/Alpha (sesuai pengaturan).

## 9. Reports (Laporan Persentase)

| Method | Endpoint | Role | Keterangan |
|--------|----------|------|-----------|
| GET | `/reports/general` | ADMIN, GURU | Persentase umum. Query `period=day\|week\|month\|mid\|semester\|year`, `date`/`termId` |
| GET | `/reports/student/:studentId` | ADMIN, GURU, ORTU | Persentase individual. Query `period=triwulan\|semester\|year`, `termId` |
| GET | `/reports/class/:classId` | ADMIN, GURU | Rekap kehadiran per kelas |

Contoh respons `/reports/student/:studentId?period=semester&termId=...`:

```json
{
  "studentId": "uuid-1",
  "period": "semester",
  "term": "Semester Ganjil 2025/2026",
  "totalSessions": 120,
  "hadir": 108,
  "sakit": 5,
  "izin": 4,
  "alpha": 3,
  "hadirEfektifPct": 90.0,
  "kehadiranSahPct": 97.5,
  "alphaPct": 2.5
}
```

## 10. Notifications

| Method | Endpoint | Role | Keterangan |
|--------|----------|------|-----------|
| GET | `/notifications` | semua | Inbox notifikasi pengguna |
| PATCH | `/notifications/:id/read` | semua | Tandai dibaca |
| POST | `/notifications/broadcast` | ADMIN | Pengumuman/Info ke audiens (`target=ALL\|ROLE\|CLASS`) |

Body `POST /notifications/broadcast`:

```json
{ "title": "Libur", "body": "Sekolah libur besok", "target": "ROLE", "role": "ORTU" }
```

## 11. Konvensi Umum

- **Pagination**: `?page=1&limit=20` → respons `{ data, meta: { total, page, limit } }`.
  `page`/`limit` divalidasi (limit maks 500).
- **Error format**: `{ statusCode, message, error }`.
- **Validasi**: 400 input invalid, 401 unauth, 403 forbidden (role/kepemilikan),
  404 not found, 409 konflik (mis. data masih direferensikan).
- **Rate limiting**: maks 100 req/menit/IP (login 10/menit). Lebih → 429.
- **Audit log**: setiap operasi mutasi (POST/PATCH/PUT/DELETE) dicatat ke
  `audit_logs` (actor, aksi, entitas, perubahan).
- **Tanggal**: ISO 8601 (`YYYY-MM-DD`, `HH:mm`).
