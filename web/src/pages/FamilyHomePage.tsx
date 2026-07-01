import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useChild } from '../lib/child';
import ChildPicker, { useMyStudents } from '../components/ChildPicker';
import { EmptyState, PageHeader, Spinner, StatusBadge } from '../components/ui';
import { useAuth } from '../lib/auth';
import type {
  AttendanceHistoryItem,
  ReportResult,
  Student,
} from '../lib/types';

function Metric({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="card text-center">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={'mt-1.5 text-2xl font-extrabold ' + color}>{value}</div>
    </div>
  );
}

export default function FamilyHomePage() {
  const user = useAuth((s) => s.user);
  const students = useMyStudents();
  const studentId = useChild((s) => s.studentId);
  const current = students.data?.find((s: Student) => s.id === studentId);

  const report = useQuery({
    queryKey: ['home-report', studentId],
    enabled: !!studentId,
    queryFn: async () =>
      (
        await api.get<ReportResult>(
          `/reports/student/${studentId}?period=semester`,
        )
      ).data,
  });

  const history = useQuery({
    queryKey: ['home-history', studentId],
    enabled: !!studentId,
    queryFn: async () =>
      (
        await api.get<AttendanceHistoryItem[]>(
          `/attendance/student/${studentId}`,
        )
      ).data,
  });

  if (students.isLoading) return <Spinner />;
  if (!students.data?.length)
    return (
      <div>
        <PageHeader title={`Selamat datang, ${user?.fullName ?? ''}`} />
        <EmptyState message="Belum ada data murid tertaut ke akun Anda. Hubungi pihak sekolah." />
      </div>
    );

  return (
    <div>
      <PageHeader
        title={`Selamat datang, ${user?.fullName ?? ''}`}
        subtitle="Ringkasan kehadiran semester ini"
      />

      <ChildPicker students={students.data} />

      <div className="card mb-6">
        <div className="text-xl font-bold text-gray-900">
          {current?.fullName}
        </div>
        <div className="mt-1 text-sm text-gray-500">
          {current?.class?.name ?? 'Tanpa kelas'} · NISN {current?.nisn}
        </div>
      </div>

      <h2 className="mb-3 text-lg font-semibold">Ringkasan Semester Ini</h2>
      {report.isLoading ? (
        <Spinner />
      ) : report.data ? (
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
      ) : (
        <div className="card text-sm text-gray-500">Belum ada data.</div>
      )}

      <h2 className="mb-3 mt-8 text-lg font-semibold">
        Riwayat Kehadiran Terbaru
      </h2>
      {history.isLoading ? (
        <Spinner />
      ) : !history.data?.length ? (
        <div className="card text-sm text-gray-500">Belum ada riwayat.</div>
      ) : (
        <div className="space-y-2.5">
          {history.data.slice(0, 20).map((h) => (
            <div
              key={h.id}
              className="card flex items-center justify-between gap-4 py-3.5"
            >
              <div className="min-w-0">
                <div className="truncate font-semibold text-gray-800">
                  {h.session.schedule?.subject.name ??
                    h.session.event?.title ??
                    'Kegiatan'}
                </div>
                <div className="text-sm text-gray-500">
                  {h.session.sessionDate.slice(0, 10)}
                  {h.note ? ` · ${h.note}` : ''}
                </div>
              </div>
              <StatusBadge status={h.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
