import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, apiError } from '../lib/api';
import { useToast } from '../components/Toast';
import { EmptyState, PageHeader, Spinner } from '../components/ui';
import type {
  AttendanceSession,
  AttendanceStatus,
  Schedule,
  Student,
} from '../lib/types';

const STATUSES: AttendanceStatus[] = ['HADIR', 'SAKIT', 'IZIN', 'ALPHA'];
const STATUS_BTN: Record<AttendanceStatus, string> = {
  HADIR: 'bg-green-600',
  SAKIT: 'bg-yellow-500',
  IZIN: 'bg-blue-600',
  ALPHA: 'bg-red-600',
};

interface Row {
  status: AttendanceStatus;
  note: string;
}

export default function AttendancePage() {
  const toast = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const [scheduleId, setScheduleId] = useState('');
  const [date, setDate] = useState(today);
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [rows, setRows] = useState<Record<string, Row>>({});

  const schedules = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => (await api.get<Schedule[]>('/schedules')).data,
  });

  const selectedSchedule = schedules.data?.find((s) => s.id === scheduleId);

  // Buka sesi + muat daftar murid kelas terkait
  const openSession = useMutation({
    mutationFn: async () => {
      const ses = (
        await api.post<AttendanceSession>('/attendance/sessions', {
          sourceType: 'SCHEDULE',
          scheduleId,
          sessionDate: date,
        })
      ).data;
      const classId = ses.schedule?.class.id;
      const students = classId
        ? (await api.get<Student[]>(`/classes/${classId}/students`)).data
        : [];
      return { ses, students };
    },
    onSuccess: ({ ses, students }) => {
      const initial: Record<string, Row> = {};
      for (const s of students) {
        const existing = ses.records?.find((r) => r.studentId === s.id);
        initial[s.id] = {
          status: existing?.status ?? 'HADIR',
          note: existing?.note ?? '',
        };
      }
      setSession({ ...ses, records: ses.records ?? [] });
      setRoster(students);
      setRows(initial);
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  const [roster, setRoster] = useState<Student[]>([]);

  const save = useMutation({
    mutationFn: () =>
      api.put(`/attendance/sessions/${session!.id}`, {
        records: roster.map((s) => ({
          studentId: s.id,
          status: rows[s.id].status,
          note: rows[s.id].note || undefined,
        })),
      }),
    onSuccess: () => {
      toast.push(
        'success',
        'Presensi tersimpan. Notifikasi terkirim ke orang tua untuk Sakit/Izin/Alpha.',
      );
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  function setAll(status: AttendanceStatus) {
    setRows((prev) => {
      const next = { ...prev };
      for (const s of roster) next[s.id] = { ...next[s.id], status };
      return next;
    });
  }

  return (
    <div>
      <PageHeader
        title="Input Presensi"
        subtitle="Pilih jadwal & tanggal, lalu tandai kehadiran murid"
      />

      <div className="card mb-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="label">Jadwal (Mapel · Kelas)</label>
            <select
              className="input"
              value={scheduleId}
              onChange={(e) => {
                setScheduleId(e.target.value);
                setSession(null);
              }}
            >
              <option value="">— Pilih jadwal —</option>
              {schedules.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.subject?.name} · {s.class?.name} ({s.startTime}–{s.endTime})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Tanggal</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSession(null);
              }}
            />
          </div>
          <div className="flex items-end">
            <button
              className="btn-primary w-full"
              disabled={!scheduleId || openSession.isPending}
              onClick={() => openSession.mutate()}
            >
              {openSession.isPending ? 'Membuka…' : 'Buka Sesi Presensi'}
            </button>
          </div>
        </div>
      </div>

      {openSession.isPending && <Spinner />}

      {session && (
        <div className="card">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-semibold">
                {selectedSchedule?.subject?.name} — {selectedSchedule?.class?.name}
              </div>
              <div className="text-sm text-gray-500">Tanggal {date}</div>
            </div>
            <div className="flex gap-2 text-xs">
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

          {roster.length === 0 ? (
            <EmptyState message="Kelas ini belum punya murid." />
          ) : (
            <table className="table">
              <thead className="text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="py-2">Murid</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {roster.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2">
                      <div className="font-medium">{s.fullName}</div>
                      <div className="text-xs text-gray-400">{s.nisn}</div>
                    </td>
                    <td className="py-2">
                      <div className="flex gap-1">
                        {STATUSES.map((st) => (
                          <button
                            key={st}
                            onClick={() =>
                              setRows((p) => ({
                                ...p,
                                [s.id]: { ...p[s.id], status: st },
                              }))
                            }
                            className={
                              'rounded px-2 py-1 text-xs font-medium text-white transition ' +
                              (rows[s.id]?.status === st
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
                        value={rows[s.id]?.note ?? ''}
                        onChange={(e) =>
                          setRows((p) => ({
                            ...p,
                            [s.id]: { ...p[s.id], note: e.target.value },
                          }))
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {roster.length > 0 && (
            <div className="mt-5 flex justify-end">
              <button
                className="btn-primary"
                disabled={save.isPending}
                onClick={() => save.mutate()}
              >
                {save.isPending ? 'Menyimpan…' : 'Simpan Presensi'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
