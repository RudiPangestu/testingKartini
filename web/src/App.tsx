import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth';
import type { Role } from './lib/types';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import ClassesPage from './pages/ClassesPage';
import StudentsPage from './pages/StudentsPage';
import SubjectsPage from './pages/SubjectsPage';
import SchedulesPage from './pages/SchedulesPage';
import EventsPage from './pages/EventsPage';
import TermsPage from './pages/TermsPage';
import AttendancePage from './pages/AttendancePage';
import ReportsPage from './pages/ReportsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import SettingsPage from './pages/SettingsPage';
import FamilyHomePage from './pages/FamilyHomePage';
import FamilyReportsPage from './pages/FamilyReportsPage';
import AgendaPage from './pages/AgendaPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import BukuBatasPage from './pages/BukuBatasPage';
import BukuBatasCetakPage from './pages/BukuBatasCetakPage';
import type { ReactElement } from 'react';

// Beranda berbeda menurut peran: staf melihat dasbor sekolah, orang tua/murid
// melihat ringkasan kehadiran anak/dirinya.
function HomePage() {
  const role = useAuth((s) => s.user?.role);
  if (role === 'ORTU' || role === 'MURID') return <FamilyHomePage />;
  return <DashboardPage />;
}

function Protected({
  children,
  roles,
}: {
  children: ReactElement;
  roles?: Role[];
}) {
  const user = useAuth((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  const user = useAuth((s) => s.user);

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/" replace /> : <RegisterPage />}
      />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      {/* Halaman cetak buku batas: full-page tanpa sidebar (untuk print/PDF). */}
      <Route
        path="/buku-batas/cetak"
        element={
          <Protected roles={['ADMIN', 'GURU']}>
            <BukuBatasCetakPage />
          </Protected>
        }
      />
      <Route
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route
          path="/attendance"
          element={
            <Protected roles={['ADMIN', 'GURU']}>
              <AttendancePage />
            </Protected>
          }
        />
        <Route
          path="/reports"
          element={
            <Protected roles={['ADMIN', 'GURU']}>
              <ReportsPage />
            </Protected>
          }
        />
        <Route
          path="/students"
          element={
            <Protected roles={['ADMIN', 'GURU']}>
              <StudentsPage />
            </Protected>
          }
        />
        <Route
          path="/classes"
          element={
            <Protected roles={['ADMIN', 'GURU']}>
              <ClassesPage />
            </Protected>
          }
        />
        <Route
          path="/buku-batas"
          element={
            <Protected roles={['ADMIN', 'GURU']}>
              <BukuBatasPage />
            </Protected>
          }
        />
        <Route
          path="/rekap"
          element={
            <Protected roles={['ORTU', 'MURID']}>
              <FamilyReportsPage />
            </Protected>
          }
        />
        <Route
          path="/agenda"
          element={
            <Protected roles={['ORTU', 'MURID']}>
              <AgendaPage />
            </Protected>
          }
        />
        <Route
          path="/notifikasi"
          element={
            <Protected roles={['ORTU', 'MURID']}>
              <NotificationsPage />
            </Protected>
          }
        />
        <Route
          path="/profil"
          element={
            <Protected roles={['ORTU', 'MURID']}>
              <ProfilePage />
            </Protected>
          }
        />
        <Route
          path="/subjects"
          element={
            <Protected roles={['ADMIN']}>
              <SubjectsPage />
            </Protected>
          }
        />
        <Route
          path="/schedules"
          element={
            <Protected roles={['ADMIN']}>
              <SchedulesPage />
            </Protected>
          }
        />
        <Route
          path="/events"
          element={
            <Protected roles={['ADMIN']}>
              <EventsPage />
            </Protected>
          }
        />
        <Route
          path="/terms"
          element={
            <Protected roles={['ADMIN']}>
              <TermsPage />
            </Protected>
          }
        />
        <Route
          path="/announcements"
          element={
            <Protected roles={['ADMIN']}>
              <AnnouncementsPage />
            </Protected>
          }
        />
        <Route
          path="/settings"
          element={
            <Protected roles={['ADMIN']}>
              <SettingsPage />
            </Protected>
          }
        />
        <Route
          path="/users"
          element={
            <Protected roles={['ADMIN']}>
              <UsersPage />
            </Protected>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
