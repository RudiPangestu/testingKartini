import type { AttendanceSession, AttendanceStatus } from './types';

export interface MatrixSession {
  id: string;
  date: string; // YYYY-MM-DD
  subject: string;
}
export interface MatrixRow {
  studentId: string;
  nis: string | null;
  nisn: string;
  fullName: string;
  // status per sessionId
  cells: Record<string, AttendanceStatus | undefined>;
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  telat: number;
}

export const STATUS_CHAR: Record<AttendanceStatus, string> = {
  HADIR: '•',
  SAKIT: 'S',
  IZIN: 'I',
  ALPHA: 'A',
  TELAT: 'T',
};

/**
 * Susun matriks kehadiran (siswa × pertemuan) dari sesi presensi, meniru
 * "Daftar Hadir Tatap Muka" buku. Hanya sesi tatap muka (SCHEDULE) dalam
 * rentang tanggal; opsional difilter per nama mata pelajaran.
 */
export function buildMatrix(
  sessions: AttendanceSession[],
  students: { id: string; nis: string | null; nisn: string; fullName: string }[],
  opts: { from?: string; to?: string; subject?: string },
): { sessions: MatrixSession[]; rows: MatrixRow[] } {
  const filtered = sessions
    .filter((s) => s.sourceType === 'SCHEDULE')
    .filter((s) => {
      const d = s.sessionDate.slice(0, 10);
      if (opts.from && d < opts.from) return false;
      if (opts.to && d > opts.to) return false;
      if (opts.subject && s.schedule?.subject.name !== opts.subject) return false;
      return true;
    })
    .sort((a, b) => a.sessionDate.localeCompare(b.sessionDate));

  const ms: MatrixSession[] = filtered.map((s) => ({
    id: s.id,
    date: s.sessionDate.slice(0, 10),
    subject: s.schedule?.subject.name ?? '—',
  }));

  const rows: MatrixRow[] = students.map((st) => {
    const cells: Record<string, AttendanceStatus | undefined> = {};
    let hadir = 0,
      sakit = 0,
      izin = 0,
      alpha = 0,
      telat = 0;
    for (const s of filtered) {
      const rec = s.records.find((r) => r.studentId === st.id);
      cells[s.id] = rec?.status;
      if (rec?.status === 'HADIR') hadir++;
      else if (rec?.status === 'SAKIT') sakit++;
      else if (rec?.status === 'IZIN') izin++;
      else if (rec?.status === 'ALPHA') alpha++;
      else if (rec?.status === 'TELAT') telat++;
    }
    return { studentId: st.id, nis: st.nis, nisn: st.nisn, fullName: st.fullName, cells, hadir, sakit, izin, alpha, telat };
  });

  return { sessions: ms, rows };
}

/** Kumpulan nama mapel unik dari sesi SCHEDULE (untuk dropdown filter). */
export function subjectNames(sessions: AttendanceSession[]): string[] {
  const set = new Set<string>();
  for (const s of sessions) {
    if (s.sourceType === 'SCHEDULE' && s.schedule?.subject.name)
      set.add(s.schedule.subject.name);
  }
  return [...set].sort();
}
