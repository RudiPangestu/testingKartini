import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api, apiError } from '../lib/api';
import { useToast } from '../components/Toast';
import { useClasses } from '../lib/hooks';
import { Field, PageHeader } from '../components/ui';
import type { Role } from '../lib/types';

type Target = 'ALL' | 'ROLE' | 'CLASS';
const ROLES: Role[] = ['ADMIN', 'GURU', 'ORTU', 'MURID'];

export default function AnnouncementsPage() {
  const toast = useToast();
  const classes = useClasses();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<Target>('ALL');
  const [role, setRole] = useState<Role>('ORTU');
  const [classId, setClassId] = useState('');

  const send = useMutation({
    mutationFn: () =>
      api.post('/notifications/broadcast', {
        title,
        body,
        target,
        ...(target === 'ROLE' ? { role } : {}),
        ...(target === 'CLASS' ? { classId } : {}),
      }),
    onSuccess: (res) => {
      toast.push(
        'success',
        `Pengumuman terkirim ke ${res.data.recipients} penerima`,
      );
      setTitle('');
      setBody('');
    },
    onError: (e) => toast.push('error', apiError(e)),
  });

  const disabled =
    !title ||
    !body ||
    send.isPending ||
    (target === 'CLASS' && !classId);

  return (
    <div>
      <PageHeader
        title="Pengumuman"
        subtitle="Kirim info/pengumuman ke pengguna via push, email, dan inbox"
      />
      <div className="card max-w-xl">
        <Field label="Judul">
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Mis. Libur Hari Raya"
          />
        </Field>
        <Field label="Isi Pengumuman">
          <textarea
            className="input"
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </Field>
        <Field label="Sasaran">
          <select
            className="input"
            value={target}
            onChange={(e) => setTarget(e.target.value as Target)}
          >
            <option value="ALL">Semua pengguna</option>
            <option value="ROLE">Berdasarkan peran</option>
            <option value="CLASS">Satu kelas (ortu &amp; murid)</option>
          </select>
        </Field>
        {target === 'ROLE' && (
          <Field label="Peran">
            <select
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
        )}
        {target === 'CLASS' && (
          <Field label="Kelas">
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
          </Field>
        )}
        <div className="mt-2 flex justify-end">
          <button
            className="btn-primary"
            disabled={disabled}
            onClick={() => send.mutate()}
          >
            {send.isPending ? 'Mengirim…' : 'Kirim Pengumuman'}
          </button>
        </div>
      </div>
    </div>
  );
}
