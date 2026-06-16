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
import type { ReactElement } from 'react';

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
      <Route
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/classes" element={<ClassesPage />} />
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
