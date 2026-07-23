import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiError } from '../lib/api';
import { useToast } from '../components/Toast';
import { EmptyState, Field, Modal, PageHeader, Spinner } from '../components/ui';
import { useAuth } from '../lib/auth';
import { useClasses, useTeachers } from '../lib/hooks';
import ImportModal from '../components/ImportModal';
import type { Subject, SubjectTeacher } from '../lib/types';

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
  // Mapel yang sedang dikelola penugasan gurunya (null = modal tertutup).
  const [assignSubject, setAssignSubject] = useState<Subject | null>(null);

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
                      onClick={() => setAssignSubject(s)}
                    >
                      Guru
                    </button>
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

      {assignSubject && (
        <TeacherAssignModal
          subject={assignSubject}
          onClose={() => setAssignSubject(null)}
        />
      )}
    </div>
  );
}

// Modal kelola guru pengampu sebuah mapel per kelas. Satu mapel bisa banyak
// guru; mapel yang sama bisa diampu guru berbeda di kelas yang berbeda.
function TeacherAssignModal({
  subject,
  onClose,
}: {
  subject: Subject;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const teachers = useTeachers();
  const classes = useClasses();
  const [classId, setClassId] = useState('');
  const [teacherId, setTeacherId] = useState('');

  const key = ['subject-teachers', subject.id];
  const list = useQuery({
    queryKey: key,
    queryFn: async () =>
      (await api.get<SubjectTeacher[]>(`/subjects/${subject.id}/teachers`)).data,
  });

  const assign = useMutation({
    mutationFn: () =>
      api.post(`/subjects/${subject.id}/teachers`, { classId, teacherId }),
    onSuccess: () => {
      toast.push('success', 'Guru ditugaskan');
      setTeacherId('');
      qc.invalidateQueries({ queryKey: key });
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/subjects/teachers/${id}`),
    onSuccess: () => {
      toast.push('success', 'Penugasan dihapus');
      qc.invalidateQueries({ queryKey: key });
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  return (
    <Modal open title={`Guru Pengampu — ${subject.name}`} onClose={onClose}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Kelas">
          <select
            className="input"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            <option value="">— Pilih kelas —</option>
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
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
          >
            <option value="">— Pilih guru —</option>
            {teachers.data?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="mb-4 flex justify-end">
        <button
          className="btn-primary"
          disabled={!classId || !teacherId || assign.isPending}
          onClick={() => assign.mutate()}
        >
          + Tugaskan
        </button>
      </div>

      {list.isLoading ? (
        <Spinner />
      ) : !list.data?.length ? (
        <EmptyState message="Belum ada guru yang ditugaskan pada mapel ini." />
      ) : (
        <table className="table">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">Kelas</th>
              <th className="px-3 py-2">Guru</th>
              <th className="px-3 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {list.data.map((a) => (
              <tr key={a.id}>
                <td className="px-3 py-2">{a.class.name}</td>
                <td className="px-3 py-2 font-medium">{a.teacher.fullName}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    className="action-btn action-danger"
                    onClick={() => remove.mutate(a.id)}
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Modal>
  );
}
