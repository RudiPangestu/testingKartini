import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { authStore, useAuth } from './auth';

export const api = axios.create({
  baseURL: '/api/v1',
});

// Sisipkan access token ke setiap request
api.interceptors.request.use((config) => {
  const token = authStore.get().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string> | null = null;

async function doRefresh(): Promise<string> {
  const { refreshToken, setTokens, logout } = useAuth.getState();
  if (!refreshToken) {
    logout();
    throw new Error('no refresh token');
  }
  try {
    const res = await axios.post('/api/v1/auth/refresh', { refreshToken });
    const { accessToken, refreshToken: newRefresh } = res.data;
    setTokens(accessToken, newRefresh ?? refreshToken);
    return accessToken;
  } catch (err) {
    logout();
    throw err;
  }
}

// Coba refresh token sekali saat 401
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes('/auth/')
    ) {
      original._retry = true;
      try {
        refreshing = refreshing ?? doRefresh();
        const newToken = await refreshing;
        refreshing = null;
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (e) {
        refreshing = null;
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  },
);

// Helper untuk pesan error backend
export function apiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string | string[] };
    const msg = data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (msg) return msg;
    return err.message;
  }
  return 'Terjadi kesalahan';
}
