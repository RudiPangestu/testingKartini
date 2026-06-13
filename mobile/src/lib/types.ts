export type Role = 'ADMIN' | 'GURU' | 'ORTU' | 'MURID';

export interface User {
  id: string;
  role: Role;
  fullName: string;
  email: string | null;
  phone: string | null;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Student {
  id: string;
  nisn: string;
  fullName: string;
  classId: string | null;
  gender: 'L' | 'P' | null;
  class?: { id: string; name: string } | null;
}

export type AttendanceStatus = 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPHA';

export interface AttendanceHistoryItem {
  id: string;
  status: AttendanceStatus;
  note: string | null;
  recordedAt: string;
  session: {
    sessionDate: string;
    schedule?: { subject: { name: string } } | null;
    event?: { title: string } | null;
  };
}

export interface ReportResult {
  range: { start: string; end: string } | null;
  total: number;
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  hadirEfektifPct: number;
  kehadiranSahPct: number;
  alphaPct: number;
  studentName?: string;
}

export interface SchoolEvent {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string | null;
  targetClass?: { id: string; name: string } | null;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  sentAt: string;
}
