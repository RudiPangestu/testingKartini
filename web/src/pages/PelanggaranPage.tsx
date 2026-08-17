import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiError } from '../lib/api';
import { useToast } from '../components/Toast';
import { EmptyState, Field, Modal, PageHeader, Spinner } from '../components/ui';
import { useClasses } from '../lib/hooks';
import type {
  Student,
  ViolationLevel,
  ViolationSummary,
  ViolationType,
} from '../lib/types';

const LEVEL_BADGE: Record<ViolationLevel, string> = {
  RINGAN: 'bg-yellow-100 text-yellow-700',
  SEDANG: 'bg-orange-100 text-orange-700',
  BERAT: 'bg-red-100 text-red-700',
};

export default function PelanggaranPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const classes = useClasses();
  const today = new Date().toISOString().slice(0, 10);

  const [classId, setClassId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);

  const students = useQuery({
    queryKey: ['class-students', classId],
    enabled: !!classId,
    queryFn: async () =>
      (await api.get<Student[]>(`/classes/${classId}/students`)).data,
  });

  const summary = useQuery({
    queryKey: ['violations', studentId],
    enabled: !!studentId,
    queryFn: async () =>
      (await api.get<ViolationSummary>(`/violations?studentId=${studentId}`))
        .data,
  });

  const types = useQuery({
    queryKey: ['violation-types'],
    queryFn: async () =>
      (await api.get<ViolationType[]>('/violations/types')).data,
  });

  const removeRecord = useMutation({
    mutationFn: (id: string) => api.delete(`/violations/${id}`),
    onSuccess: () => {
      toast.push('success', 'Catatan dihapus');
      qc.invalidateQueries({ queryKey: ['violations', studentId] });
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  const selectedStudent = students.data?.find((s) => s.id === studentId);
  const total = summary.data?.totalPoints ?? 0;

  return (
    <div>
      <PageHeader
        title="Catatan Pelanggaran"
        subtitle="Catat pelanggaran tata tertib murid berdasarkan poin (khusus admin)"
        action={
          <button className="btn-ghost" onClick={() => setCatalogOpen(true)}>
            Kelola Katalog
          </button>
        }
      />

      <div className="card mb-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          <div>
            <label className="label">Murid</label>
            <select
              className="input"
              value={studentId}
              disabled={!classId}
              onChange={(e) => setStudentId(e.target.value)}
            >
              <option value="">— Pilih murid —</option>
              {students.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!studentId ? (
        <EmptyState message="Pilih kelas & murid untuk melihat catatan pelanggaran." />
      ) : summary.isLoading ? (
        <Spinner />
      ) : (
        <div className="card">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-semibold">{selectedStudent?.fullName}</div>
              <div className="text-sm text-gray-500">
                {summary.data?.count ?? 0} catatan pelanggaran
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs uppercase text-gray-400">Total Poin</div>
                <div
                  className={
                    'text-2xl font-bold ' +
                    (total >= 100
                      ? 'text-red-600'
                      : total >= 50
                        ? 'text-orange-600'
                        : 'text-gray-800')
                  }
                >
                  {total}
                </div>
              </div>
              <button className="btn-primary" onClick={() => setAddOpen(true)}>
                + Tambah Pelanggaran
              </button>
            </div>
          </div>

          {!summary.data?.records.length ? (
            <EmptyState message="Belum ada pelanggaran tercatat." />
          ) : (
            <div className="overflow-x-auto">
              <table className="table min-w-[640px]">
                <thead className="text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="py-2">Tanggal</th>
                    <th className="py-2">Pelanggaran</th>
                    <th className="py-2">Tingkat</th>
                    <th className="py-2 text-right">Poin</th>
                    <th className="py-2">Catatan</th>
                    <th className="py-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {summary.data.records.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 text-sm">{r.date.slice(0, 10)}</td>
                      <td className="py-2">{r.description}</td>
                      <td className="py-2">
                        {r.type ? (
                          <span
                            className={
                              'badge ' + LEVEL_BADGE[r.type.level]
                            }
                          >
                            {r.type.level}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">manual</span>
                        )}
                      </td>
                      <td className="py-2 text-right font-medium">{r.points}</td>
                      <td className="py-2 text-sm text-gray-500">
                        {r.note ?? '—'}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          className="action-btn action-danger"
                          onClick={() => {
                            if (confirm('Hapus catatan pelanggaran ini?'))
                              removeRecord.mutate(r.id);
                          }}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {addOpen && studentId && (
        <AddViolationModal
          studentId={studentId}
          types={types.data ?? []}
          defaultDate={today}
          onClose={() => setAddOpen(false)}
          onSaved={() =>
            qc.invalidateQueries({ queryKey: ['violations', studentId] })
          }
        />
      )}

      {catalogOpen && (
        <CatalogModal
          types={types.data ?? []}
          onClose={() => setCatalogOpen(false)}
        />
      )}
    </div>
  );
}

// ---------- Modal tambah pelanggaran ----------
function AddViolationModal({
  studentId,
  types,
  defaultDate,
  onClose,
  onSaved,
}: {
  studentId: string;
  types: ViolationType[];
  defaultDate: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [typeId, setTypeId] = useState('');
  const [manual, setManual] = useState(false);
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [note, setNote] = useState('');

  // Kelompokkan katalog per tingkat → kategori untuk optgroup.
  const grouped = useMemo(() => {
    const g: Record<string, ViolationType[]> = {};
    for (const t of types) {
      const key = `${t.level} · ${t.category}`;
      (g[key] ??= []).push(t);
    }
    return g;
  }, [types]);

  const save = useMutation({
    mutationFn: () => {
      const body: Record<string, unknown> = { studentId, date };
      if (note) body.note = note;
      if (manual) {
        body.description = description;
        body.points = Number(points);
      } else {
        body.typeId = typeId;
      }
      return api.post('/violations', body);
    },
    onSuccess: () => {
      toast.push('success', 'Pelanggaran dicatat');
      onSaved();
      onClose();
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  const valid = manual
    ? description.trim() && points !== '' && Number(points) >= 0
    : !!typeId;

  return (
    <Modal open title="Tambah Pelanggaran" onClose={onClose}>
      <div className="mb-3 flex gap-2 text-sm">
        <button
          className={
            'rounded px-3 py-1 ' +
            (!manual ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600')
          }
          onClick={() => setManual(false)}
        >
          Dari Katalog
        </button>
        <button
          className={
            'rounded px-3 py-1 ' +
            (manual ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600')
          }
          onClick={() => setManual(true)}
        >
          Manual
        </button>
      </div>

      {!manual ? (
        <Field label="Jenis Pelanggaran (poin otomatis)">
          <select
            className="input"
            value={typeId}
            onChange={(e) => setTypeId(e.target.value)}
          >
            <option value="">— Pilih pelanggaran —</option>
            {Object.entries(grouped).map(([grp, list]) => (
              <optgroup key={grp} label={grp}>
                {list.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.points}] {t.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>
      ) : (
        <>
          <Field label="Deskripsi Pelanggaran">
            <input
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <Field label="Poin">
            <input
              type="number"
              min={0}
              className="input"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
            />
          </Field>
        </>
      )}

      <Field label="Tanggal">
        <input
          type="date"
          className="input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </Field>
      <Field label="Catatan (opsional)">
        <input
          className="input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>

      <div className="flex justify-end gap-2">
        <button className="btn-ghost" onClick={onClose}>
          Batal
        </button>
        <button
          className="btn-primary"
          disabled={!valid || save.isPending}
          onClick={() => save.mutate()}
        >
          {save.isPending ? 'Menyimpan…' : 'Simpan'}
        </button>
      </div>
    </Modal>
  );
}

// ---------- Modal kelola katalog ----------
interface CatForm {
  id?: string;
  category: string;
  level: ViolationLevel;
  name: string;
  points: string;
}
const EMPTY_CAT: CatForm = {
  category: '',
  level: 'RINGAN',
  name: '',
  points: '',
};

function CatalogModal({
  types,
  onClose,
}: {
  types: ViolationType[];
  onClose: () => void;
}) {
  const toast = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState<CatForm | null>(null);

  const save = useMutation({
    mutationFn: (f: CatForm) => {
      const body = {
        category: f.category,
        level: f.level,
        name: f.name,
        points: Number(f.points),
      };
      return f.id
        ? api.patch(`/violations/types/${f.id}`, body)
        : api.post('/violations/types', body);
    },
    onSuccess: () => {
      toast.push('success', 'Katalog tersimpan');
      qc.invalidateQueries({ queryKey: ['violation-types'] });
      setForm(null);
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/violations/types/${id}`),
    onSuccess: () => {
      toast.push('success', 'Jenis pelanggaran dihapus/dinonaktifkan');
      qc.invalidateQueries({ queryKey: ['violation-types'] });
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  return (
    <Modal open title="Kelola Katalog Pelanggaran" onClose={onClose}>
      {form ? (
        <div>
          <Field label="Kategori">
            <input
              className="input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </Field>
          <Field label="Tingkat">
            <select
              className="input"
              value={form.level}
              onChange={(e) =>
                setForm({ ...form, level: e.target.value as ViolationLevel })
              }
            >
              <option value="RINGAN">RINGAN</option>
              <option value="SEDANG">SEDANG</option>
              <option value="BERAT">BERAT</option>
            </select>
          </Field>
          <Field label="Nama Pelanggaran">
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Poin">
            <input
              type="number"
              min={0}
              className="input"
              value={form.points}
              onChange={(e) => setForm({ ...form, points: e.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setForm(null)}>
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
        </div>
      ) : (
        <div>
          <div className="mb-3 flex justify-end">
            <button
              className="btn-primary"
              onClick={() => setForm(EMPTY_CAT)}
            >
              + Tambah Jenis
            </button>
          </div>
          <div className="max-h-[50vh] overflow-auto">
            <table className="table">
              <thead className="text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="py-2">Pelanggaran</th>
                  <th className="py-2">Tingkat</th>
                  <th className="py-2 text-right">Poin</th>
                  <th className="py-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {types.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2">
                      <div className="text-sm">{t.name}</div>
                      <div className="text-xs text-gray-400">{t.category}</div>
                    </td>
                    <td className="py-2">
                      <span className={'badge ' + LEVEL_BADGE[t.level]}>
                        {t.level}
                      </span>
                    </td>
                    <td className="py-2 text-right font-medium">{t.points}</td>
                    <td className="py-2 text-right">
                      <button
                        className="action-btn action-edit"
                        onClick={() =>
                          setForm({
                            id: t.id,
                            category: t.category,
                            level: t.level,
                            name: t.name,
                            points: String(t.points),
                          })
                        }
                      >
                        Edit
                      </button>
                      <button
                        className="action-btn action-danger"
                        onClick={() => {
                          if (confirm(`Hapus "${t.name}"?`)) remove.mutate(t.id);
                        }}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
}
