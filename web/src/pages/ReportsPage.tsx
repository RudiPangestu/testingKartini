import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { PageHeader } from '../components/ui';
import { useClasses } from '../lib/hooks';
import type { Paginated, ReportResult, Student, Term } from '../lib/types';

type Tab = 'general' | 'class' | 'individual';

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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Metric label="Total" value={data.total} />
        <Metric label="Hadir" value={data.hadir} color="text-green-600" />
        <Metric label="Sakit" value={data.sakit} color="text-yellow-600" />
        <Metric label="Izin" value={data.izin} color="text-blue-600" />
        <Metric label="Alpha" value={data.alpha} color="text-red-600" />
      </div>
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
  const isTermBased = ['mid', 'semester', 'year'].includes(period);

  const q = useQuery({
    queryKey: ['report-general', period, date],
    queryFn: async () => {
      const p = new URLSearchParams({ period });
      if (!isTermBased) p.set('date', date);
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
      </div>
      {q.data && <ResultView data={q.data} />}
    </div>
  );
}

function ClassReport() {
  const classes = useClasses();
  const [classId, setClassId] = useState('');
  const [period, setPeriod] = useState('month');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const q = useQuery({
    queryKey: ['report-class', classId, period, date],
    enabled: !!classId,
    queryFn: async () => {
      const p = new URLSearchParams({ period, date });
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
      </div>
      {q.data && <ResultView data={q.data} />}
    </div>
  );
}

function IndividualReport() {
  const [studentId, setStudentId] = useState('');
  const [period, setPeriod] = useState('semester');
  const [termId, setTermId] = useState('');

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
    queryKey: ['report-student', studentId, period, termId],
    enabled: !!studentId,
    queryFn: async () => {
      const p = new URLSearchParams({ period });
      if (termId) p.set('termId', termId);
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
      </div>
      {q.data && <ResultView data={q.data} />}
    </div>
  );
}
