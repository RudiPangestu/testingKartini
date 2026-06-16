import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, apiError } from '../lib/api';

type State = 'loading' | 'success' | 'error';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<State>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!token) {
        setState('error');
        setMessage('Tautan tidak valid (token tidak ada).');
        return;
      }
      try {
        const res = await api.get('/auth/verify-email', { params: { token } });
        if (cancelled) return;
        setState('success');
        setMessage(res.data?.message ?? 'Email terverifikasi.');
      } catch (err) {
        if (cancelled) return;
        setState('error');
        setMessage(apiError(err));
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-white p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-brand-600">SIPRES Kartini</h1>
          <p className="text-sm text-gray-500">Verifikasi Email</p>
        </div>
        <div className="card space-y-4 text-center">
          {state === 'loading' && (
            <>
              <div className="text-4xl">⏳</div>
              <p className="text-sm text-gray-600">Memverifikasi…</p>
            </>
          )}
          {state === 'success' && (
            <>
              <div className="text-4xl">✅</div>
              <h2 className="text-lg font-semibold text-green-700">Berhasil</h2>
              <p className="text-sm text-gray-600">{message}</p>
              <Link to="/login" className="btn-primary inline-block">
                Masuk Sekarang
              </Link>
            </>
          )}
          {state === 'error' && (
            <>
              <div className="text-4xl">⚠️</div>
              <h2 className="text-lg font-semibold text-red-700">Gagal</h2>
              <p className="text-sm text-gray-600">{message}</p>
              <Link to="/login" className="text-brand-600 hover:underline">
                Kembali ke Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
