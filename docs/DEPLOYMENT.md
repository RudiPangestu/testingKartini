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

## 4. Catatan produksi

- Reminder kegiatan H-1 berjalan via cron internal (17:00 WIB). Pastikan
  kontainer backend tetap hidup (`restart: unless-stopped` sudah diset).
- Push notification mobile memakai Expo Push API (gratis) — tidak perlu
  kredensial tambahan untuk Expo Go; untuk build mandiri ikuti dok Expo.
- Ganti semua secret default sebelum go-live.
