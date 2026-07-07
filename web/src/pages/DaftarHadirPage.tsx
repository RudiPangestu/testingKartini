import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';
import { useClasses } from '../lib/hooks';
import { EmptyState, Field, PageHeader, Spinner } from '../components/ui';
import {
  STATUS_CHAR,
  buildMatrix,
  subjectNames,
} from '../lib/daftarHadir';
import type { AttendanceSession, Student } from '../lib/types';

function firstDayOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function DaftarHadirPage() {
  const toast = useToast();
  const classes = useClasses();

  const [classId, setClassId] = useState('');
  const [from, setFrom] = useState(firstDayOfMonth());
  const [to, setTo] = useState(today());
  const [subject, setSubject] = useState('');

  const sessions = useQuery({
    queryKey: ['dh-sessions', classId],
    enabled: !!classId,
    queryFn: async () =>
      (await api.get<AttendanceSession[]>('/attendance/sessions', {
        params: { classId },
      })).data,
  });

  const students = useQuery({
    queryKey: ['dh-students', classId],
    enabled: !!classId,
    queryFn: async () =>
      (await api.get<Student[]>(`/classes/${classId}/students`)).data,
  });

  const subjects = useMemo(
    () => subjectNames(sessions.data ?? []),
    [sessions.data],
  );

  const matrix = useMemo(() => {
    if (!sessions.data || !students.data)
      return { sessions: [], rows: [] };
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

  function openCetak() {
    if (!classId) {
      toast.push('error', 'Pilih kelas dulu');
      return;
    }
    const q = new URLSearchParams({ classId, from, to });
    if (subject) q.set('subject', subject);
    window.open(`/daftar-hadir/cetak?${q.toString()}`, '_blank');
  }

  const loading = sessions.isLoading || students.isLoading;

  return (
    <div>
      <PageHeader
        title="Daftar Hadir Tatap Muka"
        subtitle="Rekap matriks kehadiran siswa per pertemuan, meniru buku absensi."
        action={
          <button className="btn-primary" onClick={openCetak} disabled={!classId}>
            Cetak / PDF
          </button>
        }
      />

      <div className="card mb-5 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Field label="Kelas">
          <select
            className="input"
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setSubject('');
            }}
          >
            <option value="">— Pilih kelas —</option>
            {classes.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.academicYear})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Dari Tanggal">
          <input
            type="date"
            className="input"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </Field>
        <Field label="Sampai Tanggal">
          <input
            type="date"
            className="input"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </Field>
        <Field label="Mata Pelajaran (opsional)">
          <select
            className="input"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option value="">— Semua mapel —</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="card overflow-x-auto p-0">
        {!classId ? (
          <EmptyState message="Pilih kelas untuk melihat matriks kehadiran." />
        ) : loading ? (
          <Spinner />
        ) : matrix.sessions.length === 0 ? (
          <EmptyState message="Belum ada sesi tatap muka pada rentang ini." />
        ) : (
          <>
            <table className="table whitespace-nowrap text-sm">
              <thead>
                <tr>
                  <th className="bg-gray-50">No</th>
                  <th className="sticky left-0 z-10 bg-gray-50">Nama</th>
                  {matrix.sessions.map((s, i) => (
                    <th key={s.id} title={`${s.date} — ${s.subject}`}>
                      {i + 1}
                    </th>
                  ))}
                  <th className="bg-green-50">H</th>
                  <th className="bg-yellow-50">S</th>
                  <th className="bg-blue-50">I</th>
                  <th className="bg-red-50">A</th>
                </tr>
              </thead>
              <tbody>
                {matrix.rows.map((r, idx) => (
                  <tr key={r.studentId}>
                    <td>{idx + 1}</td>
                    <td className="sticky left-0 z-10 bg-white font-medium">
                      {r.fullName}
                    </td>
                    {matrix.sessions.map((s) => {
                      const st = r.cells[s.id];
                      return (
                        <td key={s.id} className="text-center">
                          {st ? STATUS_CHAR[st] : ''}
                        </td>
                      );
                    })}
                    <td className="text-center font-semibold">{r.hadir}</td>
                    <td className="text-center">{r.sakit}</td>
                    <td className="text-center">{r.izin}</td>
                    <td className="text-center">{r.alpha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-3 text-xs text-gray-500">
              Keterangan: <b>•</b> Hadir · <b>S</b> Sakit · <b>I</b> Izin ·{' '}
              <b>A</b> Alpha. Kolom bernomor = pertemuan ke-, urut tanggal.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
