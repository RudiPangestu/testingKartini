# SIPRES Kartini — Web Admin & Guru

Panel web untuk **Admin** dan **Guru**: kelola master data, input presensi, dan
lihat laporan persentase kehadiran. Dibangun dengan **React + Vite + TypeScript**,
**Tailwind CSS**, **React Query**, **React Router**, dan **Zustand**.

## Fitur

| Halaman | Akses | Keterangan |
|---------|-------|------------|
| Login | publik | Hanya Admin & Guru (Ortu/Murid pakai aplikasi mobile) |
| Dashboard | Admin/Guru | Ringkasan kehadiran bulan ini + jumlah kelas/murid |
| Presensi | Admin/Guru | Pilih jadwal+tanggal → buka sesi → tandai Hadir/Sakit/Izin/Alpha → simpan (memicu notifikasi ortu) |
| Laporan | Admin/Guru | Persentase Umum, Per Kelas, dan Individual |
| Murid | Admin/Guru | CRUD murid (admin) + tautkan akun orang tua |
| Kelas | Admin/Guru | CRUD kelas + lihat murid per kelas |
| Mata Pelajaran, Jadwal, Kegiatan, Periode, Pengguna | Admin | CRUD master data |

Routing diproteksi per-role (route guard). Token disimpan di `localStorage`
dengan **auto-refresh** saat access token kedaluwarsa (interceptor axios).

## Menjalankan (development)

```bash
cd web
npm install
# Backend diasumsikan jalan di http://localhost:3000
# (ubah target lewat env VITE_API_TARGET bila perlu)
VITE_API_TARGET=http://localhost:3000 npm run dev
```

Buka http://localhost:5173. Request `/api/*` otomatis di-proxy ke backend
(lihat `vite.config.ts`), jadi tidak perlu mengatur CORS saat dev.

Login awal (dari seed backend): `admin@kartini.sch.id` / `admin12345`.

## Build produksi

```bash
npm run build      # hasil di web/dist
npm run preview    # pratinjau hasil build
```

Saat deploy, arahkan `/api` ke URL backend (mis. via reverse proxy / Nginx),
atau sesuaikan `baseURL` di `src/lib/api.ts`.

## Struktur

```
web/src/
├── lib/         # api client (axios+refresh), auth store (zustand), tipe, hooks lookup
├── components/  # Layout/sidebar, Modal, Toast, elemen UI
├── pages/       # Halaman per modul
└── App.tsx      # Routing + proteksi role
```
