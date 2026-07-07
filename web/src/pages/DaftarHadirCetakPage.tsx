import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useClasses } from '../lib/hooks';
import { STATUS_CHAR, buildMatrix } from '../lib/daftarHadir';
import type { AttendanceSession, Student } from '../lib/types';

const SEKOLAH = {
  nama: 'SMA KARTINI BATAM',
  alamat: 'Jl. Budi Kemuliaan No. 1 Kampung Seraya - Batam',
};

export default function DaftarHadirCetakPage() {
  const [params] = useSearchParams();
  const classId = params.get('classId') ?? '';
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const subject = params.get('subject') ?? '';

  const classes = useClasses();
  const kelas = classes.data?.find((c) => c.id === classId);

  const sessions = useQuery({
    queryKey: ['dh-cetak-sessions', classId],
    enabled: !!classId,
    queryFn: async () =>
      (await api.get<AttendanceSession[]>('/attendance/sessions', {
        params: { classId },
      })).data,
  });
  const students = useQuery({
    queryKey: ['dh-cetak-students', classId],
    enabled: !!classId,
    queryFn: async () =>
      (await api.get<Student[]>(`/classes/${classId}/students`)).data,
  });

  const matrix = useMemo(() => {
    if (!sessions.data || !students.data) return { sessions: [], rows: [] };
    return buildMatrix(
      sessions.data,
      students.data.map((s) => ({
        id: s.id,
        nis: s.nis,
        nisn: s.nisn,
        fullName: s.fullName,
      })),
      { from, to, subject: subject || undefined },
    );
  }, [sessions.data, students.data, from, to, subject]);

  const loading = sessions.isLoading || students.isLoading;
  const waliKelas = kelas?.homeroomTeacher?.fullName ?? '…………………';

  return (
    <div className="cetak-root">
      <style>{`
        @page { size: A4 landscape; margin: 10mm; }
        .cetak-root { font-family: 'Times New Roman', Georgia, serif; color: #000; background: #f3f4f6; }
        .toolbar { padding: 12px; text-align: center; }
        .page { background: #fff; width: 277mm; min-height: 190mm; margin: 12px auto; padding: 10mm;
          box-sizing: border-box; box-shadow: 0 2px 10px rgba(0,0,0,.12); }
        .tbl { width: 100%; border-collapse: collapse; font-size: 10px; }
        .tbl th, .tbl td { border: 1px solid #000; padding: 2px 3px; text-align: center; }
        .tbl td.nm { text-align: left; white-space: nowrap; }
        .head { display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px; }
        .ttd { display:flex; justify-content:space-between; margin-top:24px; font-size:12px; }
        .ttd > div { text-align:center; width:45%; }
        .sign-space { height:60px; }
        @media print {
          .cetak-root { background:#fff; }
          .toolbar { display:none; }
          .page { margin:0; box-shadow:none; width:auto; min-height:auto; padding:0; }
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
      ) : loading ? (
        <div className="page">Memuat…</div>
      ) : (
        <div className="page">
          <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 16 }}>
            DAFTAR HADIR TATAP MUKA (ABSENSI)
          </div>
          <div style={{ textAlign: 'center', fontSize: 12, marginBottom: 10 }}>
            {SEKOLAH.nama} — {SEKOLAH.alamat}
          </div>
          <div className="head">
            <span>Kelas : {kelas?.name ?? '—'}</span>
            <span>Mata Pelajaran : {subject || 'Semua'}</span>
            <span>Periode : {from} s/d {to}</span>
            <span>Tahun Pelajaran : {kelas?.academicYear ?? '—'}</span>
          </div>

          {matrix.sessions.length === 0 ? (
            <div>Belum ada sesi tatap muka pada rentang ini.</div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th rowSpan={2}>No</th>
                  <th rowSpan={2}>NIS</th>
                  <th rowSpan={2}>Nama Siswa</th>
                  <th colSpan={matrix.sessions.length}>
                    Kehadiran pada Kegiatan Tatap Muka
                  </th>
                  <th colSpan={4}>Jumlah</th>
                </tr>
                <tr>
                  {matrix.sessions.map((s, i) => (
                    <th key={s.id} title={`${s.date} — ${s.subject}`}>
                      {i + 1}
                    </th>
                  ))}
                  <th>H</th>
                  <th>S</th>
                  <th>I</th>
                  <th>A</th>
                </tr>
              </thead>
              <tbody>
                {matrix.rows.map((r, idx) => (
                  <tr key={r.studentId}>
                    <td>{idx + 1}</td>
                    <td>{r.nis ?? r.nisn}</td>
                    <td className="nm">{r.fullName}</td>
                    {matrix.sessions.map((s) => (
                      <td key={s.id}>
                        {r.cells[s.id] ? STATUS_CHAR[r.cells[s.id]!] : ''}
                      </td>
                    ))}
                    <td>{r.hadir}</td>
                    <td>{r.sakit}</td>
                    <td>{r.izin}</td>
                    <td>{r.alpha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={{ marginTop: 8, fontSize: 11 }}>
            Keterangan: • = Hadir, S = Sakit, I = Izin, A = Alpha
          </div>

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
      )}
    </div>
  );
}
