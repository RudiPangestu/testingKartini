import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, apiError } from '../lib/api';
import { useToast } from '../components/Toast';
import { EmptyState, Modal, PageHeader, Spinner } from '../components/ui';
import { useClasses } from '../lib/hooks';
import type { AttendanceStatus, DailyRosterItem, Student } from '../lib/types';

const STATUSES: AttendanceStatus[] = ['HADIR', 'SAKIT', 'IZIN', 'ALPHA', 'TELAT'];
const STATUS_BTN: Record<AttendanceStatus, string> = {
  HADIR: 'bg-green-600',
  SAKIT: 'bg-yellow-500',
  IZIN: 'bg-blue-600',
  ALPHA: 'bg-red-600',
  TELAT: 'bg-orange-500',
};

type Scope = 'SEKOLAH' | 'KELAS' | 'MURID';
interface Row {
  status: AttendanceStatus;
  note: string;
}

export default function DailyAttendancePage() {
  const toast = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const classes = useClasses();

  const [scope, setScope] = useState<Scope>('SEKOLAH');
  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [date, setDate] = useState(today);
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [waPreview, setWaPreview] = useState<string | null>(null);

  // Daftar murid untuk scope "per murid" (dipilih dari kelas).
  const studentsOfClass = useQuery({
    queryKey: ['class-students', classId],
    enabled: scope === 'MURID' && !!classId,
    queryFn: async () =>
      (await api.get<Student[]>(`/classes/${classId}/students`)).data,
  });

  const scopeReady =
    scope === 'SEKOLAH' ||
    (scope === 'KELAS' && !!classId) ||
    (scope === 'MURID' && !!studentId);

  const roster = useQuery({
    queryKey: ['daily-roster', date, scope, classId, studentId],
    enabled: scopeReady,
    queryFn: async () => {
      const p = new URLSearchParams({ date });
      if (scope === 'KELAS') p.set('classId', classId);
      if (scope === 'MURID') p.set('studentId', studentId);
      return (
        await api.get<DailyRosterItem[]>(`/daily-attendance/roster?${p}`)
      ).data;
    },
  });

  // Inisialisasi baris dari roster (status tersimpan, default HADIR).
  useEffect(() => {
    if (!roster.data) return;
    const init: Record<string, Row> = {};
    for (const r of roster.data) {
      init[r.studentId] = { status: r.status ?? 'HADIR', note: r.note ?? '' };
    }
    setRows(init);
  }, [roster.data]);

  const save = useMutation({
    mutationFn: () =>
      api.put('/daily-attendance', {
        date,
        records: (roster.data ?? []).map((r) => ({
          studentId: r.studentId,
          status: rows[r.studentId]?.status ?? 'HADIR',
          note: rows[r.studentId]?.note || undefined,
        })),
      }),
    onSuccess: () => {
      toast.push('success', 'Daftar hadir harian tersimpan');
      roster.refetch();
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  const sendWa = useMutation({
    mutationFn: async () => {
      const p = new URLSearchParams({ date });
      if (scope === 'KELAS') p.set('classId', classId);
      return (
        await api.post<{ message: string; sentTo: number; configured: boolean; note?: string }>(
          `/daily-attendance/send-wa?${p}`,
        )
      ).data;
    },
    onSuccess: (d) => {
      setWaPreview(d.message);
      if (d.configured) toast.push('success', `Rekap terkirim ke ${d.sentTo} admin`);
      else toast.push('info', d.note ?? 'Pratinjau rekap (WA belum aktif)');
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  function setAll(status: AttendanceStatus) {
    setRows((prev) => {
      const next = { ...prev };
      for (const r of roster.data ?? [])
        next[r.studentId] = { ...next[r.studentId], status };
      return next;
    });
  }

  const list = roster.data ?? [];

  return (
    <div>
      <PageHeader
        title="Daftar Hadir Harian"
        subtitle="Absensi harian oleh guru piket — pilih cakupan & tanggal, tandai kehadiran"
      />

      <div className="card mb-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div>
            <label className="label">Cakupan</label>
            <select
              className="input"
              value={scope}
              onChange={(e) => {
                setScope(e.target.value as Scope);
                setStudentId('');
              }}
            >
              <option value="SEKOLAH">Se-sekolah</option>
              <option value="KELAS">Per Kelas</option>
              <option value="MURID">Per Murid</option>
            </select>
          </div>

          {(scope === 'KELAS' || scope === 'MURID') && (
            <div>
              <label className="label">Kelas</label>
              <select
                className="input"
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  setStudentId('');
                }}
              >
                <option value="">— Pilih kelas —</option>
                {classes.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {scope === 'MURID' && (
            <div>
              <label className="label">Murid</label>
              <select
                className="input"
                value={studentId}
                disabled={!classId}
                onChange={(e) => setStudentId(e.target.value)}
              >
                <option value="">— Pilih murid —</option>
                {studentsOfClass.data?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="label">Tanggal</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {!scopeReady ? (
        <EmptyState message="Pilih cakupan (dan kelas/murid) untuk memuat daftar." />
      ) : roster.isLoading ? (
        <Spinner />
      ) : (
        <div className="card">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-gray-500">
              {list.length} murid · Tanggal {date}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-gray-500">Tandai semua:</span>
              {STATUSES.map((st) => (
                <button
                  key={st}
                  className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-50"
                  onClick={() => setAll(st)}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {list.length === 0 ? (
            <EmptyState message="Tidak ada murid pada cakupan ini." />
          ) : (
            <div className="overflow-x-auto">
              <table className="table min-w-[560px]">
                <thead className="text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="py-2">Murid</th>
                    <th className="py-2">Kelas</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {list.map((s) => (
                    <tr key={s.studentId}>
                      <td className="py-2">
                        <div className="font-medium">{s.fullName}</div>
                        <div className="text-xs text-gray-400">
                          {s.nisn ?? '—'}
                        </div>
                      </td>
                      <td className="py-2 text-sm text-gray-500">
                        {s.className ?? '—'}
                      </td>
                      <td className="py-2">
                        <div className="flex flex-wrap gap-1">
                          {STATUSES.map((st) => (
                            <button
                              key={st}
                              onClick={() =>
                                setRows((p) => ({
                                  ...p,
                                  [s.studentId]: {
                                    ...p[s.studentId],
                                    status: st,
                                  },
                                }))
                              }
                              className={
                                'rounded px-2 py-1 text-xs font-medium text-white transition ' +
                                (rows[s.studentId]?.status === st
                                  ? STATUS_BTN[st]
                                  : 'bg-gray-200 text-gray-500 hover:bg-gray-300')
                              }
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="py-2">
                        <input
                          className="input py-1"
                          placeholder="opsional"
                          value={rows[s.studentId]?.note ?? ''}
                          onChange={(e) =>
                            setRows((p) => ({
                              ...p,
                              [s.studentId]: {
                                ...p[s.studentId],
                                note: e.target.value,
                              },
                            }))
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {list.length > 0 && (
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                className="btn-ghost"
                disabled={sendWa.isPending}
                onClick={() => sendWa.mutate()}
              >
                {sendWa.isPending ? 'Menyiapkan…' : 'Kirim Rekap ke WA'}
              </button>
              <button
                className="btn-primary"
                disabled={save.isPending}
                onClick={() => save.mutate()}
              >
                {save.isPending ? 'Menyimpan…' : 'Simpan'}
              </button>
            </div>
          )}
        </div>
      )}

      <Modal
        open={waPreview !== null}
        title="Pratinjau Rekap WhatsApp"
        onClose={() => setWaPreview(null)}
      >
        <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-3 text-sm">
          {waPreview}
        </pre>
        <div className="mt-3 flex justify-end">
          <button className="btn-primary" onClick={() => setWaPreview(null)}>
            Tutup
          </button>
        </div>
      </Modal>
    </div>
  );
}
