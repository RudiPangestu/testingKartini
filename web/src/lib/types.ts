export type Role = 'ADMIN' | 'GURU' | 'ORTU' | 'MURID' | 'PIKET';

// Baris daftar hadir harian (per murid) untuk halaman guru piket.
export interface DailyRosterItem {
  studentId: string;
  fullName: string;
  nisn: string | null;
  nis: string | null;
  className: string | null;
  status: AttendanceStatus | null;
  note: string | null;
}

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

export interface StudentParentLink {
  id: string;
  parentUserId: string;
  relation: string | null;
  parent: { id: string; fullName: string; email: string };
}

export interface Student {
  id: string;
  nisn: string | null;
  nis: string | null;
  fullName: string;
  classId: string | null;
  gender: 'L' | 'P' | null;
  birthDate?: string | null;
  address?: string | null;
  class?: { id: string; name: string } | null;
  parents?: StudentParentLink[];
}

export interface Subject {
  id: string;
  name: string;
  code: string | null;
}

// Penugasan guru pengampu mapel pada satu kelas.
export interface SubjectTeacher {
  id: string;
  subjectId: string;
  classId: string;
  teacherId: string;
  class: { id: string; name: string };
  teacher: { id: string; fullName: string };
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

export type AttendanceStatus = 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPHA' | 'TELAT';

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
  telat: number;
  hadirEfektifPct: number;
  kehadiranSahPct: number;
  alphaPct: number;
  studentName?: string;
}

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

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  sentAt: string;
}

export interface LessonLog {
  id: string;
  classId: string;
  teacherId: string;
  subjectId: string | null;
  date: string;
  jamKe: string;
  namaSiswa: string | null;
  pokokBahasan: string;
  metode: string | null;
  selesai: boolean;
  siswaTidakHadir: string | null;
  refleksi: string | null;
  tindakLanjut: string | null;
  academicYear: string;
  subject?: { id: string; name: string } | null;
  teacher?: { id: string; fullName: string };
  class?: { id: string; name: string; academicYear: string };
}

export interface AbsentSuggestion {
  items: { name: string; status: AttendanceStatus }[];
  text: string;
}

// ---------- Daftar Nilai (Daflai) ----------

export type GradeComponent = 'PENGETAHUAN' | 'PRAKTEK';
export type Predikat = 'A' | 'B' | 'C' | 'D' | null;

export interface GradeKd {
  id: string;
  gradeBookId: string;
  nomor: number;
  deskripsi: string | null;
}

export interface GradeBook {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  academicYear: string;
  cawu: number;
  kkm: number;
  kds: GradeKd[];
  class?: { id: string; name: string; academicYear: string };
  subject?: { id: string; name: string };
  teacher?: { id: string; fullName: string };
}

export interface GradeScore {
  id: string;
  gradeBookId: string;
  kdId: string;
  studentId: string;
  komponen: GradeComponent;
  urutan: number;
  nilai: number;
}

export interface GradeKdResult {
  kdId: string;
  nomor: number;
  naPengetahuan: number | null;
  naPraktek: number | null;
  nilaiKd: number | null;
  predikat: Predikat;
}

export interface GradeStudentSummary {
  studentId: string;
  nis: string | null;
  nisn: string;
  fullName: string;
  kd: GradeKdResult[];
  nr: number | null;
  predikat: Predikat;
  tuntas: boolean | null;
}

export interface GradeStats {
  jumlahSiswa: number;
  jumlahDinilai: number;
  jumlahTuntas: number;
  rataKelas: number | null;
  dayaSerap: number | null;
  targetKurikulum: number | null;
}

export interface GradeBookFull {
  book: GradeBook;
  students: { id: string; nis: string | null; nisn: string; fullName: string }[];
  scores: GradeScore[];
  summary: GradeStudentSummary[];
  stats: GradeStats;
}

// Satu sel nilai yang dikirim ke backend (nilai null = hapus).
export interface ScoreItem {
  kdId: string;
  studentId: string;
  komponen: GradeComponent;
  urutan: number;
  nilai: number | null;
}

// ---------- Impor massal (Excel) ----------
export interface ImportResult {
  total: number;
  created: number;
  skipped: number;
  linked?: number;
  errors: { row: number; message: string }[];
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
