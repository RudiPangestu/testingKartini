import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiError } from '../lib/api';
import { useToast } from '../components/Toast';
import { EmptyState, Field, Modal, PageHeader, Spinner } from '../components/ui';
import type { Term, TermType } from '../lib/types';

const TYPES: TermType[] = ['SEMESTER', 'TRIWULAN', 'MID'];

interface FormState {
  id?: string;
  academicYear: string;
  type: TermType;
  name: string;
  startDate: string;
  endDate: string;
}
const EMPTY: FormState = {
  academicYear: '2025/2026',
  type: 'SEMESTER',
  name: '',
  startDate: '',
  endDate: '',
};

export default function TermsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);

  const list = useQuery({
    queryKey: ['terms'],
    queryFn: async () => (await api.get<Term[]>('/terms')).data,
  });

  const save = useMutation({
    mutationFn: (f: FormState) => {
      const body = {
        academicYear: f.academicYear,
        type: f.type,
        name: f.name,
        startDate: f.startDate,
        endDate: f.endDate,
      };
      return f.id ? api.patch(`/terms/${f.id}`, body) : api.post('/terms', body);
    },
    onSuccess: () => {
      toast.push('success', 'Periode tersimpan');
      qc.invalidateQueries({ queryKey: ['terms'] });
      setOpen(false);
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/terms/${id}`),
    onSuccess: () => {
      toast.push('success', 'Periode dihapus');
      qc.invalidateQueries({ queryKey: ['terms'] });
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  return (
    <div>
      <PageHeader
        title="Periode Akademik"
        subtitle="Dasar perhitungan laporan semester / triwulan / mid"
        action={
          <button
            className="btn-primary"
            onClick={() => {
              setForm(EMPTY);
              setOpen(true);
            }}
          >
            + Tambah Periode
          </button>
        }
      />
      <div className="card overflow-hidden p-0">
        {list.isLoading ? (
          <Spinner />
        ) : !list.data?.length ? (
          <EmptyState message="Belum ada periode." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Tipe</th>
                <th className="px-4 py-3">Tahun Ajaran</th>
                <th className="px-4 py-3">Rentang</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.data.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3">{t.type}</td>
                  <td className="px-4 py-3 text-gray-500">{t.academicYear}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {t.startDate.slice(0, 10)} → {t.endDate.slice(0, 10)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="mr-2 text-brand-600 hover:underline"
                      onClick={() => {
                        setForm({
                          id: t.id,
                          academicYear: t.academicYear,
                          type: t.type,
                          name: t.name,
                          startDate: t.startDate.slice(0, 10),
                          endDate: t.endDate.slice(0, 10),
                        });
                        setOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => {
                        if (confirm(`Hapus ${t.name}?`)) remove.mutate(t.id);
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
        title={form.id ? 'Edit Periode' : 'Tambah Periode'}
        onClose={() => setOpen(false)}
      >
        <Field label="Nama">
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Semester Genap"
          />
        </Field>
        <Field label="Tipe">
          <select
            className="input"
            value={form.type}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value as TermType })
            }
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tahun Ajaran">
          <input
            className="input"
            value={form.academicYear}
            onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Mulai">
            <input
              type="date"
              className="input"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </Field>
          <Field label="Selesai">
            <input
              type="date"
              className="input"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </Field>
        </div>
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
