import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiError } from '../lib/api';
import { useToast } from '../components/Toast';
import { Field, PageHeader, Spinner } from '../components/ui';
import type { Setting } from '../lib/types';

const STATUSES = ['HADIR', 'SAKIT', 'IZIN', 'ALPHA'];

export default function SettingsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState<Setting | null>(null);

  const query = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get<Setting>('/settings')).data,
  });

  useEffect(() => {
    if (query.data && !form) setForm(query.data);
  }, [query.data, form]);

  const save = useMutation({
    mutationFn: (s: Setting) => api.put('/settings', s),
    onSuccess: () => {
      toast.push('success', 'Pengaturan tersimpan');
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  if (query.isLoading || !form) return <Spinner />;

  const toggleStatus = (s: string) => {
    const has = form.notifyStatuses.includes(s);
    setForm({
      ...form,
      notifyStatuses: has
        ? form.notifyStatuses.filter((x) => x !== s)
        : [...form.notifyStatuses, s],
    });
  };

  return (
    <div>
      <PageHeader
        title="Pengaturan Notifikasi"
        subtitle="Kanal aktif, status pemicu, template pesan, dan reminder"
      />
      <div className="card max-w-xl space-y-4">
        <div>
          <div className="label">Kanal aktif</div>
          {(
            [
              ['channelPush', 'Push (mobile)'],
              ['channelEmail', 'Email'],
              ['channelWa', 'WhatsApp'],
            ] as [keyof Setting, string][]
          ).map(([key, label]) => (
            <label key={key} className="mr-4 inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form[key] as boolean}
                onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
              />
              {label}
            </label>
          ))}
        </div>

        <div>
          <div className="label">Status yang memicu notifikasi ortu</div>
          {STATUSES.map((s) => (
            <label key={s} className="mr-4 inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.notifyStatuses.includes(s)}
                onChange={() => toggleStatus(s)}
              />
              {s}
            </label>
          ))}
        </div>

        <Field label="Template laporan kehadiran">
          <textarea
            className="input"
            rows={2}
            value={form.attendanceTemplate}
            onChange={(e) =>
              setForm({ ...form, attendanceTemplate: e.target.value })
            }
          />
          <p className="mt-1 text-xs text-gray-400">
            Placeholder: {'{nama} {status} {konteks} {mapel} {kelas} {tanggal}'}
          </p>
        </Field>

        <Field label="Template reminder kegiatan">
          <textarea
            className="input"
            rows={2}
            value={form.reminderTemplate}
            onChange={(e) =>
              setForm({ ...form, reminderTemplate: e.target.value })
            }
          />
          <p className="mt-1 text-xs text-gray-400">
            Placeholder: {'{judul} {jam} {lokasi}'}
          </p>
        </Field>

        <div className="flex items-center gap-6">
          <Field label="Jam reminder (0–23 WIB)">
            <input
              type="number"
              min={0}
              max={23}
              className="input w-24"
              value={form.reminderHour}
              onChange={(e) =>
                setForm({ ...form, reminderHour: Number(e.target.value) })
              }
            />
          </Field>
          <label className="mt-4 inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.weeklyRecapEnabled}
              onChange={(e) =>
                setForm({ ...form, weeklyRecapEnabled: e.target.checked })
              }
            />
            Kirim rekap mingguan (email)
          </label>
        </div>

        <div className="flex justify-end">
          <button
            className="btn-primary"
            disabled={save.isPending}
            onClick={() => save.mutate(form)}
          >
            {save.isPending ? 'Menyimpan…' : 'Simpan Pengaturan'}
          </button>
        </div>
      </div>
    </div>
  );
}
