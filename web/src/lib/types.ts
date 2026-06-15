export type Role = 'ADMIN' | 'GURU' | 'ORTU' | 'MURID';

export interface User {
  id: string;
  role: Role;
  fullName: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  grade: number;
  academicYear: string;
  homeroomTeacherId: string | null;
  homeroomTeacher?: { id: string; fullName: string } | null;
  _count?: { students: number };
}

export interface Student {
  id: string;
  nisn: string;
  nis: string | null;
  fullName: string;
  classId: string | null;
  gender: 'L' | 'P' | null;
  birthDate?: string | null;
  address?: string | null;
  class?: { id: string; name: string } | null;
}

export interface Subject {
  id: string;
  name: string;
  code: string | null;
}

export type DayOfWeek = 'SEN' | 'SEL' | 'RAB' | 'KAM' | 'JUM' | 'SAB' | 'MIN';

export interface Schedule {
  id: string;
  subjectId: string;
  classId: string;
  teacherId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  academicYear: string;
  subject?: { id: string; name: string };
  class?: { id: string; name: string };
  teacher?: { id: string; fullName: string };
}

export interface SchoolEvent {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string | null;
  targetClassId: string | null;
  targetClass?: { id: string; name: string } | null;
}

export type TermType = 'SEMESTER' | 'TRIWULAN' | 'MID';

export interface Term {
  id: string;
  academicYear: string;
  type: TermType;
  name: string;
  startDate: string;
  endDate: string;
}

export type AttendanceStatus = 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPHA';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  status: AttendanceStatus;
  note: string | null;
  student?: { id: string; fullName: string; nisn: string };
}

export interface AttendanceSession {
  id: string;
  sourceType: 'SCHEDULE' | 'EVENT';
  scheduleId: string | null;
  eventId: string | null;
  sessionDate: string;
  termId: string | null;
  records: AttendanceRecord[];
  schedule?: {
    subject: { name: string };
    class: { id: string; name: string };
  } | null;
  event?: { id: string; title: string } | null;
}

export interface ReportResult {
  scope: string;
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

export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number };
}

export interface Setting {
  channelPush: boolean;
  channelEmail: boolean;
  channelWa: boolean;
  notifyStatuses: string[];
  attendanceTemplate: string;
  reminderTemplate: string;
  reminderHour: number;
  weeklyRecapEnabled: boolean;
}

export interface TrendPoint {
  date: string;
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  total: number;
}

export interface TrendResult {
  scope: string;
  days: number;
  points: TrendPoint[];
}
