import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiError } from '../lib/api';
import { useToast } from '../components/Toast';
import { EmptyState, Field, Modal, PageHeader, Spinner } from '../components/ui';
import type { Paginated, Role, User } from '../lib/types';

const ROLES: Role[] = ['ADMIN', 'GURU', 'ORTU', 'MURID'];

interface FormState {
  id?: string;
  role: Role;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  isActive: boolean;
}

const EMPTY: FormState = {
  role: 'GURU',
  fullName: '',
  email: '',
  phone: '',
  password: '',
  isActive: true,
};

export default function UsersPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);

  const list = useQuery({
    queryKey: ['users', roleFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (roleFilter) params.set('role', roleFilter);
      if (search) params.set('search', search);
      return (await api.get<Paginated<User>>(`/users?${params}`)).data;
    },
  });

  const save = useMutation({
    mutationFn: async (f: FormState) => {
      const body: Record<string, unknown> = {
        role: f.role,
        fullName: f.fullName,
        email: f.email || undefined,
        phone: f.phone || undefined,
        isActive: f.isActive,
      };
      if (f.password) body.password = f.password;
      if (f.id) return api.patch(`/users/${f.id}`, body);
      return api.post('/users', body);
    },
    onSuccess: () => {
      toast.push('success', 'Pengguna tersimpan');
      qc.invalidateQueries({ queryKey: ['users'] });
      setOpen(false);
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      toast.push('success', 'Pengguna dihapus');
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  function openCreate() {
    setForm(EMPTY);
    setOpen(true);
  }
  function openEdit(u: User) {
    setForm({
      id: u.id,
      role: u.role,
      fullName: u.fullName,
      email: u.email ?? '',
      phone: u.phone ?? '',
      password: '',
      isActive: u.isActive,
    });
    setOpen(true);
  }

  return (
    <div>
      <PageHeader
        title="Pengguna"
        subtitle="Kelola akun Admin, Guru, Orang Tua, dan Murid"
        action={
          <button className="btn-primary" onClick={openCreate}>
            + Tambah Pengguna
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          className="input max-w-[160px]"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">Semua Role</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <input
          className="input max-w-xs"
          placeholder="Cari nama / email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden p-0">
        {list.isLoading ? (
          <Spinner />
        ) : !list.data?.data.length ? (
          <EmptyState message="Belum ada pengguna." />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Telepon</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.data.data.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.fullName}</td>
                  <td className="px-4 py-3">{u.role}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{u.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        'badge ' +
                        (u.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500')
                      }
                    >
                      {u.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="mr-2 text-brand-600 hover:underline"
                      onClick={() => openEdit(u)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => {
                        if (confirm(`Hapus ${u.fullName}?`)) remove.mutate(u.id);
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
        title={form.id ? 'Edit Pengguna' : 'Tambah Pengguna'}
        onClose={() => setOpen(false)}
      >
        <Field label="Peran (Role)">
          <select
            className="input"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nama Lengkap">
          <input
            className="input"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
        </Field>
        <Field label="Email">
          <input
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="Telepon">
          <input
            className="input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </Field>
        <Field label={form.id ? 'Password (kosongkan jika tidak diubah)' : 'Password'}>
          <input
            type="password"
            className="input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>
        <label className="mb-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Akun aktif
        </label>
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
