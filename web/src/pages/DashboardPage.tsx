import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { PageHeader, Spinner } from '../components/ui';
import { useAuth } from '../lib/auth';
import type { Paginated, ReportResult, SchoolClass, Student } from '../lib/types';

function StatCard({
  label,
  value,
  hint,
  color = 'text-gray-900',
}: {
  label: string;
  value: string | number;
  hint?: string;
  color?: string;
}) {
  return (
    <div className="card">
      <div className="text-sm text-gray-500">{label}</div>
      <div className={'mt-2 text-3xl font-bold ' + color}>{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-400">{hint}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuth((s) => s.user);

  const report = useQuery({
    queryKey: ['report-general', 'month'],
    queryFn: async () =>
      (await api.get<ReportResult>('/reports/general?period=month')).data,
  });
  const classes = useQuery({
    queryKey: ['classes-count'],
    queryFn: async () =>
      (await api.get<Paginated<SchoolClass>>('/classes?limit=1')).data.meta.total,
  });
  const students = useQuery({
    queryKey: ['students-count'],
    queryFn: async () =>
      (await api.get<Paginated<Student>>('/students?limit=1')).data.meta.total,
  });
  const unmarked = useQuery({
    queryKey: ['unmarked-today'],
    queryFn: async () =>
      (await api.get<unknown[]>('/attendance/unmarked')).data.length,
  });

  return (
    <div>
      <PageHeader
        title={`Selamat datang, ${user?.fullName ?? ''}`}
        subtitle="Ringkasan kehadiran bulan ini"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Jumlah Kelas" value={classes.data ?? '—'} />
        <StatCard label="Jumlah Murid" value={students.data ?? '—'} />
        <StatCard
          label="Hadir Efektif (bln ini)"
          value={report.data ? `${report.data.hadirEfektifPct}%` : '—'}
          color="text-green-600"
          hint="Hanya status HADIR"
        />
        <StatCard
          label="Belum diabsen hari ini"
          value={unmarked.data ?? '—'}
          color={unmarked.data ? 'text-amber-600' : 'text-green-600'}
          hint="Jadwal tanpa presensi"
        />
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Alpha (bln ini)"
          value={report.data ? `${report.data.alphaPct}%` : '—'}
          color="text-red-600"
          hint="Tanpa keterangan"
        />
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Rekap Kehadiran Bulan Ini</h2>
      {report.isLoading ? (
        <Spinner />
      ) : report.data ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Hadir" value={report.data.hadir} color="text-green-600" />
          <StatCard label="Sakit" value={report.data.sakit} color="text-yellow-600" />
          <StatCard label="Izin" value={report.data.izin} color="text-blue-600" />
          <StatCard label="Alpha" value={report.data.alpha} color="text-red-600" />
        </div>
      ) : (
        <div className="card text-sm text-gray-500">Belum ada data presensi.</div>
      )}

      <div className="card mt-6">
        <div className="text-sm text-gray-600">
          <span className="font-semibold">Kehadiran Sah</span> (Hadir + Sakit +
          Izin) bulan ini:{' '}
          <span className="font-semibold text-brand-600">
            {report.data ? `${report.data.kehadiranSahPct}%` : '—'}
          </span>
          . Sakit &amp; Izin tidak dihitung sebagai Alpha sesuai kebijakan sekolah.
        </div>
      </div>
    </div>
  );
}
