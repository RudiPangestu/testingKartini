# Panduan Deployment — SIPRES Kartini

## 1. Docker Compose (cara tercepat)

Prasyarat: Docker + Docker Compose.

```bash
# (opsional) buat .env di root untuk menimpa default
cat > .env <<'EOF'
POSTGRES_USER=sipres
POSTGRES_PASSWORD=ganti-password-kuat
POSTGRES_DB=sipres
JWT_ACCESS_SECRET=rahasia-access-acak
JWT_REFRESH_SECRET=rahasia-refresh-acak
SEED_ADMIN_EMAIL=admin@kartini.sch.id
SEED_ADMIN_PASSWORD=admin12345
EOF

# Build & jalankan Postgres + Backend + Web
docker compose up -d --build

# Migrasi otomatis dijalankan saat backend start.
# Seed admin awal (sekali saja):
docker compose exec backend npm run seed
```

Layanan:
- **Web Admin/Guru** → http://localhost:8080
- **Backend API** → http://localhost:3000/api/v1
- **PostgreSQL** → port internal 5432 (volume `db_data` persisten)

Hentikan: `docker compose down` (tambah `-v` untuk hapus data).

## 2. Komponen terpisah (tanpa Docker)

### Backend
```bash
cd backend
cp .env.example .env        # isi DATABASE_URL & JWT secrets
npm ci
npx prisma migrate deploy
npm run seed
npm run build && npm run start:prod
```

### Web (Admin/Guru)
```bash
cd web
npm ci
npm run build               # hasil di web/dist (sajikan via Nginx/Vercel/Netlify)
```
Arahkan path `/api` ke URL backend (lihat `web/nginx.conf` sebagai contoh).

### Mobile
```bash
cd mobile
npm ci
# set extra.apiBaseUrl di app.json ke URL backend publik
npx expo start            # uji via Expo Go
# build store: npx eas build -p android   (perlu akun Expo/EAS)
```

## 3. Variabel lingkungan penting

| Variabel | Komponen | Keterangan |
|----------|----------|------------|
| `DATABASE_URL` | backend | Koneksi PostgreSQL |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | backend | **Wajib diganti** di produksi |
| `SMTP_*` | backend | Email notifikasi (opsional) |
| `WA_GATEWAY_URL`, `WA_TOKEN` | backend | WhatsApp gateway (opsional) |
| `apiBaseUrl` (app.json `extra`) | mobile | URL API yang dijangkau ponsel |

## 4. Pengujian

```bash
cd backend
npm test                 # unit test (logika laporan & pemicu notifikasi)

# E2E (butuh PostgreSQL):
export DATABASE_URL=postgresql://sipres:sipres@localhost:5432/sipres?schema=public
export JWT_ACCESS_SECRET=dev JWT_REFRESH_SECRET=dev
npx prisma migrate deploy
npm run test:e2e         # alur HTTP nyata: login→CRUD→presensi→notifikasi→laporan
```

CI (GitHub Actions) menjalankan unit + e2e (dengan service Postgres), build web,
dan typecheck mobile pada setiap push.

> **Catatan build di lingkungan terbatas jaringan:** bila registry npm/apk tidak
> dapat diakses saat `docker build`, tersedia varian *offline*
> (`backend/Dockerfile.offline`, `web/Dockerfile.offline`,
> `docker-compose.offline.yml`) yang mengemas artefak hasil build host. Untuk
> lingkungan normal, gunakan `Dockerfile` standar via `docker-compose.yml`.

## 5. Catatan produksi

- Reminder kegiatan H-1 berjalan via cron internal (17:00 WIB). Pastikan
  kontainer backend tetap hidup (`restart: unless-stopped` sudah diset).
- Push notification mobile memakai Expo Push API (gratis) — tidak perlu
  kredensial tambahan untuk Expo Go; untuk build mandiri ikuti dok Expo.
- Ganti semua secret default sebelum go-live. Bila `NODE_ENV=production`,
  backend **menolak boot** tanpa `JWT_ACCESS_SECRET` & `JWT_REFRESH_SECRET`.
- Batasi origin web via `CORS_ORIGIN` (mis. `https://app.kartini.sch.id`).

## 6. Catatan keamanan & trade-off yang diketahui

Sudah ditangani: kontrol akses per-murid (ORTU/MURID hanya data sendiri),
**scope guru** (hanya kelas/jadwal/murid yang diampu), verifikasi user
aktif/role tiap request, sesi presensi idempoten, notifikasi anti-duplikat,
penanganan error DB yang ramah, batas pagination, **rate limiting**
(100/menit, login 10/menit), **audit log** seluruh mutasi, **refresh token
dengan rotasi & revocation** (`POST /auth/logout`), **snapshot kelas** pada
sesi presensi, **pengumuman** admin (`POST /notifications/broadcast`),
deteksi **"kelas belum diabsen"** (`GET /attendance/unmarked`), dan
pembersihan otomatis **push token** yang tak terdaftar lagi.

Telah ditambahkan juga: **pengaturan & template notifikasi** (kanal aktif,
status pemicu, template pesan, jam reminder — `GET/PUT /settings` + halaman web
Pengaturan), **rekap mingguan via email** (cron Minggu, dapat dimatikan),
**retry** pengiriman notifikasi (backoff eksponensial), dan **grafik tren**
per hari (`GET /reports/trend` + chart di web).

Satu-satunya item rencana yang sengaja TIDAK dikerjakan:

- **shadcn/ui** — ini preferensi tooling, bukan fitur. Aplikasi memakai sistem
  komponen Tailwind sendiri yang **fungsional setara** (konsisten, aksesibel,
  responsif). Migrasi penuh ke shadcn/ui berarti menulis ulang seluruh UI tanpa
  nilai fungsional dan berisiko regresi, sehingga ditahan kecuali diminta.

Cara kerja refresh token: setiap login/refresh menyimpan hash (sha256) token
di tabel `refresh_tokens` dengan `jti`. Saat refresh, token lama dicabut
(rotasi) dan token bekas tak bisa dipakai ulang; `logout` mencabut token.

Trade-off yang masih disadari:

- **Token disimpan di `localStorage`** pada web (umum untuk SPA) — rentan bila
  ada XSS. Dampak dikurangi oleh revocation di atas (sesi dapat dicabut), namun
  mitigasi utama tetap menjaga aplikasi bebas XSS. Opsi lanjutan: cookie
  httpOnly + CSRF token (kurang cocok karena API yang sama dipakai mobile).
- **Pembersihan refresh token** kedaluwarsa/dicabut berjalan otomatis via cron
  harian (03:00 WIB) di `SchedulerService`.
