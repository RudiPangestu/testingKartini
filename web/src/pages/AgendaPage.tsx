import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { EmptyState, PageHeader, Spinner } from '../components/ui';
import type { SchoolEvent } from '../lib/types';

export default function AgendaPage() {
  const today = new Date().toISOString().slice(0, 10);
  const events = useQuery({
    queryKey: ['events-upcoming'],
    queryFn: async () =>
      (await api.get<SchoolEvent[]>(`/events?from=${today}`)).data,
  });

  return (
    <div>
      <PageHeader
        title="Agenda Kegiatan"
        subtitle="Kegiatan sekolah yang akan datang"
      />

      {events.isLoading ? (
        <Spinner />
      ) : !events.data?.length ? (
        <EmptyState message="Belum ada kegiatan mendatang." />
      ) : (
        <div className="space-y-3">
          {events.data.map((e) => (
            <div key={e.id} className="card">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-brand-600">
                  {e.eventDate.slice(0, 10)}
                </span>
                <span className="text-sm text-gray-500">
                  {e.startTime}–{e.endTime}
                </span>
              </div>
              <div className="mt-1 text-lg font-bold text-gray-900">
                {e.title}
              </div>
              {e.description && (
                <p className="mt-1 text-sm text-gray-600">{e.description}</p>
              )}
              <div className="mt-2 text-xs text-gray-500">
                {e.location ? `📍 ${e.location}  ` : ''}
                {e.targetClass?.name
                  ? `· Kelas ${e.targetClass.name}`
                  : '· Semua kelas'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
