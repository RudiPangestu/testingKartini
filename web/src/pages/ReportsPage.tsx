import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, apiError, downloadFile } from '../lib/api';
import { PageHeader } from '../components/ui';
import { useToast } from '../components/Toast';
import { useClasses, useSubjects } from '../lib/hooks';
import TrendChart from '../components/TrendChart';
import type { Paginated, ReportResult, Student, Term } from '../lib/types';

type Tab = 'general' | 'class' | 'individual';

function SubjectSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const subjects = useSubjects();
  return (
    <div>
      <label className="label">Mata Pelajaran</label>
      <select
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Semua mapel</option>
        {subjects.data?.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function Metric({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="card text-center">
      <div className="text-xs uppercase text-gray-500">{label}</div>
      <div className={'mt-1 text-2xl font-bold ' + (color ?? 'text-gray-900')}>
        {value}
      </div>
    </div>
  );
}

function ResultView({ data }: { data: ReportResult }) {
  return (
    <div className="space-y-4">
      {data.studentName && (
        <div className="text-lg font-semibold">{data.studentName}</div>
      )}
      {data.range && (
        <div className="text-sm text-gray-500">
          Periode: {data.range.start} → {data.range.end}
        </div>
      )}
      <ProportionBar data={data} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric
          label="Hadir Efektif"
          value={`${data.hadirEfektifPct}%`}
          color="text-green-600"
        />
        <Metric
          label="Kehadiran Sah"
          value={`${data.kehadiranSahPct}%`}
          color="text-brand-600"
        />
        <Metric label="Alpha" value={`${data.alphaPct}%`} color="text-red-600" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
        <Metric label="Total" value={data.total} />
        <Metric label="Hadir" value={data.hadir} color="text-green-600" />
        <Metric label="Sakit" value={data.sakit} color="text-yellow-600" />
        <Metric label="Izin" value={data.izin} color="text-blue-600" />
        <Metric label="Telat" value={data.telat} color="text-orange-600" />
        <Metric label="Alpha" value={data.alpha} color="text-red-600" />
      </div>
    </div>
  );
}

// Bar proporsi Hadir/Sakit/Izin/Alpha (visualisasi ringan tanpa library).
function ProportionBar({ data }: { data: ReportResult }) {
  if (data.total === 0) return null;
  const seg = [
    { v: data.hadir, c: 'bg-green-500', label: 'Hadir' },
    { v: data.sakit, c: 'bg-yellow-500', label: 'Sakit' },
    { v: data.izin, c: 'bg-blue-500', label: 'Izin' },
    { v: data.telat, c: 'bg-orange-500', label: 'Telat' },
    { v: data.alpha, c: 'bg-red-500', label: 'Alpha' },
  ].filter((s) => s.v > 0);
  return (
    <div>
      <div className="flex h-4 w-full overflow-hidden rounded-full">
        {seg.map((s) => (
          <div
            key={s.label}
            className={s.c}
            style={{ width: `${(s.v / data.total) * 100}%` }}
            title={`${s.label}: ${s.v}`}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
        {seg.map((s) => (
          <span key={s.label} className="flex items-center gap-1">
            <span className={`inline-block h-2 w-2 rounded-full ${s.c}`} />
            {s.label} ({s.v})
          </span>
        ))}
      </div>
    </div>
  );
}

function ExcelExport() {
  const classes = useClasses();
  const toast = useToast();
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function onDownload() {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (classId) p.set('classId', classId);
      if (subjectId) p.set('subjectId', subjectId);
      if (start) p.set('start', start);
      if (end) p.set('end', end);
      if (status) p.set('status', status);
      const qs = p.toString();
      await downloadFile(
        `/reports/export${qs ? `?${qs}` : ''}`,
        `absensi-${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
      toast.push('success', 'File Excel terunduh');
    } catch (e) {
      toast.push('error', apiError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card mb-6 flex flex-wrap items-end gap-3">
      <div>
        <label className="label">Unduh Excel — Kelas</label>
        <select
          className="input"
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
        >
          <option value="">Semua kelas</option>
          {classes.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <SubjectSelect value={subjectId} onChange={setSubjectId} />
      <div>
        <label className="label">Dari Tanggal</label>
        <input
          type="date"
          className="input"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Sampai Tanggal</label>
        <input
          type="date"
          className="input"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Status</label>
        <select
          className="input"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Semua status</option>
          <option value="HADIR">Hadir</option>
          <option value="SAKIT">Sakit</option>
          <option value="IZIN">Izin</option>
          <option value="TELAT">Telat</option>
          <option value="ALPHA">Alpha</option>
        </select>
      </div>
      <button className="btn-primary" disabled={loading} onClick={onDownload}>
        {loading ? 'Menyiapkan…' : '⬇ Unduh Excel'}
      </button>
    </div>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('general');

  return (
    <div>
      <PageHeader
        title="Laporan Kehadiran"
        subtitle="Persentase umum, per kelas, dan individual"
      />
      <ExcelExport />
      <div className="mb-6 flex gap-2">
        {(
          [
            ['general', 'Umum'],
            ['class', 'Per Kelas'],
            ['individual', 'Individual'],
          ] as [Tab, string][]
        ).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              'rounded-md px-4 py-2 text-sm font-medium ' +
              (tab === t
                ? 'bg-brand-600 text-white'
                : 'border border-gray-300 bg-white text-gray-600')
            }
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'general' && <GeneralReport />}
      {tab === 'class' && <ClassReport />}
      {tab === 'individual' && <IndividualReport />}
    </div>
  );
}

function GeneralReport() {
  const [period, setPeriod] = useState('month');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [subjectId, setSubjectId] = useState('');
  const isTermBased = ['mid', 'semester', 'year'].includes(period);

  const q = useQuery({
    queryKey: ['report-general', period, date, subjectId],
    queryFn: async () => {
      const p = new URLSearchParams({ period });
      if (!isTermBased) p.set('date', date);
      if (subjectId) p.set('subjectId', subjectId);
      return (await api.get<ReportResult>(`/reports/general?${p}`)).data;
    },
  });

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Periode</label>
          <select
            className="input"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="day">Harian</option>
            <option value="week">Mingguan</option>
            <option value="month">Bulanan</option>
            <option value="mid">Mid Semester</option>
            <option value="semester">Semester</option>
            <option value="year">Tahunan</option>
          </select>
        </div>
        {!isTermBased && (
          <div>
            <label className="label">Tanggal Acuan</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        )}
        <SubjectSelect value={subjectId} onChange={setSubjectId} />
      </div>
      {q.data && <ResultView data={q.data} />}
      <TrendChart subjectId={subjectId || undefined} days={14} />
    </div>
  );
}

function ClassReport() {
  const classes = useClasses();
  const [classId, setClassId] = useState('');
  const [period, setPeriod] = useState('month');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [subjectId, setSubjectId] = useState('');

  const q = useQuery({
    queryKey: ['report-class', classId, period, date, subjectId],
    enabled: !!classId,
    queryFn: async () => {
      const p = new URLSearchParams({ period, date });
      if (subjectId) p.set('subjectId', subjectId);
      return (await api.get<ReportResult>(`/reports/class/${classId}?${p}`)).data;
    },
  });

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Kelas</label>
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
        </div>
        <div>
          <label className="label">Periode</label>
          <select
            className="input"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="day">Harian</option>
            <option value="week">Mingguan</option>
            <option value="month">Bulanan</option>
          </select>
        </div>
        <div>
          <label className="label">Tanggal Acuan</label>
          <input
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <SubjectSelect value={subjectId} onChange={setSubjectId} />
      </div>
      {q.data && <ResultView data={q.data} />}
      {classId && (
        <TrendChart
          classId={classId}
          subjectId={subjectId || undefined}
          days={14}
        />
      )}
    </div>
  );
}

function IndividualReport() {
  const [studentId, setStudentId] = useState('');
  const [period, setPeriod] = useState('semester');
  const [termId, setTermId] = useState('');
  const [subjectId, setSubjectId] = useState('');

  const students = useQuery({
    queryKey: ['students-all'],
    queryFn: async () =>
      (await api.get<Paginated<Student>>('/students?limit=300')).data.data,
  });
  const terms = useQuery({
    queryKey: ['terms'],
    queryFn: async () => (await api.get<Term[]>('/terms')).data,
  });

  const q = useQuery({
    queryKey: ['report-student', studentId, period, termId, subjectId],
    enabled: !!studentId,
    queryFn: async () => {
      const p = new URLSearchParams({ period });
      if (termId) p.set('termId', termId);
      if (subjectId) p.set('subjectId', subjectId);
      return (await api.get<ReportResult>(`/reports/student/${studentId}?${p}`))
        .data;
    },
  });

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Murid</label>
          <select
            className="input min-w-[220px]"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          >
            <option value="">— Pilih murid —</option>
            {students.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} {s.class?.name ? `(${s.class.name})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Periode</label>
          <select
            className="input"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="triwulan">Triwulan</option>
            <option value="semester">Semester</option>
            <option value="year">Tahunan</option>
          </select>
        </div>
        <div>
          <label className="label">Term (opsional)</label>
          <select
            className="input"
            value={termId}
            onChange={(e) => setTermId(e.target.value)}
          >
            <option value="">Otomatis (periode aktif)</option>
            {terms.data?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <SubjectSelect value={subjectId} onChange={setSubjectId} />
      </div>
      {q.data && <ResultView data={q.data} />}
      {studentId && (
        <TrendChart
          studentId={studentId}
          subjectId={subjectId || undefined}
          days={14}
        />
      )}
    </div>
  );
}
