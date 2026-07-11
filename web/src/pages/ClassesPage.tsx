import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiError } from '../lib/api';
import { useToast } from '../components/Toast';
import { useTeachers } from '../lib/hooks';
import { EmptyState, Field, Modal, PageHeader, Spinner } from '../components/ui';
import { useAuth } from '../lib/auth';
import ImportModal from '../components/ImportModal';
import type { Paginated, SchoolClass, Student } from '../lib/types';

interface FormState {
  id?: string;
  name: string;
  grade: number;
  academicYear: string;
  homeroomTeacherId: string;
}
const EMPTY: FormState = {
  name: '',
  grade: 10,
  academicYear: '2025/2026',
  homeroomTeacherId: '',
};

export default function ClassesPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const isAdmin = useAuth((s) => s.user?.role === 'ADMIN');
  const teachers = useTeachers();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [viewClass, setViewClass] = useState<SchoolClass | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const list = useQuery({
    queryKey: ['classes'],
    queryFn: async () =>
      (await api.get<Paginated<SchoolClass>>('/classes?limit=200')).data,
  });

  const studentsOf = useQuery({
    queryKey: ['class-students', viewClass?.id],
    enabled: !!viewClass,
    queryFn: async () =>
      (await api.get<Student[]>(`/classes/${viewClass!.id}/students`)).data,
  });

  const save = useMutation({
    mutationFn: (f: FormState) => {
      const body = {
        name: f.name,
        grade: Number(f.grade),
        academicYear: f.academicYear,
        homeroomTeacherId: f.homeroomTeacherId || undefined,
      };
      return f.id ? api.patch(`/classes/${f.id}`, body) : api.post('/classes', body);
    },
    onSuccess: () => {
      toast.push('success', 'Kelas tersimpan');
      qc.invalidateQueries({ queryKey: ['classes'] });
      setOpen(false);
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/classes/${id}`),
    onSuccess: () => {
      toast.push('success', 'Kelas dihapus');
      qc.invalidateQueries({ queryKey: ['classes'] });
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  return (
    <div>
      <PageHeader
        title="Kelas"
        subtitle="Daftar rombongan belajar"
        action={
          isAdmin && (
            <div className="flex flex-wrap gap-2">
              <button className="btn-ghost" onClick={() => setImportOpen(true)}>
                Impor Excel
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setForm(EMPTY);
                  setOpen(true);
                }}
              >
                + Tambah Kelas
              </button>
            </div>
          )
        }
      />

      <div className="card overflow-x-auto p-0">
        {list.isLoading ? (
          <Spinner />
        ) : !list.data?.data.length ? (
          <EmptyState message="Belum ada kelas." />
        ) : (
          <table className="table">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Tingkat</th>
                <th className="px-4 py-3">Tahun Ajaran</th>
                <th className="px-4 py-3">Wali Kelas</th>
                <th className="px-4 py-3">Murid</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.data.data.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">{c.grade}</td>
                  <td className="px-4 py-3 text-gray-500">{c.academicYear}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {c.homeroomTeacher?.fullName ?? '—'}
                  </td>
                  <td className="px-4 py-3">{c._count?.students ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="action-btn action-muted"
                      onClick={() => setViewClass(c)}
                    >
                      Lihat Murid
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          className="action-btn action-edit"
                          onClick={() => {
                            setForm({
                              id: c.id,
                              name: c.name,
                              grade: c.grade,
                              academicYear: c.academicYear,
                              homeroomTeacherId: c.homeroomTeacherId ?? '',
                            });
                            setOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="action-btn action-danger"
                          onClick={() => {
                            if (confirm(`Hapus kelas ${c.name}?`)) remove.mutate(c.id);
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
        title={form.id ? 'Edit Kelas' : 'Tambah Kelas'}
        onClose={() => setOpen(false)}
      >
        <Field label="Nama Kelas">
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="XII IPA 1"
          />
        </Field>
        <Field label="Tingkat (10–12)">
          <input
            type="number"
            className="input"
            value={form.grade}
            onChange={(e) => setForm({ ...form, grade: Number(e.target.value) })}
          />
        </Field>
        <Field label="Tahun Ajaran">
          <input
            className="input"
            value={form.academicYear}
            onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
          />
        </Field>
        <Field label="Wali Kelas">
          <select
            className="input"
            value={form.homeroomTeacherId}
            onChange={(e) =>
              setForm({ ...form, homeroomTeacherId: e.target.value })
            }
          >
            <option value="">— Tidak ditentukan —</option>
            {teachers.data?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName}
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

      <Modal
        open={!!viewClass}
        title={`Murid Kelas ${viewClass?.name ?? ''}`}
        onClose={() => setViewClass(null)}
      >
        {studentsOf.isLoading ? (
          <Spinner />
        ) : !studentsOf.data?.length ? (
          <EmptyState message="Belum ada murid di kelas ini." />
        ) : (
          <ul className="divide-y text-sm">
            {studentsOf.data.map((s) => (
              <li key={s.id} className="flex justify-between py-2">
                <span>{s.fullName}</span>
                <span className="text-gray-400">{s.nisn}</span>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        entity="classes"
        title="Impor Kelas"
        columns={['Nama Kelas', 'Tingkat', 'Tahun Ajaran']}
        note="Tingkat diisi angka (mis. 10). Kelas dengan nama + tahun ajaran yang sama akan dilewati."
        onDone={() => {
          qc.invalidateQueries({ queryKey: ['classes'] });
          qc.invalidateQueries({ queryKey: ['lookup-classes'] });
        }}
      />
    </div>
  );
}
