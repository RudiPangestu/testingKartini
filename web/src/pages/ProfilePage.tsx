import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { api, apiError } from '../lib/api';
import { Field, PageHeader } from '../components/ui';
import type { User } from '../lib/types';

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Administrator',
  GURU: 'Guru',
  ORTU: 'Orang Tua / Wali',
  MURID: 'Murid',
};

function initials(name?: string) {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (newPassword && newPassword !== confirmPassword) {
      setMsg({ ok: false, text: 'Konfirmasi password baru tidak cocok.' });
      return;
    }

    const payload: Record<string, string> = {
      fullName: fullName.trim(),
      phone: phone.trim(),
    };
    if (newPassword) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    setSaving(true);
    try {
      const { data } = await api.patch<User>('/auth/me', payload);
      setUser({ ...(user as User), ...data });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMsg({ ok: true, text: 'Profil berhasil diperbarui.' });
    } catch (err) {
      setMsg({ ok: false, text: apiError(err) });
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    const refreshToken = useAuth.getState().refreshToken;
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken }).catch(() => {});
    }
    logout();
    navigate('/login');
  }

  return (
    <div>
      <PageHeader title="Profil" subtitle="Kelola informasi akun Anda" />

      <div className="card mb-6 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">
          {initials(user?.fullName)}
        </div>
        <div className="min-w-0">
          <div className="truncate text-xl font-bold text-gray-900">
            {user?.fullName}
          </div>
          <div className="text-sm font-semibold text-brand-600">
            {ROLE_LABEL[user?.role ?? ''] ?? user?.role}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="card">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            Data Diri
          </h2>
          <Field label="Nama Lengkap">
            <input
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </Field>
          <Field label="Email">
            <input
              className="input bg-gray-50 text-gray-500"
              value={user?.email ?? ''}
              disabled
            />
            <p className="mt-1 text-xs text-gray-400">
              Email tidak dapat diubah. Hubungi admin bila perlu mengganti.
            </p>
          </Field>
          <Field label="Telepon">
            <input
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
            />
          </Field>
        </div>

        <div className="card">
          <h2 className="mb-1 text-base font-semibold text-gray-900">
            Ganti Password
          </h2>
          <p className="mb-4 text-xs text-gray-400">
            Kosongkan bila tidak ingin mengubah password.
          </p>
          <Field label="Password Saat Ini">
            <input
              type="password"
              className="input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </Field>
          <Field label="Password Baru">
            <input
              type="password"
              className="input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Minimal 6 karakter"
            />
          </Field>
          <Field label="Konfirmasi Password Baru">
            <input
              type="password"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
        </div>

        {msg && (
          <div
            className={
              'rounded-lg px-4 py-3 text-sm ' +
              (msg.ok
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700')
            }
          >
            {msg.text}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={handleLogout}
          >
            Keluar
          </button>
        </div>
      </form>

      <p className="mt-8 text-center text-xs text-gray-400">SIPRES Kartini</p>
    </div>
  );
}
