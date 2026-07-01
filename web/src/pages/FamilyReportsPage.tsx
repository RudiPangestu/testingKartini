import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useChild } from '../lib/child';
import ChildPicker, { useMyStudents } from '../components/ChildPicker';
import { EmptyState, PageHeader, Spinner } from '../components/ui';
import type { ReportResult } from '../lib/types';

const PERIODS: { value: string; label: string }[] = [
  { value: 'triwulan', label: 'Triwulan' },
  { value: 'semester', label: 'Semester' },
  { value: 'year', label: 'Tahunan' },
];

function Metric({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="card text-center">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={'mt-1.5 text-2xl font-extrabold ' + color}>{value}</div>
    </div>
  );
}

// Bar proporsi Hadir/Sakit/Izin/Alpha.
function ProportionBar(props: {
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  total: number;
}) {
  if (props.total === 0) return null;
  const seg = [
    { v: props.hadir, c: 'bg-green-500' },
    { v: props.sakit, c: 'bg-yellow-400' },
    { v: props.izin, c: 'bg-blue-500' },
    { v: props.alpha, c: 'bg-red-500' },
  ].filter((s) => s.v > 0);
  return (
    <div className="mb-5 flex h-3.5 overflow-hidden rounded-full">
      {seg.map((s, i) => (
        <div key={i} className={s.c} style={{ flex: s.v }} />
      ))}
    </div>
  );
}

export default function FamilyReportsPage() {
  const students = useMyStudents();
  const studentId = useChild((s) => s.studentId);
  const [period, setPeriod] = useState('semester');

  const report = useQuery({
    queryKey: ['report', studentId, period],
    enabled: !!studentId,
    queryFn: async () =>
      (
        await api.get<ReportResult>(
          `/reports/student/${studentId}?period=${period}`,
        )
      ).data,
  });

  if (students.isLoading) return <Spinner />;
  if (!students.data?.length)
    return (
      <div>
        <PageHeader title="Rekap Kehadiran" />
        <EmptyState message="Belum ada data murid tertaut ke akun Anda." />
      </div>
    );

  return (
    <div>
      <PageHeader
        title="Rekap Kehadiran"
        subtitle="Rekapitulasi kehadiran per periode"
      />

      <ChildPicker students={students.data} />

      <div className="mb-6 grid grid-cols-3 gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={
              'rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ' +
              (period === p.value
                ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50')
            }
          >
            {p.label}
          </button>
        ))}
      </div>

      {report.isLoading ? (
        <Spinner />
      ) : report.data && report.data.total > 0 ? (
        <>
          {report.data.range && (
            <p className="mb-3 text-sm text-gray-500">
              {report.data.range.start} → {report.data.range.end}
            </p>
          )}
          <ProportionBar
            hadir={report.data.hadir}
            sakit={report.data.sakit}
            izin={report.data.izin}
            alpha={report.data.alpha}
            total={report.data.total}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Metric
              label="Hadir Efektif"
              value={`${report.data.hadirEfektifPct}%`}
              color="text-green-600"
            />
            <Metric
              label="Kehadiran Sah"
              value={`${report.data.kehadiranSahPct}%`}
              color="text-brand-600"
            />
            <Metric
              label="Alpha"
              value={`${report.data.alphaPct}%`}
              color="text-red-600"
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric label="Hadir" value={report.data.hadir} color="text-green-600" />
            <Metric label="Sakit" value={report.data.sakit} color="text-yellow-600" />
            <Metric label="Izin" value={report.data.izin} color="text-blue-600" />
            <Metric label="Alpha" value={report.data.alpha} color="text-red-600" />
          </div>
          <div className="card mt-6 text-sm text-gray-600">
            <span className="font-semibold">Kehadiran Sah</span> mencakup Hadir +
            Sakit + Izin. Sakit &amp; Izin tidak dihitung sebagai Alpha sesuai
            kebijakan sekolah.
          </div>
        </>
      ) : (
        <EmptyState message="Belum ada data kehadiran pada periode ini." />
      )}
    </div>
  );
}
