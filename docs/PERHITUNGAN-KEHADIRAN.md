# Perhitungan Persentase Kehadiran — SIPRES Kartini

Dokumen ini mendefinisikan rumus, periode, dan logika perhitungan persentase
kehadiran (umum & individual).

## 1. Status Kehadiran

| Status | Kode | Dihitung "Hadir Efektif"? | Dianggap Alpha? |
|--------|------|:-------------------------:|:---------------:|
| Hadir | HADIR | ✅ Ya | ❌ Tidak |
| Sakit | SAKIT | ❌ Tidak | ❌ **Tidak** (berhalangan sah) |
| Izin | IZIN | ❌ Tidak | ❌ **Tidak** (berhalangan sah) |
| Alpha | ALPHA | ❌ Tidak | ✅ Ya (tanpa keterangan) |

> **Kebijakan sekolah (terkonfirmasi)**: **Sakit & Izin** adalah berhalangan
> **sah** dan **TIDAK dihitung sebagai Alpha**. Hanya **ALPHA** yang merupakan
> ketidakhadiran tanpa keterangan. Karena itu sistem menampilkan dua metrik:
>
> - **% Hadir Efektif** = porsi murid benar-benar hadir (hanya HADIR).
> - **% Kehadiran Sah** = porsi murid yang tidak alpha (HADIR + SAKIT + IZIN).
>
> Metrik **% Alpha** menjadi indikator utama masalah kedisiplinan.

## 2. Rumus Dasar

```
% Hadir Efektif  = (Jumlah HADIR / Total Pertemuan Terjadwal) × 100
% Kehadiran Sah  = ((HADIR + SAKIT + IZIN) / Total Pertemuan) × 100   ← tidak-alpha
```

Di mana **Total Pertemuan Terjadwal** = jumlah sesi presensi (`attendance_sessions`)
yang relevan untuk murid pada periode tertentu.

Metrik pelengkap yang ikut ditampilkan:

```
% Alpha  = (Jumlah ALPHA / Total Pertemuan) × 100   ← indikator utama
% Sakit  = (Jumlah SAKIT / Total Pertemuan) × 100
% Izin   = (Jumlah IZIN  / Total Pertemuan) × 100
```

> Sesuai kebijakan sekolah, **SAKIT & IZIN tidak menambah angka Alpha**. Keduanya
> masuk ke **% Kehadiran Sah** namun tidak ke **% Hadir Efektif**.

## 3. Definisi Periode

| Periode | Definisi | Dipakai untuk |
|---------|----------|---------------|
| **Hari** | 1 tanggal | Laporan umum harian |
| **Minggu** | Senin–Sabtu berjalan | Laporan umum mingguan |
| **Bulan** | 1 bulan kalender | Laporan umum bulanan |
| **Mid (Tengah Semester)** | Awal semester s/d tanggal mid (dari `terms` type=MID) | Laporan umum |
| **Triwulan** | 3 bulan periode akademik (`terms` type=TRIWULAN) | Laporan individual |
| **Semester** | 1 semester (`terms` type=SEMESTER) | Umum & individual |
| **Tahun** | 1 tahun ajaran (academic_year) | Umum & individual |

Periode konkret (tanggal mulai/akhir) diambil dari tabel **`terms`** sehingga
fleksibel dan sesuai kalender akademik sekolah.

## 4. Persentase Umum (General)

Agregat **seluruh murid** dalam periode. Cocok untuk dashboard sekolah/kelas.

```
% Kehadiran Umum =
   (Σ HADIR semua murid pada periode) /
   (Σ seluruh pertemuan semua murid pada periode) × 100
```

Endpoint: `GET /reports/general?period=...&date=...` atau `&termId=...`.

Contoh (per bulan):

```json
{
  "period": "month",
  "range": { "start": "2026-06-01", "end": "2026-06-30" },
  "totalRecords": 5400,
  "hadir": 5010,
  "sakit": 150,
  "izin": 120,
  "alpha": 120,
  "attendancePercentage": 92.78
}
```

## 5. Persentase Individual

Per **satu murid** dalam periode (triwulan/semester/tahun).

```
% Kehadiran Individual (murid X, periode P) =
   (HADIR murid X pada P) / (Total pertemuan murid X pada P) × 100
```

Endpoint: `GET /reports/student/:studentId?period=triwulan|semester|year&termId=...`.

Contoh (semester):

```json
{
  "studentId": "uuid-1",
  "studentName": "Budi",
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

## 6. Logika Query (Ilustrasi SQL)

```sql
-- Persentase individual per term
SELECT
  s.id AS student_id,
  COUNT(*) AS total_sessions,
  COUNT(*) FILTER (WHERE a.status = 'HADIR') AS hadir,
  COUNT(*) FILTER (WHERE a.status = 'SAKIT') AS sakit,
  COUNT(*) FILTER (WHERE a.status = 'IZIN')  AS izin,
  COUNT(*) FILTER (WHERE a.status = 'ALPHA') AS alpha,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE a.status = 'HADIR') / NULLIF(COUNT(*), 0),
    2
  ) AS hadir_efektif_pct,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE a.status IN ('HADIR','SAKIT','IZIN'))
      / NULLIF(COUNT(*), 0),
    2
  ) AS kehadiran_sah_pct,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE a.status = 'ALPHA') / NULLIF(COUNT(*), 0),
    2
  ) AS alpha_pct
FROM attendance a
JOIN attendance_sessions sess ON sess.id = a.session_id
JOIN students s ON s.id = a.student_id
WHERE a.student_id = $1
  AND sess.term_id = $2
GROUP BY s.id;
```

`NULLIF(COUNT(*),0)` mencegah pembagian nol bila belum ada pertemuan.

## 7. Penanganan Kasus Khusus

| Kasus | Penanganan |
|-------|-----------|
| Belum ada pertemuan di periode | Persentase = `null` / "Belum ada data" |
| Murid pindah kelas di tengah periode | Hitung berdasar sesi yang murid ikuti (per `attendance`) |
| Sesi belum diabsen guru | Tidak dihitung sampai presensi disimpan; tampilkan ke guru sebagai "belum diabsen" |
| Kebijakan Sakit/Izin | Konfigurasi: default tidak dihitung hadir; bisa diubah admin |

## 8. Penyajian di UI

- **Kartu ringkas**: % kehadiran besar + breakdown Hadir/Sakit/Izin/Alpha.
- **Grafik tren**: garis per minggu/bulan (umum), bar per triwulan/semester (individual).
- **Warna status**: hijau (hadir tinggi), kuning (sedang), merah (alpha tinggi).
- **Filter periode**: dropdown (hari/minggu/bulan/mid/triwulan/semester/tahun).
