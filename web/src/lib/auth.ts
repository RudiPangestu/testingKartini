import { create } from 'zustand';
import type { User } from './types';

const STORAGE_KEY = 'sipres-auth';

interface PersistedAuth {
  accessToken: string;
  refreshToken: string;
  user: User;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (data: PersistedAuth) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

function load(): PersistedAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedAuth) : null;
  } catch {
    return null;
  }
}

const initial = load();

export const useAuth = create<AuthState>((set, get) => ({
  user: initial?.user ?? null,
  accessToken: initial?.accessToken ?? null,
  refreshToken: initial?.refreshToken ?? null,
  setAuth: (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    set({
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
  },
  setTokens: (accessToken, refreshToken) => {
    const user = get().user;
    if (user) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ user, accessToken, refreshToken }),
      );
    }
    set({ accessToken, refreshToken });
  },
  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));

// Akses non-react untuk interceptor axios.
export const authStore = {
  get: () => useAuth.getState(),
};
