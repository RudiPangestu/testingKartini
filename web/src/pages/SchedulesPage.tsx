import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiError } from '../lib/api';
import { useToast } from '../components/Toast';
import { useClasses, useSubjects, useTeachers } from '../lib/hooks';
import { EmptyState, Field, Modal, PageHeader, Spinner } from '../components/ui';
import type { DayOfWeek, Schedule } from '../lib/types';

const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: 'SEN', label: 'Senin' },
  { value: 'SEL', label: 'Selasa' },
  { value: 'RAB', label: 'Rabu' },
  { value: 'KAM', label: 'Kamis' },
  { value: 'JUM', label: 'Jumat' },
  { value: 'SAB', label: 'Sabtu' },
];

interface FormState {
  id?: string;
  subjectId: string;
  classId: string;
  teacherId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  academicYear: string;
}
const EMPTY: FormState = {
  subjectId: '',
  classId: '',
  teacherId: '',
  dayOfWeek: 'SEN',
  startTime: '07:00',
  endTime: '08:30',
  academicYear: '2025/2026',
};

export default function SchedulesPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const subjects = useSubjects();
  const classes = useClasses();
  const teachers = useTeachers();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);

  const list = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => (await api.get<Schedule[]>('/schedules')).data,
  });

  const save = useMutation({
    mutationFn: (f: FormState) => {
      const body = {
        subjectId: f.subjectId,
        classId: f.classId,
        teacherId: f.teacherId,
        dayOfWeek: f.dayOfWeek,
        startTime: f.startTime,
        endTime: f.endTime,
        academicYear: f.academicYear,
      };
      return f.id
        ? api.patch(`/schedules/${f.id}`, body)
        : api.post('/schedules', body);
    },
    onSuccess: () => {
      toast.push('success', 'Jadwal tersimpan');
      qc.invalidateQueries({ queryKey: ['schedules'] });
      setOpen(false);
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/schedules/${id}`),
    onSuccess: () => {
      toast.push('success', 'Jadwal dihapus');
      qc.invalidateQueries({ queryKey: ['schedules'] });
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  const dayLabel = (d: DayOfWeek) => DAYS.find((x) => x.value === d)?.label ?? d;

  return (
    <div>
      <PageHeader
        title="Jadwal Pelajaran"
        action={
          <button
            className="btn-primary"
            onClick={() => {
              setForm(EMPTY);
              setOpen(true);
            }}
          >
            + Tambah Jadwal
          </button>
        }
      />
      <div className="card overflow-x-auto p-0">
        {list.isLoading ? (
          <Spinner />
        ) : !list.data?.length ? (
          <EmptyState message="Belum ada jadwal." />
        ) : (
          <table className="table">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Hari</th>
                <th className="px-4 py-3">Jam</th>
                <th className="px-4 py-3">Mapel</th>
                <th className="px-4 py-3">Kelas</th>
                <th className="px-4 py-3">Guru</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.data.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{dayLabel(s.dayOfWeek)}</td>
                  <td className="px-4 py-3">
                    {s.startTime}–{s.endTime}
                  </td>
                  <td className="px-4 py-3 font-medium">{s.subject?.name}</td>
                  <td className="px-4 py-3">{s.class?.name}</td>
                  <td className="px-4 py-3 text-gray-500">{s.teacher?.fullName}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="action-btn action-edit"
                      onClick={() => {
                        setForm({
                          id: s.id,
                          subjectId: s.subjectId,
                          classId: s.classId,
                          teacherId: s.teacherId,
                          dayOfWeek: s.dayOfWeek,
                          startTime: s.startTime,
                          endTime: s.endTime,
                          academicYear: s.academicYear,
                        });
                        setOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="action-btn action-danger"
                      onClick={() => {
                        if (confirm('Hapus jadwal ini?')) remove.mutate(s.id);
                      }}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={open}
        title={form.id ? 'Edit Jadwal' : 'Tambah Jadwal'}
        onClose={() => setOpen(false)}
      >
        <Field label="Mata Pelajaran">
          <select
            className="input"
            value={form.subjectId}
            onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
          >
            <option value="">— Pilih —</option>
            {subjects.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Kelas">
          <select
            className="input"
            value={form.classId}
            onChange={(e) => setForm({ ...form, classId: e.target.value })}
          >
            <option value="">— Pilih —</option>
            {classes.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Guru">
          <select
            className="input"
            value={form.teacherId}
            onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
          >
            <option value="">— Pilih —</option>
            {teachers.data?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Hari">
          <select
            className="input"
            value={form.dayOfWeek}
            onChange={(e) =>
              setForm({ ...form, dayOfWeek: e.target.value as DayOfWeek })
            }
          >
            {DAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Jam Mulai">
            <input
              type="time"
              className="input"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
          </Field>
          <Field label="Jam Selesai">
            <input
              type="time"
              className="input"
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Tahun Ajaran">
          <input
            className="input"
            value={form.academicYear}
            onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
          />
        </Field>
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setOpen(false)}>
            Batal
          </button>
          <button
            className="btn-primary"
            disabled={save.isPending}
            onClick={() => save.mutate(form)}
          >
            Simpan
          </button>
        </div>
      </Modal>
    </div>
  );
}
