import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiError } from '../lib/api';
import { useToast } from '../components/Toast';
import { EmptyState, Field, Modal, PageHeader, Spinner } from '../components/ui';
import { useAuth } from '../lib/auth';
import ImportModal from '../components/ImportModal';
import type { Subject } from '../lib/types';

interface FormState {
  id?: string;
  name: string;
  code: string;
}
const EMPTY: FormState = { name: '', code: '' };

export default function SubjectsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const isAdmin = useAuth((s) => s.user?.role === 'ADMIN');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [importOpen, setImportOpen] = useState(false);

  const list = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => (await api.get<Subject[]>('/subjects')).data,
  });

  const save = useMutation({
    mutationFn: (f: FormState) => {
      const body = { name: f.name, code: f.code || undefined };
      return f.id
        ? api.patch(`/subjects/${f.id}`, body)
        : api.post('/subjects', body);
    },
    onSuccess: () => {
      toast.push('success', 'Mata pelajaran tersimpan');
      qc.invalidateQueries({ queryKey: ['subjects'] });
      qc.invalidateQueries({ queryKey: ['lookup-subjects'] });
      setOpen(false);
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/subjects/${id}`),
    onSuccess: () => {
      toast.push('success', 'Mata pelajaran dihapus');
      qc.invalidateQueries({ queryKey: ['subjects'] });
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  return (
    <div>
      <PageHeader
        title="Mata Pelajaran"
        action={
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <button className="btn-ghost" onClick={() => setImportOpen(true)}>
                Impor Excel
              </button>
            )}
            <button
              className="btn-primary"
              onClick={() => {
                setForm(EMPTY);
                setOpen(true);
              }}
            >
              + Tambah Mapel
            </button>
          </div>
        }
      />
      <div className="card overflow-x-auto p-0">
        {list.isLoading ? (
          <Spinner />
        ) : !list.data?.length ? (
          <EmptyState message="Belum ada mata pelajaran." />
        ) : (
          <table className="table">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.data.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{s.code ?? '—'}</td>
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="action-btn action-edit"
                      onClick={() => {
                        setForm({ id: s.id, name: s.name, code: s.code ?? '' });
                        setOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="action-btn action-danger"
                      onClick={() => {
                        if (confirm(`Hapus ${s.name}?`)) remove.mutate(s.id);
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
        title={form.id ? 'Edit Mapel' : 'Tambah Mapel'}
        onClose={() => setOpen(false)}
      >
        <Field label="Nama">
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="Kode (opsional)">
          <input
            className="input"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
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

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        entity="subjects"
        title="Impor Mata Pelajaran"
        columns={['Nama Mapel', 'Kode']}
        note="Kode opsional (harus unik). Mapel dengan kode/nama yang sama akan dilewati."
        onDone={() => {
          qc.invalidateQueries({ queryKey: ['subjects'] });
          qc.invalidateQueries({ queryKey: ['lookup-subjects'] });
        }}
      />
    </div>
  );
}
