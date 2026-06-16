import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiError } from '../lib/api';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', { fullName, email, phone, password });
      setDone(true);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-white p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-brand-600">SIPRES Kartini</h1>
          <p className="text-sm text-gray-500">Pendaftaran Orang Tua / Wali</p>
        </div>

        {done ? (
          <div className="card space-y-4 text-center">
            <div className="text-4xl">📧</div>
            <h2 className="text-lg font-semibold">Cek email Anda</h2>
            <p className="text-sm text-gray-600">
              Kami telah mengirim tautan verifikasi ke <b>{email}</b>. Klik
              tautan itu untuk mengaktifkan akun, lalu login. (Cek folder Spam
              bila tidak ada di Inbox.)
            </p>
            <Link to="/login" className="btn-primary inline-block">
              Kembali ke Login
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="card space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <div>
              <label className="label">Nama Lengkap</label>
              <input
                className="input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@contoh.com"
                required
              />
            </div>
            <div>
              <label className="label">No. HP (opsional)</label>
              <input
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812xxxxxxx"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? 'Memproses…' : 'Daftar'}
            </button>
            <p className="text-center text-sm text-gray-500">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-brand-600 hover:underline">
                Masuk
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
