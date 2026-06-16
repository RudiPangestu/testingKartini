import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiError } from '../lib/api';
import { useToast } from '../components/Toast';
import { useClasses, useParents } from '../lib/hooks';
import { EmptyState, Field, Modal, PageHeader, Spinner } from '../components/ui';
import { useAuth } from '../lib/auth';
import type { Paginated, Student } from '../lib/types';

interface FormState {
  id?: string;
  nisn: string;
  nis: string;
  fullName: string;
  classId: string;
  gender: '' | 'L' | 'P';
}
const EMPTY: FormState = {
  nisn: '',
  nis: '',
  fullName: '',
  classId: '',
  gender: '',
};

export default function StudentsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const isAdmin = useAuth((s) => s.user?.role === 'ADMIN');
  const classes = useClasses();
  const parents = useParents();
  const [classFilter, setClassFilter] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [linkFor, setLinkFor] = useState<Student | null>(null);
  const [parentId, setParentId] = useState('');
  const [relation, setRelation] = useState('ibu');

  const list = useQuery({
    queryKey: ['students', classFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '200' });
      if (classFilter) params.set('classId', classFilter);
      if (search) params.set('search', search);
      return (await api.get<Paginated<Student>>(`/students?${params}`)).data;
    },
  });

  const save = useMutation({
    mutationFn: (f: FormState) => {
      const body = {
        nisn: f.nisn,
        nis: f.nis || undefined,
        fullName: f.fullName,
        classId: f.classId || undefined,
        gender: f.gender || undefined,
      };
      return f.id
        ? api.patch(`/students/${f.id}`, body)
        : api.post('/students', body);
    },
    onSuccess: () => {
      toast.push('success', 'Murid tersimpan');
      qc.invalidateQueries({ queryKey: ['students'] });
      setOpen(false);
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/students/${id}`),
    onSuccess: () => {
      toast.push('success', 'Murid dihapus');
      qc.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  const link = useMutation({
    mutationFn: () =>
      api.post(`/students/${linkFor!.id}/parents`, {
        parentUserId: parentId,
        relation,
      }),
    onSuccess: () => {
      toast.push('success', 'Orang tua ditautkan');
      setLinkFor(null);
      setParentId('');
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  return (
    <div>
      <PageHeader
        title="Murid"
        subtitle="Data murid & penautan orang tua/wali"
        action={
          isAdmin && (
            <button
              className="btn-primary"
              onClick={() => {
                setForm(EMPTY);
                setOpen(true);
              }}
            >
              + Tambah Murid
            </button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          className="input max-w-[200px]"
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
        >
          <option value="">Semua Kelas</option>
          {classes.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          className="input max-w-xs"
          placeholder="Cari NISN / nama…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-x-auto p-0">
        {list.isLoading ? (
          <Spinner />
        ) : !list.data?.data.length ? (
          <EmptyState message="Belum ada murid." />
        ) : (
          <table className="table">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">NISN</th>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Kelas</th>
                <th className="px-4 py-3">JK</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.data.data.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{s.nisn}</td>
                  <td className="px-4 py-3 font-medium">{s.fullName}</td>
                  <td className="px-4 py-3">{s.class?.name ?? '—'}</td>
                  <td className="px-4 py-3">{s.gender ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {isAdmin && (
                      <>
                        <button
                          className="action-btn action-muted"
                          onClick={() => {
                            setLinkFor(s);
                            setParentId('');
                          }}
                        >
                          Tautkan Ortu
                        </button>
                        <button
                          className="action-btn action-edit"
                          onClick={() => {
                            setForm({
                              id: s.id,
                              nisn: s.nisn,
                              nis: s.nis ?? '',
                              fullName: s.fullName,
                              classId: s.classId ?? '',
                              gender: s.gender ?? '',
                            });
                            setOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="action-btn action-danger"
                          onClick={() => {
                            if (confirm(`Hapus ${s.fullName}?`)) remove.mutate(s.id);
                          }}
                        >
                          Hapus
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={open}
        title={form.id ? 'Edit Murid' : 'Tambah Murid'}
        onClose={() => setOpen(false)}
      >
        <Field label="NISN">
          <input
            className="input"
            value={form.nisn}
            onChange={(e) => setForm({ ...form, nisn: e.target.value })}
          />
        </Field>
        <Field label="NIS (opsional)">
          <input
            className="input"
            value={form.nis}
            onChange={(e) => setForm({ ...form, nis: e.target.value })}
          />
        </Field>
        <Field label="Nama Lengkap">
          <input
            className="input"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
        </Field>
        <Field label="Kelas">
          <select
            className="input"
            value={form.classId}
            onChange={(e) => setForm({ ...form, classId: e.target.value })}
          >
            <option value="">— Belum ditempatkan —</option>
            {classes.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Jenis Kelamin">
          <select
            className="input"
            value={form.gender}
            onChange={(e) =>
              setForm({ ...form, gender: e.target.value as FormState['gender'] })
            }
          >
            <option value="">—</option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
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

      <Modal
        open={!!linkFor}
        title={`Tautkan Orang Tua — ${linkFor?.fullName ?? ''}`}
        onClose={() => setLinkFor(null)}
      >
        <Field label="Akun Orang Tua (ORTU)">
          <select
            className="input"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            <option value="">— Pilih —</option>
            {parents.data?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName} {p.email ? `(${p.email})` : ''}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Hubungan">
          <select
            className="input"
            value={relation}
            onChange={(e) => setRelation(e.target.value)}
          >
            <option value="ayah">Ayah</option>
            <option value="ibu">Ibu</option>
            <option value="wali">Wali</option>
          </select>
        </Field>
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setLinkFor(null)}>
            Batal
          </button>
          <button
            className="btn-primary"
            disabled={!parentId || link.isPending}
            onClick={() => link.mutate()}
          >
            Tautkan
          </button>
        </div>
      </Modal>
    </div>
  );
}
