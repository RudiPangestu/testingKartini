import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { TrendResult } from '../lib/types';

/**
 * Grafik tren kehadiran per hari (stacked bar ringan, tanpa library chart).
 * Salah satu dari studentId/classId opsional; tanpa keduanya = umum (sekolah).
 */
export default function TrendChart({
  studentId,
  classId,
  subjectId,
  days = 14,
}: {
  studentId?: string;
  classId?: string;
  subjectId?: string;
  days?: number;
}) {
  const q = useQuery({
    queryKey: ['trend', studentId ?? '', classId ?? '', subjectId ?? '', days],
    queryFn: async () => {
      const p = new URLSearchParams({ days: String(days) });
      if (studentId) p.set('studentId', studentId);
      if (classId) p.set('classId', classId);
      if (subjectId) p.set('subjectId', subjectId);
      return (await api.get<TrendResult>(`/reports/trend?${p}`)).data;
    },
  });

  if (!q.data) return null;
  const max = Math.max(1, ...q.data.points.map((p) => p.total));

  const segs: [keyof typeof colorMap, string][] = [
    ['alpha', 'Alpha'],
    ['izin', 'Izin'],
    ['sakit', 'Sakit'],
    ['hadir', 'Hadir'],
  ];

  return (
    <div className="card">
      <div className="mb-3 text-sm font-semibold text-gray-700">
        Tren {days} hari terakhir
      </div>
      <div className="flex h-40 items-end gap-1">
        {q.data.points.map((p) => (
          <div
            key={p.date}
            className="flex flex-1 flex-col justify-end"
            title={`${p.date} — Hadir ${p.hadir}, Sakit ${p.sakit}, Izin ${p.izin}, Alpha ${p.alpha}`}
          >
            <div
              className="flex flex-col-reverse"
              style={{ height: `${(p.total / max) * 100}%` }}
            >
              {segs.map(([k, _]) =>
                p[k] > 0 ? (
                  <div
                    key={k}
                    className={colorMap[k]}
                    style={{ height: `${(p[k] / p.total) * 100}%` }}
                  />
                ) : null,
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
        {segs
          .slice()
          .reverse()
          .map(([k, label]) => (
            <span key={k} className="flex items-center gap-1">
              <span className={`inline-block h-2 w-2 rounded-full ${colorMap[k]}`} />
              {label}
            </span>
          ))}
      </div>
    </div>
  );
}

const colorMap = {
  hadir: 'bg-green-500',
  sakit: 'bg-yellow-500',
  izin: 'bg-blue-500',
  alpha: 'bg-red-500',
} as const;
