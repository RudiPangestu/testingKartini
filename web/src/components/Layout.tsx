import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import type { Role } from '../lib/types';

interface NavItem {
  to: string;
  label: string;
  roles: Role[];
}

const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', roles: ['ADMIN', 'GURU'] },
  { to: '/attendance', label: 'Presensi', roles: ['ADMIN', 'GURU'] },
  { to: '/reports', label: 'Laporan', roles: ['ADMIN', 'GURU'] },
  { to: '/students', label: 'Murid', roles: ['ADMIN', 'GURU'] },
  { to: '/classes', label: 'Kelas', roles: ['ADMIN', 'GURU'] },
  { to: '/subjects', label: 'Mata Pelajaran', roles: ['ADMIN'] },
  { to: '/schedules', label: 'Jadwal', roles: ['ADMIN'] },
  { to: '/events', label: 'Kegiatan', roles: ['ADMIN'] },
  { to: '/terms', label: 'Periode', roles: ['ADMIN'] },
  { to: '/users', label: 'Pengguna', roles: ['ADMIN'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const items = NAV.filter((n) => user && n.roles.includes(user.role));

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col border-r border-gray-200 bg-white">
        <div className="border-b px-5 py-4">
          <div className="text-lg font-bold text-brand-600">SIPRES Kartini</div>
          <div className="text-xs text-gray-400">Panel Admin & Guru</div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to === '/'}
              className={({ isActive }) =>
                'block rounded-md px-3 py-2 text-sm font-medium ' +
                (isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50')
              }
            >
              {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-4">
          <div className="mb-2 text-sm">
            <div className="font-medium text-gray-800">{user?.fullName}</div>
            <div className="text-xs text-gray-400">{user?.role}</div>
          </div>
          <button
            className="btn-ghost w-full"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Keluar
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden p-8">
        <Outlet />
      </main>
    </div>
  );
}
