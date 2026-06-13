import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiError } from '../lib/api';
import { useToast } from '../components/Toast';
import { useClasses } from '../lib/hooks';
import { EmptyState, Field, Modal, PageHeader, Spinner } from '../components/ui';
import type { SchoolEvent } from '../lib/types';

interface FormState {
  id?: string;
  title: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  targetClassId: string;
}
const EMPTY: FormState = {
  title: '',
  description: '',
  eventDate: '',
  startTime: '08:00',
  endTime: '10:00',
  location: '',
  targetClassId: '',
};

export default function EventsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const classes = useClasses();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);

  const list = useQuery({
    queryKey: ['events'],
    queryFn: async () => (await api.get<SchoolEvent[]>('/events')).data,
  });

  const save = useMutation({
    mutationFn: (f: FormState) => {
      const body = {
        title: f.title,
        description: f.description || undefined,
        eventDate: f.eventDate,
        startTime: f.startTime,
        endTime: f.endTime,
        location: f.location || undefined,
        targetClassId: f.targetClassId || undefined,
      };
      return f.id ? api.patch(`/events/${f.id}`, body) : api.post('/events', body);
    },
    onSuccess: () => {
      toast.push('success', 'Kegiatan tersimpan');
      qc.invalidateQueries({ queryKey: ['events'] });
      setOpen(false);
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/events/${id}`),
    onSuccess: () => {
      toast.push('success', 'Kegiatan dihapus');
      qc.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  return (
    <div>
      <PageHeader
        title="Kegiatan Sekolah"
        subtitle="Reminder otomatis dikirim H-1 ke orang tua & murid"
        action={
          <button
            className="btn-primary"
            onClick={() => {
              setForm(EMPTY);
              setOpen(true);
            }}
          >
            + Tambah Kegiatan
          </button>
        }
      />
      <div className="card overflow-hidden p-0">
        {list.isLoading ? (
          <Spinner />
        ) : !list.data?.length ? (
          <EmptyState message="Belum ada kegiatan." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Judul</th>
                <th className="px-4 py-3">Jam</th>
                <th className="px-4 py-3">Lokasi</th>
                <th className="px-4 py-3">Sasaran</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.data.map((ev) => (
                <tr key={ev.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{ev.eventDate.slice(0, 10)}</td>
                  <td className="px-4 py-3 font-medium">{ev.title}</td>
                  <td className="px-4 py-3">
                    {ev.startTime}–{ev.endTime}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{ev.location ?? '—'}</td>
                  <td className="px-4 py-3">
                    {ev.targetClass?.name ?? 'Semua kelas'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="mr-2 text-brand-600 hover:underline"
                      onClick={() => {
                        setForm({
                          id: ev.id,
                          title: ev.title,
                          description: ev.description ?? '',
                          eventDate: ev.eventDate.slice(0, 10),
                          startTime: ev.startTime,
                          endTime: ev.endTime,
                          location: ev.location ?? '',
                          targetClassId: ev.targetClassId ?? '',
                        });
                        setOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => {
                        if (confirm(`Hapus ${ev.title}?`)) remove.mutate(ev.id);
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
        title={form.id ? 'Edit Kegiatan' : 'Tambah Kegiatan'}
        onClose={() => setOpen(false)}
      >
        <Field label="Judul">
          <input
            className="input"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </Field>
        <Field label="Deskripsi">
          <textarea
            className="input"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <Field label="Tanggal">
          <input
            type="date"
            className="input"
            value={form.eventDate}
            onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
          />
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
        <Field label="Lokasi">
          <input
            className="input"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </Field>
        <Field label="Kelas Sasaran">
          <select
            className="input"
            value={form.targetClassId}
            onChange={(e) => setForm({ ...form, targetClassId: e.target.value })}
          >
            <option value="">Semua kelas</option>
            {classes.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
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
