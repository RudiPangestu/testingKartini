import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiError } from '../lib/api';
import { useToast } from '../components/Toast';
import { useClasses, useSubjects } from '../lib/hooks';
import { EmptyState, Field, PageHeader, Spinner } from '../components/ui';
import type {
  GradeBook,
  GradeBookFull,
  GradeComponent,
  Predikat,
  ScoreItem,
} from '../lib/types';

const KOMPONEN: GradeComponent[] = ['PENGETAHUAN', 'PRAKTEK'];

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  return round2(nums.reduce((a, b) => a + b, 0) / nums.length);
}
function predikat(n: number | null): Predikat {
  if (n === null) return null;
  if (n >= 86) return 'A';
  if (n >= 71) return 'B';
  if (n >= 56) return 'C';
  return 'D';
}
const cellKey = (
  kdId: string,
  studentId: string,
  komponen: GradeComponent,
  urutan: number,
) => `${kdId}|${studentId}|${komponen}|${urutan}`;

const now = new Date();
function defaultYear() {
  const y = now.getFullYear();
  // Tahun ajaran mulai Juli.
  return now.getMonth() >= 6 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
}

export default function NilaiPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const classes = useClasses();
  const subjects = useSubjects();

  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [cawu, setCawu] = useState(1);
  const [academicYear, setAcademicYear] = useState(defaultYear());

  const [activeKd, setActiveKd] = useState<string>('');
  const [tab, setTab] = useState<'input' | 'rekap'>('input');

  // Nilai sel yang sedang diedit: key -> string (angka atau kosong).
  const [cells, setCells] = useState<Record<string, string>>({});
  // Jumlah kolom per (kdId|komponen).
  const [cols, setCols] = useState<Record<string, number>>({});
  // Key sel yang sudah tersimpan di server (untuk deteksi penghapusan).
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());

  const ready = !!classId && !!subjectId && !!academicYear && !!cawu;

  const bookQuery = useQuery({
    queryKey: ['grade-book', classId, subjectId, academicYear, cawu],
    enabled: ready,
    queryFn: async () =>
      (
        await api.get<GradeBook | null>('/grades/book', {
          params: { classId, subjectId, academicYear, cawu },
        })
      ).data,
  });

  const bookId = bookQuery.data?.id;

  const fullQuery = useQuery({
    queryKey: ['grade-book-full', bookId],
    enabled: !!bookId,
    queryFn: async () =>
      (await api.get<GradeBookFull>(`/grades/book/${bookId}`)).data,
  });

  // Sinkronkan state lokal saat data buku dimuat.
  useEffect(() => {
    const data = fullQuery.data;
    if (!data) return;
    const c: Record<string, string> = {};
    const keys = new Set<string>();
    const colCount: Record<string, number> = {};
    for (const s of data.scores) {
      const k = cellKey(s.kdId, s.studentId, s.komponen, s.urutan);
      c[k] = String(s.nilai);
      keys.add(k);
      const ck = `${s.kdId}|${s.komponen}`;
      colCount[ck] = Math.max(colCount[ck] ?? 0, s.urutan);
    }
    // Minimal 2 kolom per komponen agar mudah diisi.
    for (const kd of data.book.kds) {
      for (const komp of KOMPONEN) {
        const ck = `${kd.id}|${komp}`;
        colCount[ck] = Math.max(colCount[ck] ?? 0, 2);
      }
    }
    setCells(c);
    setSavedKeys(keys);
    setCols(colCount);
    setActiveKd((prev) =>
      prev && data.book.kds.some((k) => k.id === prev)
        ? prev
        : data.book.kds[0]?.id ?? '',
    );
  }, [fullQuery.data]);

  const createBook = useMutation({
    mutationFn: () =>
      api.post<GradeBook>('/grades/book', {
        classId,
        subjectId,
        academicYear,
        cawu,
      }),
    onSuccess: () => {
      toast.push('success', 'Buku nilai dibuat');
      qc.invalidateQueries({ queryKey: ['grade-book'] });
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  const saveScores = useMutation({
    mutationFn: (items: ScoreItem[]) =>
      api.put(`/grades/book/${bookId}/scores`, { items }),
    onSuccess: () => {
      toast.push('success', 'Nilai tersimpan');
      qc.invalidateQueries({ queryKey: ['grade-book-full', bookId] });
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  const addKd = useMutation({
    mutationFn: () => api.post(`/grades/book/${bookId}/kd`, {}),
    onSuccess: () => {
      toast.push('success', 'KD ditambah');
      qc.invalidateQueries({ queryKey: ['grade-book-full', bookId] });
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  const removeKd = useMutation({
    mutationFn: (kdId: string) => api.delete(`/grades/kd/${kdId}`),
    onSuccess: () => {
      toast.push('success', 'KD dihapus');
      qc.invalidateQueries({ queryKey: ['grade-book-full', bookId] });
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  function setCell(k: string, v: string) {
    setCells((prev) => ({ ...prev, [k]: v }));
  }
  function addCol(kdId: string, komp: GradeComponent) {
    const ck = `${kdId}|${komp}`;
    setCols((p) => ({ ...p, [ck]: (p[ck] ?? 2) + 1 }));
  }
  function removeCol(kdId: string, komp: GradeComponent) {
    const ck = `${kdId}|${komp}`;
    const count = cols[ck] ?? 2;
    if (count <= 1) return;
    // Kosongkan sel pada kolom terakhir yang dihapus.
    const students = fullQuery.data?.students ?? [];
    setCells((prev) => {
      const next = { ...prev };
      for (const st of students) delete next[cellKey(kdId, st.id, komp, count)];
      return next;
    });
    setCols((p) => ({ ...p, [ck]: count - 1 }));
  }

  function handleSave() {
    if (!bookId) return;
    const items: ScoreItem[] = [];
    const seen = new Set<string>();
    // Sel yang terisi angka -> upsert.
    for (const [k, v] of Object.entries(cells)) {
      seen.add(k);
      const [kdId, studentId, komponen, urutan] = k.split('|');
      const num = v.trim() === '' ? null : Number(v);
      if (num === null || Number.isNaN(num)) {
        if (savedKeys.has(k))
          items.push({
            kdId,
            studentId,
            komponen: komponen as GradeComponent,
            urutan: Number(urutan),
            nilai: null,
          });
        continue;
      }
      items.push({
        kdId,
        studentId,
        komponen: komponen as GradeComponent,
        urutan: Number(urutan),
        nilai: num,
      });
    }
    // Sel yang dulu tersimpan tapi kini hilang -> hapus.
    for (const k of savedKeys) {
      if (!seen.has(k)) {
        const [kdId, studentId, komponen, urutan] = k.split('|');
        items.push({
          kdId,
          studentId,
          komponen: komponen as GradeComponent,
          urutan: Number(urutan),
          nilai: null,
        });
      }
    }
    if (!items.length) {
      toast.push('success', 'Tidak ada perubahan');
      return;
    }
    saveScores.mutate(items);
  }

  function openCetak() {
    if (!bookId) return;
    window.open(`/nilai/cetak?bookId=${bookId}`, '_blank');
  }

  const full = fullQuery.data;
  const kd = full?.book.kds.find((k) => k.id === activeKd);

  // NA live per (student, komponen) untuk KD aktif.
  function liveNa(studentId: string, komp: GradeComponent): number | null {
    if (!kd) return null;
    const count = cols[`${kd.id}|${komp}`] ?? 2;
    const vals: number[] = [];
    for (let u = 1; u <= count; u++) {
      const raw = cells[cellKey(kd.id, studentId, komp, u)];
      if (raw != null && raw.trim() !== '' && !Number.isNaN(Number(raw)))
        vals.push(Number(raw));
    }
    return avg(vals);
  }
  function liveKd(studentId: string): number | null {
    const parts = [liveNa(studentId, 'PENGETAHUAN'), liveNa(studentId, 'PRAKTEK')].filter(
      (x): x is number => x !== null,
    );
    return parts.length ? avg(parts) : null;
  }

  const pCols = kd ? cols[`${kd.id}|PENGETAHUAN`] ?? 2 : 0;
  const kCols = kd ? cols[`${kd.id}|PRAKTEK`] ?? 2 : 0;

  return (
    <div>
      <PageHeader
        title="Daftar Nilai (Daflai)"
        subtitle="Input nilai per Kompetensi Dasar (KD). NA, Predikat & NR dihitung otomatis."
        action={
          bookId ? (
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={openCetak}>
                Cetak / PDF
              </button>
              {tab === 'input' && (
                <button
                  className="btn-primary"
                  onClick={handleSave}
                  disabled={saveScores.isPending}
                >
                  {saveScores.isPending ? 'Menyimpan…' : 'Simpan Nilai'}
                </button>
              )}
            </div>
          ) : undefined
        }
      />

      {/* Filter */}
      <div className="card mb-5 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Field label="Kelas">
          <select
            className="input"
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              const c = classes.data?.find((x) => x.id === e.target.value);
              if (c) setAcademicYear(c.academicYear);
            }}
          >
            <option value="">— Pilih kelas —</option>
            {classes.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.academicYear})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Mata Pelajaran">
          <select
            className="input"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          >
            <option value="">— Pilih mapel —</option>
            {subjects.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Cawu">
          <select
            className="input"
            value={cawu}
            onChange={(e) => setCawu(Number(e.target.value))}
          >
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>
                Caturwulan {n}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tahun Pelajaran">
          <input
            className="input"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            placeholder="2025/2026"
          />
        </Field>
      </div>

      {!ready ? (
        <div className="card">
          <EmptyState message="Pilih kelas, mata pelajaran, cawu & tahun untuk mulai." />
        </div>
      ) : bookQuery.isLoading ? (
        <div className="card">
          <Spinner />
        </div>
      ) : !bookId ? (
        <div className="card flex flex-col items-center gap-3 py-10">
          <p className="text-gray-500">Buku nilai untuk pilihan ini belum ada.</p>
          <button
            className="btn-primary"
            onClick={() => createBook.mutate()}
            disabled={createBook.isPending}
          >
            {createBook.isPending ? 'Membuat…' : '+ Buat Buku Nilai (5 KD)'}
          </button>
        </div>
      ) : fullQuery.isLoading || !full ? (
        <div className="card">
          <Spinner />
        </div>
      ) : (
        <>
          {/* Tab */}
          <div className="mb-4 flex gap-2">
            <button
              className={tab === 'input' ? 'btn-primary' : 'btn-ghost'}
              onClick={() => setTab('input')}
            >
              Input Nilai
            </button>
            <button
              className={tab === 'rekap' ? 'btn-primary' : 'btn-ghost'}
              onClick={() => setTab('rekap')}
            >
              Rekap & Predikat
            </button>
          </div>

          {tab === 'input' ? (
            <>
              {/* KD tabs */}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {full.book.kds.map((k) => (
                  <button
                    key={k.id}
                    className={
                      'rounded-lg px-3 py-1.5 text-sm font-medium ' +
                      (activeKd === k.id
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
                    }
                    onClick={() => setActiveKd(k.id)}
                  >
                    KD {k.nomor}
                  </button>
                ))}
                <button
                  className="btn-ghost text-xs"
                  onClick={() => addKd.mutate()}
                >
                  + KD
                </button>
                {kd && full.book.kds.length > 1 && (
                  <button
                    className="action-btn action-danger text-xs"
                    onClick={() => {
                      if (confirm(`Hapus KD ${kd.nomor} beserta nilainya?`))
                        removeKd.mutate(kd.id);
                    }}
                  >
                    Hapus KD {kd.nomor}
                  </button>
                )}
              </div>

              {kd && (
                <div className="card overflow-x-auto p-0">
                  <div className="flex flex-wrap gap-2 border-b border-gray-100 p-3 text-xs text-gray-500">
                    <span>
                      Pengetahuan:
                      <button
                        className="btn-ghost ml-1 px-2 py-0.5"
                        onClick={() => addCol(kd.id, 'PENGETAHUAN')}
                      >
                        +kolom
                      </button>
                      <button
                        className="btn-ghost px-2 py-0.5"
                        onClick={() => removeCol(kd.id, 'PENGETAHUAN')}
                      >
                        −kolom
                      </button>
                    </span>
                    <span>
                      Praktek:
                      <button
                        className="btn-ghost ml-1 px-2 py-0.5"
                        onClick={() => addCol(kd.id, 'PRAKTEK')}
                      >
                        +kolom
                      </button>
                      <button
                        className="btn-ghost px-2 py-0.5"
                        onClick={() => removeCol(kd.id, 'PRAKTEK')}
                      >
                        −kolom
                      </button>
                    </span>
                    <span className="ml-auto italic">
                      KKM {full.book.kkm} · NA = rata-rata nilai mentah
                    </span>
                  </div>
                  <table className="table whitespace-nowrap text-sm">
                    <thead>
                      <tr>
                        <th className="sticky left-0 bg-gray-50">No</th>
                        <th className="sticky left-0 bg-gray-50">Nama</th>
                        {Array.from({ length: pCols }, (_, i) => (
                          <th key={`p${i}`} className="bg-blue-50">
                            P{i + 1}
                          </th>
                        ))}
                        <th className="bg-blue-100">NA-P</th>
                        {Array.from({ length: kCols }, (_, i) => (
                          <th key={`k${i}`} className="bg-amber-50">
                            K{i + 1}
                          </th>
                        ))}
                        <th className="bg-amber-100">NA-K</th>
                        <th>Nilai KD</th>
                        <th>Pred.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {full.students.map((st, idx) => {
                        const naP = liveNa(st.id, 'PENGETAHUAN');
                        const naK = liveNa(st.id, 'PRAKTEK');
                        const nkd = liveKd(st.id);
                        return (
                          <tr key={st.id}>
                            <td className="sticky left-0 bg-white">{idx + 1}</td>
                            <td className="sticky left-0 bg-white font-medium">
                              {st.fullName}
                            </td>
                            {Array.from({ length: pCols }, (_, i) => {
                              const k = cellKey(kd.id, st.id, 'PENGETAHUAN', i + 1);
                              return (
                                <td key={k}>
                                  <input
                                    className="input w-16 px-1 py-1 text-center"
                                    inputMode="numeric"
                                    value={cells[k] ?? ''}
                                    onChange={(e) => setCell(k, e.target.value)}
                                  />
                                </td>
                              );
                            })}
                            <td className="bg-blue-50 text-center font-semibold">
                              {naP ?? '—'}
                            </td>
                            {Array.from({ length: kCols }, (_, i) => {
                              const k = cellKey(kd.id, st.id, 'PRAKTEK', i + 1);
                              return (
                                <td key={k}>
                                  <input
                                    className="input w-16 px-1 py-1 text-center"
                                    inputMode="numeric"
                                    value={cells[k] ?? ''}
                                    onChange={(e) => setCell(k, e.target.value)}
                                  />
                                </td>
                              );
                            })}
                            <td className="bg-amber-50 text-center font-semibold">
                              {naK ?? '—'}
                            </td>
                            <td className="text-center font-bold">{nkd ?? '—'}</td>
                            <td className="text-center">{predikat(nkd) ?? '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="mt-3 text-xs text-gray-400">
                Ingat menekan <b>Simpan Nilai</b> setelah mengisi. Perpindahan KD
                tidak menghapus isian, tapi belum tersimpan sebelum ditekan simpan.
              </p>
            </>
          ) : (
            <RekapView full={full} />
          )}
        </>
      )}
    </div>
  );
}

function RekapView({ full }: { full: GradeBookFull }) {
  const kds = full.book.kds;
  const s = full.stats;
  return (
    <div className="card overflow-x-auto p-0">
      <table className="table whitespace-nowrap text-sm">
        <thead>
          <tr>
            <th>No</th>
            <th>NIS</th>
            <th>Nama</th>
            {kds.map((k) => (
              <th key={k.id} className="text-center">
                KD {k.nomor}
              </th>
            ))}
            <th className="text-center">NR</th>
            <th className="text-center">Predikat</th>
            <th className="text-center">Tuntas</th>
          </tr>
        </thead>
        <tbody>
          {full.summary.map((row, i) => (
            <tr key={row.studentId}>
              <td>{i + 1}</td>
              <td>{row.nis ?? row.nisn}</td>
              <td className="font-medium">{row.fullName}</td>
              {kds.map((k) => {
                const r = row.kd.find((x) => x.kdId === k.id);
                return (
                  <td key={k.id} className="text-center">
                    {r?.nilaiKd ?? '—'}
                  </td>
                );
              })}
              <td className="text-center font-bold">{row.nr ?? '—'}</td>
              <td className="text-center">{row.predikat ?? '—'}</td>
              <td className="text-center">
                {row.tuntas === null ? '—' : row.tuntas ? '✓' : '✗'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="grid grid-cols-2 gap-3 border-t border-gray-100 p-4 text-sm sm:grid-cols-4">
        <Stat label="Rata-rata Kelas" value={s.rataKelas ?? '—'} />
        <Stat
          label="Daya Serap Siswa"
          value={s.dayaSerap !== null ? `${s.dayaSerap}%` : '—'}
        />
        <Stat
          label="Target Kurikulum (tuntas)"
          value={s.targetKurikulum !== null ? `${s.targetKurikulum}%` : '—'}
        />
        <Stat label="Tuntas / Dinilai" value={`${s.jumlahTuntas}/${s.jumlahDinilai}`} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-bold text-gray-800">{value}</div>
    </div>
  );
}
