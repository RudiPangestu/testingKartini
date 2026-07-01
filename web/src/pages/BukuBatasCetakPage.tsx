import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useClasses } from '../lib/hooks';
import type { LessonLog } from '../lib/types';

// Identitas sekolah sesuai sampul buku asli.
const SEKOLAH = {
  nama: 'SMA KARTINI BATAM',
  alamat: 'Jl. Budi Kemuliaan No. 1 Kampung Seraya - Batam',
  telp: 'Telp. (0778) 453731',
  email: 'Email: smakartini_batam@yahoo.com',
  web: 'Website: www.smakartinibatam.sch.id',
};

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const ROMAWI = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];

const COLS = [
  'No',
  'Nama Siswa',
  'Hari/Tgl',
  'Jam Ke',
  'Mata Pelajaran',
  'Pokok Bahasan',
  'Metode',
  'Selesai/Belum',
  'Siswa Tidak Hadir',
  'Refleksi',
  'Tindak Lanjut',
  'Paraf Guru',
];

function weekOfMonth(dateStr: string) {
  const d = new Date(dateStr).getUTCDate();
  return Math.ceil(d / 7);
}

export default function BukuBatasCetakPage() {
  const [params] = useSearchParams();
  const classId = params.get('classId') ?? '';
  const year = Number(params.get('year')) || new Date().getFullYear();
  const month = Number(params.get('month')) || new Date().getMonth() + 1;
  const weekFilter = params.get('week') ? Number(params.get('week')) : null;

  const classes = useClasses();
  const kelas = classes.data?.find((c) => c.id === classId);

  const logs = useQuery({
    queryKey: ['lesson-logs-cetak', classId, year, month],
    enabled: !!classId,
    queryFn: async () =>
      (
        await api.get<LessonLog[]>('/lesson-logs', {
          params: { classId, year, month },
        })
      ).data,
  });

  // Kelompokkan entri per minggu (I–V).
  const byWeek = useMemo(() => {
    const map = new Map<number, LessonLog[]>();
    for (const l of logs.data ?? []) {
      const w = weekOfMonth(l.date);
      if (weekFilter && w !== weekFilter) continue;
      if (!map.has(w)) map.set(w, []);
      map.get(w)!.push(l);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [logs.data, weekFilter]);

  const academicYear = kelas?.academicYear ?? logs.data?.[0]?.academicYear ?? '….../…..';
  const waliKelas = kelas?.homeroomTeacher?.fullName ?? '…………………';

  function hari(dateStr: string) {
    return HARI[new Date(dateStr).getDay()];
  }

  // Tambah baris kosong agar tampilan mirip buku (minimal 10 baris per halaman).
  function padRows(rows: LessonLog[]) {
    const min = 10;
    return rows.length >= min ? rows : [...rows, ...Array(min - rows.length).fill(null)];
  }

  return (
    <div className="cetak-root">
      <style>{`
        @page { size: A4 landscape; margin: 10mm; }
        .cetak-root { font-family: 'Times New Roman', Georgia, serif; color: #000; background: #f3f4f6; }
        .toolbar { padding: 12px; text-align: center; }
        .page { background: #fff; width: 277mm; min-height: 190mm; margin: 12px auto; padding: 10mm;
          box-sizing: border-box; box-shadow: 0 2px 10px rgba(0,0,0,.12); }
        .cover { display: flex; flex-direction: column; }
        .cover-box { border: 3px double #000; padding: 30px; flex: 1; display: flex;
          flex-direction: column; align-items: center; justify-content: center; text-align: center; }
        .tbl { width: 100%; border-collapse: collapse; font-size: 11px; }
        .tbl th, .tbl td { border: 1px solid #000; padding: 3px 5px; vertical-align: top; }
        .tbl th { text-align: center; font-weight: bold; }
        .ttd { display: flex; justify-content: space-between; margin-top: 24px; font-size: 12px; }
        .ttd > div { text-align: center; width: 45%; }
        .sign-space { height: 60px; }
        @media print {
          .cetak-root { background: #fff; }
          .toolbar { display: none; }
          .page { margin: 0; box-shadow: none; width: auto; min-height: auto; padding: 0;
            page-break-after: always; }
          .page:last-child { page-break-after: auto; }
        }
      `}</style>

      <div className="toolbar">
        <button
          onClick={() => window.print()}
          style={{
            background: '#0d6e4e', color: '#fff', border: 0, padding: '10px 20px',
            borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Cetak / Simpan sebagai PDF
        </button>
      </div>

      {!classId ? (
        <div className="page">Parameter kelas tidak ada.</div>
      ) : logs.isLoading ? (
        <div className="page">Memuat…</div>
      ) : (
        <>
          {/* ---------- SAMPUL ---------- */}
          <div className="page cover">
            <div className="cover-box">
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 1 }}>
                {SEKOLAH.nama}
              </div>
              <div style={{ marginTop: 40, fontSize: 22, fontWeight: 700 }}>
                BUKU BATAS PEMBELAJARAN
              </div>
              <div style={{ marginTop: 16, fontSize: 16, fontWeight: 600 }}>
                TAHUN PEMBELAJARAN {academicYear}
              </div>
              <div style={{ marginTop: 70, fontSize: 16, textAlign: 'left' }}>
                <div>KELAS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: {kelas?.name ?? '…………………'}</div>
                <div style={{ marginTop: 8 }}>WALI KELAS : {waliKelas}</div>
              </div>
              <div style={{ marginTop: 'auto', paddingTop: 50, fontSize: 11, lineHeight: 1.5 }}>
                <div>{SEKOLAH.alamat}</div>
                <div>{SEKOLAH.telp} &nbsp; {SEKOLAH.email}</div>
                <div>{SEKOLAH.web}</div>
              </div>
            </div>
          </div>

          {/* ---------- HALAMAN PER MINGGU ---------- */}
          {byWeek.length === 0 ? (
            <div className="page">
              Belum ada entri untuk {BULAN[month - 1]} {year}.
            </div>
          ) : (
            byWeek.map(([week, rows]) => (
              <div className="page" key={week}>
                <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 800, marginBottom: 6 }}>
                  BATAS PELAJARAN
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
                  <span>Bulan : {BULAN[month - 1]} {year}</span>
                  <span>Minggu ke : {ROMAWI[week] ?? week}</span>
                  <span>Kelas : {kelas?.name ?? '—'}</span>
                </div>

                <table className="tbl">
                  <thead>
                    <tr>
                      {COLS.map((c) => (
                        <th key={c}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {padRows(rows).map((l, i) => (
                      <tr key={l?.id ?? `empty-${i}`}>
                        <td style={{ textAlign: 'center' }}>{i + 1}</td>
                        <td>{l?.namaSiswa ?? ''}</td>
                        <td>{l ? `${hari(l.date)}, ${l.date.slice(0, 10)}` : ''}</td>
                        <td style={{ textAlign: 'center' }}>{l?.jamKe ?? ''}</td>
                        <td>{l?.subject?.name ?? ''}</td>
                        <td>{l?.pokokBahasan ?? ''}</td>
                        <td>{l?.metode ?? ''}</td>
                        <td style={{ textAlign: 'center' }}>
                          {l ? (l.selesai ? 'Selesai' : 'Belum') : ''}
                        </td>
                        <td>{l?.siswaTidakHadir ?? ''}</td>
                        <td>{l?.refleksi ?? ''}</td>
                        <td>{l?.tindakLanjut ?? ''}</td>
                        <td>{l?.teacher?.fullName ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="ttd">
                  <div>
                    <div>Mengetahui,</div>
                    <div>Kepala Sekolah</div>
                    <div className="sign-space" />
                    <div>(………………………………)</div>
                  </div>
                  <div>
                    <div>Batam, ……………………………</div>
                    <div>Wali Kelas / Guru</div>
                    <div className="sign-space" />
                    <div>({waliKelas})</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
