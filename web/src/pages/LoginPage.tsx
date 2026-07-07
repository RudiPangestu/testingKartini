import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, apiError } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { AuthResponse } from '../lib/types';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuth((s) => s.setAuth);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post<AuthResponse>('/auth/login', {
        email,
        password,
      });
      // Semua peran (Admin, Guru, Orang Tua, Murid) dapat masuk lewat web.
      // Halaman ditentukan menurut peran setelah login.
      setAuth(res.data);
      navigate('/');
    } catch (err) {
      setError(apiError(err));
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-white p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-brand-600">SIPRES Kartini</h1>
          <p className="text-sm text-gray-500">
            Sistem Presensi &amp; Kegiatan Sekolah
          </p>
        </div>
        <form onSubmit={onSubmit} className="card space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@kartini.sch.id"
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Memproses…' : 'Masuk'}
          </button>
          <p className="text-center text-sm text-gray-500">
            Orang tua/wali baru?{' '}
            <Link to="/register" className="text-brand-600 hover:underline">
              Daftar di sini
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
