# Skema Database — SIPRES Kartini

Database: **PostgreSQL**. ORM: **Prisma**. Dokumen ini menjelaskan entitas, relasi,
dan ERD.

## 1. ERD (Entity Relationship Diagram)

```mermaid
erDiagram
    USER ||--o{ STUDENT_PARENT : "wali dari"
    USER ||--o{ ATTENDANCE : "mencatat (guru)"
    USER ||--o{ PUSH_TOKEN : memiliki
    USER ||--o{ NOTIFICATION : menerima

    CLASS ||--o{ STUDENT : memiliki
    CLASS ||--o{ SCHEDULE : memiliki
    USER  ||--o{ CLASS : "wali kelas"

    STUDENT ||--o{ STUDENT_PARENT : "punya wali"
    STUDENT ||--o{ ATTENDANCE : "diabsen"

    SUBJECT ||--o{ SCHEDULE : dijadwalkan
    USER    ||--o{ SCHEDULE : "mengajar (guru)"

    SCHEDULE ||--o{ ATTENDANCE_SESSION : "menghasilkan sesi"
    EVENT    ||--o{ ATTENDANCE_SESSION : "menghasilkan sesi"
    ATTENDANCE_SESSION ||--o{ ATTENDANCE : "berisi"

    TERM ||--o{ ATTENDANCE_SESSION : "periode"
```

## 2. Daftar Tabel

### `users`
Menyimpan semua pengguna (admin/guru/orang tua/murid-akun).

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | uuid (PK) | |
| role | enum(ADMIN, GURU, ORTU, MURID) | peran pengguna |
| full_name | varchar | nama lengkap |
| email | varchar (unique) | login & notif email |
| phone | varchar | nomor HP (notif WA) |
| password_hash | varchar | hash bcrypt/argon2 |
| is_active | boolean | status aktif |
| created_at / updated_at | timestamp | |

> Admin dapat mengedit **semua field** user lewat GUI dan meng-assign `role`.

### `classes` (Kelas)
| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | uuid (PK) | |
| name | varchar | mis. "XII IPA 1" |
| grade | int | tingkat (10/11/12) |
| academic_year | varchar | mis. "2025/2026" |
| homeroom_teacher_id | uuid (FK→users) | wali kelas (guru) |
| created_at / updated_at | timestamp | |

### `students` (Murid)
| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | uuid (PK) | |
| nisn | varchar (unique) | Nomor Induk Siswa Nasional |
| nis | varchar | nomor induk sekolah (opsional) |
| full_name | varchar | nama murid |
| class_id | uuid (FK→classes) | kelas saat ini |
| gender | enum(L, P) | |
| birth_date | date | |
| address | text | alamat |
| user_id | uuid (FK→users, nullable) | akun murid (jika ada) |
| created_at / updated_at | timestamp | |

> Admin dapat melihat seluruh murid dalam satu kelas (filter `class_id`) dan
> mengubah seluruh field. Memindah murid antar kelas = ubah `class_id`.

### `student_parents` (Relasi Murid ↔ Wali)
Menghubungkan murid dengan satu/lebih akun orang tua/wali penerima notifikasi.

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | uuid (PK) | |
| student_id | uuid (FK→students) | |
| parent_user_id | uuid (FK→users) | akun ortu (role ORTU) |
| relation | varchar | ayah/ibu/wali |

### `subjects` (Mata Pelajaran)
| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | uuid (PK) | |
| name | varchar | mis. "Matematika" |
| code | varchar | kode mapel |

### `schedules` (Jadwal Mapel)
Mapel pada **hari, jam, kelas, dan guru** tertentu.

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | uuid (PK) | |
| subject_id | uuid (FK→subjects) | |
| class_id | uuid (FK→classes) | |
| teacher_id | uuid (FK→users) | guru pengampu |
| day_of_week | enum(SEN..SAB) | hari |
| start_time | time | jam mulai |
| end_time | time | jam selesai |
| academic_year | varchar | |

### `events` (Kegiatan Sekolah)
Kegiatan pada hari & jam tertentu yang muridnya bisa diabsen.

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | uuid (PK) | |
| title | varchar | nama kegiatan |
| description | text | |
| event_date | date | tanggal kegiatan |
| start_time | time | |
| end_time | time | |
| location | varchar | |
| target_class_id | uuid (FK→classes, nullable) | kelas sasaran (null = semua) |
| created_by | uuid (FK→users) | |

> Reminder H-1 dihitung dari `event_date`.

### `attendance_sessions` (Sesi Presensi)
Satu pertemuan konkret yang diabsen — berasal dari **jadwal** atau **kegiatan**.

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | uuid (PK) | |
| source_type | enum(SCHEDULE, EVENT) | sumber sesi |
| schedule_id | uuid (FK→schedules, nullable) | jika dari jadwal |
| event_id | uuid (FK→events, nullable) | jika dari kegiatan |
| session_date | date | tanggal pertemuan |
| term_id | uuid (FK→terms) | periode (untuk laporan) |
| created_by | uuid (FK→users) | guru pencatat |
| created_at | timestamp | |

### `attendance` (Presensi per Murid)
| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | uuid (PK) | |
| session_id | uuid (FK→attendance_sessions) | |
| student_id | uuid (FK→students) | |
| status | enum(HADIR, SAKIT, IZIN, ALPHA) | status kehadiran |
| note | text | catatan (opsional) |
| recorded_by | uuid (FK→users) | guru |
| recorded_at | timestamp | |

> Unique constraint `(session_id, student_id)` mencegah duplikasi.

### `terms` (Periode Akademik)
Mendefinisikan periode untuk perhitungan persentase.

| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | uuid (PK) | |
| academic_year | varchar | mis. "2025/2026" |
| type | enum(SEMESTER, TRIWULAN, MID) | jenis periode |
| name | varchar | mis. "Semester Ganjil", "Triwulan 1" |
| start_date | date | |
| end_date | date | |

### `push_tokens`
| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | uuid (PK) | |
| user_id | uuid (FK→users) | |
| token | varchar | Expo/FCM push token |
| platform | enum(ANDROID, IOS) | |
| created_at | timestamp | |

### `notifications`
| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | uuid (PK) | |
| user_id | uuid (FK→users) | penerima |
| type | enum(KEHADIRAN, REMINDER, INFO) | |
| title | varchar | |
| body | text | |
| channel | enum(PUSH, EMAIL, WA) | kanal |
| is_read | boolean | |
| sent_at | timestamp | |

### `audit_logs` (opsional, akuntabilitas)
| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | uuid (PK) | |
| actor_id | uuid (FK→users) | siapa |
| action | varchar | mis. "UPDATE_STUDENT" |
| entity | varchar | tabel/entitas |
| entity_id | uuid | |
| changes | jsonb | sebelum/sesudah |
| created_at | timestamp | |

## 3. Catatan Desain

- **Sesi presensi** dipisah dari jadwal agar satu jadwal mingguan menghasilkan
  banyak pertemuan tanggal berbeda → memudahkan rekap & persentase per periode.
- **`term_id`** pada sesi mempercepat query laporan per triwulan/semester/tahun.
- **Status SAKIT/IZIN/ALPHA** disimpan eksplisit agar persentase fleksibel
  (lihat [PERHITUNGAN-KEHADIRAN.md](PERHITUNGAN-KEHADIRAN.md)).
- Gunakan **index** pada `attendance(student_id)`, `attendance_sessions(session_date, term_id)`
  untuk performa laporan.
