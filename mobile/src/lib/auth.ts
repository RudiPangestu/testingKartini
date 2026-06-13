import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { User } from './types';

const STORAGE_KEY = 'sipres-auth';

interface Persisted {
  accessToken: string;
  refreshToken: string;
  user: User;
}

interface AuthState {
  hydrated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  hydrate: () => Promise<void>;
  setAuth: (data: Persisted) => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

async function persist(data: Persisted | null) {
  if (data) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  else await AsyncStorage.removeItem(STORAGE_KEY);
}

export const useAuth = create<AuthState>((set, get) => ({
  hydrated: false,
  user: null,
  accessToken: null,
  refreshToken: null,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw) as Persisted;
        set({
          user: d.user,
          accessToken: d.accessToken,
          refreshToken: d.refreshToken,
        });
      }
    } finally {
      set({ hydrated: true });
    }
  },

  setAuth: async (data) => {
    await persist(data);
    set({
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
  },

  setTokens: async (accessToken, refreshToken) => {
    const user = get().user;
    if (user) await persist({ user, accessToken, refreshToken });
    set({ accessToken, refreshToken });
  },

  logout: async () => {
    await persist(null);
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));
