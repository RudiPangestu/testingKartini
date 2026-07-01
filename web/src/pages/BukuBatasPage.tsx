import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiError } from '../lib/api';
import { useToast } from '../components/Toast';
import { useClasses, useSubjects } from '../lib/hooks';
import { EmptyState, Field, Modal, PageHeader, Spinner } from '../components/ui';
import type { AbsentSuggestion, LessonLog } from '../lib/types';

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

interface FormState {
  id?: string;
  date: string;
  jamKe: string;
  subjectId: string;
  namaSiswa: string;
  pokokBahasan: string;
  metode: string;
  selesai: boolean;
  siswaTidakHadir: string;
  refleksi: string;
  tindakLanjut: string;
}
const EMPTY: FormState = {
  date: '',
  jamKe: '',
  subjectId: '',
  namaSiswa: '',
  pokokBahasan: '',
  metode: '',
  selesai: true,
  siswaTidakHadir: '',
  refleksi: '',
  tindakLanjut: '',
};

const now = new Date();

export default function BukuBatasPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const classes = useClasses();
  const subjects = useSubjects();

  const [classId, setClassId] = useState('');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loadingAbsent, setLoadingAbsent] = useState(false);

  const list = useQuery({
    queryKey: ['lesson-logs', classId, year, month],
    enabled: !!classId,
    queryFn: async () =>
      (
        await api.get<LessonLog[]>('/lesson-logs', {
          params: { classId, year, month },
        })
      ).data,
  });

  const save = useMutation({
    mutationFn: (f: FormState) => {
      const body = {
        classId,
        date: f.date,
        jamKe: f.jamKe,
        subjectId: f.subjectId || undefined,
        namaSiswa: f.namaSiswa || undefined,
        pokokBahasan: f.pokokBahasan,
        metode: f.metode || undefined,
        selesai: f.selesai,
        siswaTidakHadir: f.siswaTidakHadir || undefined,
        refleksi: f.refleksi || undefined,
        tindakLanjut: f.tindakLanjut || undefined,
      };
      return f.id
        ? api.patch(`/lesson-logs/${f.id}`, body)
        : api.post('/lesson-logs', body);
    },
    onSuccess: () => {
      toast.push('success', 'Batas pelajaran tersimpan');
      qc.invalidateQueries({ queryKey: ['lesson-logs'] });
      setOpen(false);
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/lesson-logs/${id}`),
    onSuccess: () => {
      toast.push('success', 'Entri dihapus');
      qc.invalidateQueries({ queryKey: ['lesson-logs'] });
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  async function ambilPresensi() {
    if (!classId || !form.date) {
      toast.push('error', 'Pilih kelas & tanggal dulu');
      return;
    }
    setLoadingAbsent(true);
    try {
      const { data } = await api.get<AbsentSuggestion>(
        '/lesson-logs/suggest-absent',
        { params: { classId, date: form.date } },
      );
      setForm((f) => ({ ...f, siswaTidakHadir: data.text }));
      if (!data.text) toast.push('success', 'Semua siswa hadir pada tanggal ini');
    } catch (e) {
      toast.push('error', apiError(e));
    } finally {
      setLoadingAbsent(false);
    }
  }

  function openCetak() {
    if (!classId) {
      toast.push('error', 'Pilih kelas dulu');
      return;
    }
    const q = new URLSearchParams({
      classId,
      year: String(year),
      month: String(month),
    });
    window.open(`/buku-batas/cetak?${q.toString()}`, '_blank');
  }

  function hari(dateStr: string) {
    return HARI[new Date(dateStr).getDay()];
  }

  return (
    <div>
      <PageHeader
        title="Buku Batas Pembelajaran"
        subtitle="Catat batas materi tiap pertemuan, lalu cetak/simpan PDF sesuai buku asli"
        action={
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={openCetak}>
              Cetak / PDF
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                setForm(EMPTY);
                setOpen(true);
              }}
              disabled={!classId}
            >
              + Tambah Entri
            </button>
          </div>
        }
      />

      {/* Filter */}
      <div className="card mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Kelas">
          <select
            className="input"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            <option value="">— Pilih kelas —</option>
            {classes.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.academicYear})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Bulan">
          <select
            className="input"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {BULAN.map((b, i) => (
              <option key={b} value={i + 1}>
                {b}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tahun">
          <input
            type="number"
            className="input"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </Field>
      </div>

      <div className="card overflow-x-auto p-0">
        {!classId ? (
          <EmptyState message="Pilih kelas untuk melihat & mengisi buku batas." />
        ) : list.isLoading ? (
          <Spinner />
        ) : !list.data?.length ? (
          <EmptyState message="Belum ada entri pada bulan ini." />
        ) : (
          <table className="table whitespace-nowrap">
            <thead>
              <tr>
                <th>Hari/Tgl</th>
                <th>Jam Ke</th>
                <th>Mata Pelajaran</th>
                <th>Pokok Bahasan</th>
                <th>Metode</th>
                <th>Selesai</th>
                <th>Tidak Hadir</th>
                <th>Paraf Guru</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {list.data.map((l) => (
                <tr key={l.id}>
                  <td>
                    {hari(l.date)}, {l.date.slice(0, 10)}
                  </td>
                  <td>{l.jamKe}</td>
                  <td>{l.subject?.name ?? '—'}</td>
                  <td className="max-w-xs truncate" title={l.pokokBahasan}>
                    {l.pokokBahasan}
                  </td>
                  <td>{l.metode ?? '—'}</td>
                  <td>
                    <span
                      className={
                        'badge ' +
                        (l.selesai
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700')
                      }
                    >
                      {l.selesai ? 'Selesai' : 'Belum'}
                    </span>
                  </td>
                  <td className="max-w-xs truncate" title={l.siswaTidakHadir ?? ''}>
                    {l.siswaTidakHadir || '—'}
                  </td>
                  <td>{l.teacher?.fullName ?? '—'}</td>
                  <td className="text-right">
                    <button
                      className="action-btn action-edit"
                      onClick={() => {
                        setForm({
                          id: l.id,
                          date: l.date.slice(0, 10),
                          jamKe: l.jamKe,
                          subjectId: l.subjectId ?? '',
                          namaSiswa: l.namaSiswa ?? '',
                          pokokBahasan: l.pokokBahasan,
                          metode: l.metode ?? '',
                          selesai: l.selesai,
                          siswaTidakHadir: l.siswaTidakHadir ?? '',
                          refleksi: l.refleksi ?? '',
                          tindakLanjut: l.tindakLanjut ?? '',
                        });
                        setOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="action-btn action-danger"
                      onClick={() => {
                        if (confirm('Hapus entri ini?')) remove.mutate(l.id);
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
        title={form.id ? 'Edit Batas Pelajaran' : 'Tambah Batas Pelajaran'}
        onClose={() => setOpen(false)}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tanggal">
            <input
              type="date"
              className="input"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </Field>
          <Field label="Jam Ke">
            <input
              className="input"
              placeholder="mis. 1-2"
              value={form.jamKe}
              onChange={(e) => setForm({ ...form, jamKe: e.target.value })}
            />
          </Field>
        </div>
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
        <Field label="Pokok Bahasan">
          <textarea
            className="input"
            rows={2}
            value={form.pokokBahasan}
            onChange={(e) => setForm({ ...form, pokokBahasan: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Metode">
            <input
              className="input"
              value={form.metode}
              onChange={(e) => setForm({ ...form, metode: e.target.value })}
            />
          </Field>
          <Field label="Status">
            <select
              className="input"
              value={form.selesai ? '1' : '0'}
              onChange={(e) =>
                setForm({ ...form, selesai: e.target.value === '1' })
              }
            >
              <option value="1">Selesai</option>
              <option value="0">Belum</option>
            </select>
          </Field>
        </div>
        <Field label="Siswa Tidak Hadir">
          <textarea
            className="input"
            rows={2}
            placeholder="mis. Budi (Sakit), Ani (Alpha)"
            value={form.siswaTidakHadir}
            onChange={(e) =>
              setForm({ ...form, siswaTidakHadir: e.target.value })
            }
          />
          <button
            type="button"
            className="btn-ghost mt-2 text-xs"
            onClick={ambilPresensi}
            disabled={loadingAbsent}
          >
            {loadingAbsent ? 'Mengambil…' : 'Ambil dari presensi'}
          </button>
        </Field>
        <Field label="Refleksi">
          <textarea
            className="input"
            rows={2}
            value={form.refleksi}
            onChange={(e) => setForm({ ...form, refleksi: e.target.value })}
          />
        </Field>
        <Field label="Tindak Lanjut">
          <textarea
            className="input"
            rows={2}
            value={form.tindakLanjut}
            onChange={(e) => setForm({ ...form, tindakLanjut: e.target.value })}
          />
        </Field>
        <Field label="Nama Siswa (opsional)">
          <input
            className="input"
            value={form.namaSiswa}
            onChange={(e) => setForm({ ...form, namaSiswa: e.target.value })}
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
