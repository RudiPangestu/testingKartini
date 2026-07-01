import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { EmptyState, PageHeader, Spinner } from '../components/ui';
import type { NotificationItem } from '../lib/types';

export default function NotificationsPage() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ['notifications'],
    queryFn: async () =>
      (await api.get<NotificationItem[]>('/notifications')).data,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div>
      <PageHeader
        title="Notifikasi"
        subtitle="Pemberitahuan kehadiran & pengumuman sekolah"
      />

      {list.isLoading ? (
        <Spinner />
      ) : !list.data?.length ? (
        <EmptyState message="Belum ada notifikasi." />
      ) : (
        <div className="space-y-3">
          {list.data.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.isRead && markRead.mutate(n.id)}
              className={
                'card block w-full border-l-4 text-left transition-colors ' +
                (n.isRead
                  ? 'border-l-gray-200'
                  : 'border-l-brand-600 hover:bg-brand-50/40')
              }
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-gray-900">{n.title}</span>
                {!n.isRead && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" />
                )}
              </div>
              <p className="mt-1 text-sm text-gray-700">{n.body}</p>
              <div className="mt-2 text-xs text-gray-400">
                {new Date(n.sentAt).toLocaleString('id-ID')}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
