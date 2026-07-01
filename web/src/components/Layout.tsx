import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState, type ReactNode } from 'react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import type { Role } from '../lib/types';

interface NavItem {
  to: string;
  label: string;
  roles: Role[];
  icon: ReactNode;
}

/** Ikon garis (outline) ringkas, gaya konsisten. */
function I({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0"
    >
      <path d={d} />
    </svg>
  );
}

const NAV: NavItem[] = [
  // --- Orang tua & murid ---
  { to: '/', label: 'Beranda', roles: ['ORTU', 'MURID'], icon: <I d="M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" /> },
  { to: '/rekap', label: 'Rekap Kehadiran', roles: ['ORTU', 'MURID'], icon: <I d="M3 3v18h18M7 14l3-3 3 3 5-6" /> },
  { to: '/agenda', label: 'Agenda Kegiatan', roles: ['ORTU', 'MURID'], icon: <I d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 1118 0zM12 7v6M9 10h6" /> },
  { to: '/notifikasi', label: 'Notifikasi', roles: ['ORTU', 'MURID'], icon: <I d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" /> },
  { to: '/profil', label: 'Profil', roles: ['ORTU', 'MURID'], icon: <I d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" /> },
  // --- Admin & guru ---
  { to: '/', label: 'Dashboard', roles: ['ADMIN', 'GURU'], icon: <I d="M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" /> },
  { to: '/attendance', label: 'Presensi', roles: ['ADMIN', 'GURU'], icon: <I d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /> },
  { to: '/reports', label: 'Laporan', roles: ['ADMIN', 'GURU'], icon: <I d="M3 3v18h18M7 14l3-3 3 3 5-6" /> },
  { to: '/students', label: 'Murid', roles: ['ADMIN', 'GURU'], icon: <I d="M17 20v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 10a4 4 0 100-8 4 4 0 000 8M23 20v-2a4 4 0 00-3-3.87M16 2.13a4 4 0 010 7.75" /> },
  { to: '/classes', label: 'Kelas', roles: ['ADMIN', 'GURU'], icon: <I d="M3 7l9-4 9 4-9 4-9-4zM3 7v6M21 7v6M7 9v5a5 3 0 0010 0V9" /> },
  { to: '/buku-batas', label: 'Buku Batas', roles: ['ADMIN', 'GURU'], icon: <I d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2zM9 7h7M9 11h7" /> },
  { to: '/subjects', label: 'Mata Pelajaran', roles: ['ADMIN'], icon: <I d="M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /> },
  { to: '/schedules', label: 'Jadwal', roles: ['ADMIN'], icon: <I d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" /> },
  { to: '/events', label: 'Kegiatan', roles: ['ADMIN'], icon: <I d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 1118 0zM12 7v6M9 10h6" /> },
  { to: '/terms', label: 'Periode', roles: ['ADMIN'], icon: <I d="M12 8v4l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
  { to: '/announcements', label: 'Pengumuman', roles: ['ADMIN'], icon: <I d="M3 11l18-5v12L3 14v-3zM11.6 16.8a3 3 0 11-5.8-1.6" /> },
  { to: '/settings', label: 'Pengaturan', roles: ['ADMIN'], icon: <I d="M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 008 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 8.6 1.65 1.65 0 004.27 6.78l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.2.61.76 1 1.41 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" /> },
  { to: '/users', label: 'Pengguna', roles: ['ADMIN'], icon: <I d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM19 8v6M22 11h-6" /> },
];

function initials(name?: string) {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const items = NAV.filter((n) => user && n.roles.includes(user.role));
  const [open, setOpen] = useState(false);
  const isFamily = user?.role === 'ORTU' || user?.role === 'MURID';
  const panelLabel = isFamily ? 'Portal Orang Tua & Murid' : 'Panel Admin & Guru';

  async function handleLogout() {
    const refreshToken = useAuth.getState().refreshToken;
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken }).catch(() => {});
    }
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar (hanya mobile) */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
        <button
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100"
          aria-label="Buka menu"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            className="h-6 w-6"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-700 via-brand-600 to-accent-500 text-xs font-bold text-white">
          SK
        </div>
        <span className="font-bold text-gray-900">SIPRES Kartini</span>
      </header>

      {/* Backdrop saat drawer terbuka (mobile) */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-200 lg:translate-x-0 ' +
          (open ? 'translate-x-0' : '-translate-x-full')
        }
      >
        {/* Header brand */}
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-700 via-brand-600 to-accent-500 text-sm font-bold text-white shadow-sm">
            SK
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-bold text-gray-900">
              SIPRES Kartini
            </div>
            <div className="text-xs text-gray-400">{panelLabel}</div>
          </div>
        </div>

        {/* Navigasi */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
          <div className="px-3 pb-2 pt-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Menu
          </div>
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ' +
                (isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-brand-600" />
                  )}
                  <span
                    className={
                      isActive
                        ? 'text-brand-600'
                        : 'text-gray-400 group-hover:text-gray-500'
                    }
                  >
                    {it.icon}
                  </span>
                  {it.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Pengguna */}
        <div className="border-t border-gray-100 p-3">
          <div className="mb-2 flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
              {initials(user?.fullName)}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm font-semibold text-gray-800">
                {user?.fullName}
              </div>
              <div className="text-xs text-gray-400">{user?.role}</div>
            </div>
          </div>
          <button className="btn-ghost w-full" onClick={handleLogout}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Keluar
          </button>
        </div>
      </aside>

      <main className="overflow-x-hidden lg:pl-64">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
