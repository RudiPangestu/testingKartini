# SIPRES Kartini — Mobile (Orang Tua / Murid / Guru)

Aplikasi mobile **React Native (Expo)** untuk:

- **Orang Tua / Murid** — melihat kehadiran ananda, persentase (triwulan/
  semester/tahun), kegiatan sekolah, dan menerima **push notification**
  (laporan kehadiran + reminder kegiatan H-1).
- **Guru** — input presensi langsung dari ponsel.

## Stack

Expo SDK 51 · React Native 0.74 · TypeScript · React Navigation (tabs) ·
React Query · Zustand · Axios · `expo-notifications` (Expo Push).

## Struktur

```
mobile/
├── App.tsx                 # Bootstrap: hydrate auth, daftarkan push token
├── app.json                # Konfigurasi Expo (extra.apiBaseUrl)
└── src/
    ├── lib/                # api (axios+refresh), auth (AsyncStorage), notifications, types, theme
    ├── components/         # UI reusable + ChildPicker
    ├── screens/            # Login, Home, Reports, Events, Notifications, Profile, GuruAttendance
    └── navigation/         # Tab navigator role-aware
```

Navigasi otomatis menyesuaikan peran:
- **ORTU/MURID** → Beranda · Laporan · Kegiatan · Notifikasi · Profil
- **GURU** → Presensi · Kegiatan · Notifikasi · Profil

## Menjalankan

```bash
cd mobile
npm install
npm start         # buka di Expo Go (scan QR) atau emulator
```

### Mengarahkan ke backend

Default `extra.apiBaseUrl` di `app.json` = `http://localhost:3000/api/v1`.
Saat menguji di **perangkat fisik**, ganti `localhost` dengan **IP LAN**
komputer (mis. `http://192.168.1.10:3000/api/v1`) agar ponsel bisa
menjangkau API.

### Push notification

`registerForPushNotifications()` meminta izin, mengambil **Expo Push Token**,
lalu mendaftarkannya ke backend via `POST /auth/push-token`. Backend mengirim
notifikasi melalui Expo Push API. Push hanya aktif di perangkat fisik
(otomatis dilewati di emulator).

## Cek kualitas

```bash
npm run typecheck                 # TypeScript (lolos)
npx expo export --platform android  # validasi bundling JS
```
