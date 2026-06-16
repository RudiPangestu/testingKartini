import { BadRequestException, Injectable } from '@nestjs/common';
import { AttendanceStatus, Prisma, TermType } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';
import { JwtUser } from '../common/decorators/current-user.decorator';
import { assertStudentAccess } from '../common/student-access';
import {
  assertTeacherManagesClass,
  teacherClassIds,
} from '../common/teacher-scope';

export interface ExportFilter {
  classId?: string;
  studentId?: string;
  subjectId?: string;
  start?: string; // YYYY-MM-DD (inklusif)
  end?: string; // YYYY-MM-DD (inklusif)
  status?: AttendanceStatus;
}

interface DateRange {
  start: Date;
  end: Date; // eksklusif
}

interface Breakdown {
  total: number;
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  hadirEfektifPct: number; // HADIR / total
  kehadiranSahPct: number; // (HADIR+SAKIT+IZIN) / total  -> tidak alpha
  alphaPct: number; // ALPHA / total
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // ---------- LAPORAN UMUM ----------
  async general(
    period: string,
    date?: string,
    termId?: string,
    subjectId?: string,
  ) {
    const range = await this.resolveRange(period, date, termId);
    const where: Prisma.AttendanceWhereInput = {
      session: this.sessionWhere(range, { subjectId }),
    };
    const breakdown = await this.aggregate(where);
    return {
      scope: 'general',
      period,
      range: this.rangeLabel(range),
      totalRecords: breakdown.total, // alias sesuai dokumentasi API
      ...breakdown,
    };
  }

  // ---------- LAPORAN INDIVIDUAL ----------
  async student(
    studentId: string,
    period: string,
    termId?: string,
    requester?: JwtUser,
    subjectId?: string,
  ) {
    if (requester) {
      await assertStudentAccess(this.prisma, requester, studentId);
    }
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, fullName: true },
    });
    if (!student) throw new BadRequestException('Murid tidak ditemukan');

    const range = await this.resolveRange(period, undefined, termId);
    const where: Prisma.AttendanceWhereInput = {
      studentId,
      session: this.sessionWhere(range, { subjectId }),
    };
    const breakdown = await this.aggregate(where);
    return {
      scope: 'individual',
      studentId: student.id,
      studentName: student.fullName,
      period,
      range: this.rangeLabel(range),
      totalSessions: breakdown.total, // alias sesuai dokumentasi API
      ...breakdown,
    };
  }

  // ---------- REKAP PER KELAS ----------
  async byClass(
    classId: string,
    period: string,
    date?: string,
    termId?: string,
    requester?: JwtUser,
    subjectId?: string,
  ) {
    if (requester && requester.role === 'GURU') {
      await assertTeacherManagesClass(this.prisma, requester.userId, classId);
    }
    const range = await this.resolveRange(period, date, termId);
    // Pakai snapshot kelas pada sesi (bukan kelas murid saat ini) agar rekap
    // historis tetap akurat meski murid sudah pindah kelas.
    const where: Prisma.AttendanceWhereInput = {
      session: this.sessionWhere(range, { classId, subjectId }),
    };
    const breakdown = await this.aggregate(where);
    return { scope: 'class', classId, period, range: this.rangeLabel(range), ...breakdown };
  }

  // ---------- TREN (per hari) ----------
  async trend(
    opts: {
      studentId?: string;
      classId?: string;
      subjectId?: string;
      days?: number;
    },
    requester?: JwtUser,
  ) {
    const days = Math.min(Math.max(Number(opts.days) || 14, 1), 90);
    const end = this.addDays(this.atMidnight(new Date()), 1); // termasuk hari ini
    const start = this.addDays(end, -days);

    const session: Prisma.AttendanceSessionWhereInput = {
      sessionDate: { gte: start, lt: end },
    };
    if (opts.subjectId) session.schedule = { subjectId: opts.subjectId };

    const where: Prisma.AttendanceWhereInput = { session };
    if (opts.studentId) {
      if (requester) await assertStudentAccess(this.prisma, requester, opts.studentId);
      where.studentId = opts.studentId;
    } else if (opts.classId) {
      if (requester?.role === 'GURU') {
        await assertTeacherManagesClass(this.prisma, requester.userId, opts.classId);
      }
      session.classId = opts.classId;
    }

    const rows = await this.prisma.attendance.findMany({
      where,
      select: { status: true, session: { select: { sessionDate: true } } },
    });

    // Bucket per tanggal (YYYY-MM-DD)
    const buckets = new Map<string, Record<AttendanceStatus, number>>();
    for (let i = 0; i < days; i++) {
      const d = this.addDays(start, i).toISOString().slice(0, 10);
      buckets.set(d, { HADIR: 0, SAKIT: 0, IZIN: 0, ALPHA: 0 });
    }
    for (const r of rows) {
      const key = r.session.sessionDate.toISOString().slice(0, 10);
      const b = buckets.get(key);
      if (b) b[r.status] += 1;
    }

    return {
      scope: opts.studentId ? 'student' : opts.classId ? 'class' : 'general',
      days,
      points: [...buckets.entries()].map(([date, c]) => ({
        date,
        hadir: c.HADIR,
        sakit: c.SAKIT,
        izin: c.IZIN,
        alpha: c.ALPHA,
        total: c.HADIR + c.SAKIT + c.IZIN + c.ALPHA,
      })),
    };
  }

  // ---------- EXPORT EXCEL (rekap absensi terfilter) ----------
  /**
   * Bangun file .xlsx berisi baris-baris presensi sesuai filter.
   * Filter: rentang tanggal (start/end), kelas, murid, status.
   * Scope: GURU dibatasi pada kelas yang diampu; ORTU/MURID tidak dipakai
   * di sini (endpoint hanya untuk ADMIN/GURU).
   */
  async exportXlsx(filter: ExportFilter, requester?: JwtUser): Promise<Buffer> {
    const where: Prisma.AttendanceWhereInput = {};

    // Rentang tanggal (end inklusif -> dibuat eksklusif +1 hari)
    const sessionFilter: Prisma.AttendanceSessionWhereInput = {};
    if (filter.start || filter.end) {
      const dateRange: Prisma.DateTimeFilter = {};
      if (filter.start) dateRange.gte = this.atMidnight(new Date(filter.start));
      if (filter.end)
        dateRange.lt = this.addDays(this.atMidnight(new Date(filter.end)), 1);
      sessionFilter.sessionDate = dateRange;
    }

    if (filter.status) where.status = filter.status;

    if (filter.studentId) {
      if (requester) {
        await assertStudentAccess(this.prisma, requester, filter.studentId);
      }
      where.studentId = filter.studentId;
    }

    if (filter.classId) {
      if (requester?.role === 'GURU') {
        await assertTeacherManagesClass(
          this.prisma,
          requester.userId,
          filter.classId,
        );
      }
      sessionFilter.classId = filter.classId;
    } else if (requester?.role === 'GURU') {
      // Guru tanpa filter kelas: batasi ke kelas yang ia ampu.
      const ids = await teacherClassIds(this.prisma, requester.userId);
      sessionFilter.classId = { in: ids.length ? ids : ['__none__'] };
    }

    // Filter mapel (mengecualikan sesi kegiatan tanpa jadwal).
    if (filter.subjectId) {
      sessionFilter.schedule = { subjectId: filter.subjectId };
    }

    if (Object.keys(sessionFilter).length) where.session = sessionFilter;

    const rows = await this.prisma.attendance.findMany({
      where,
      orderBy: [{ session: { sessionDate: 'asc' } }, { studentId: 'asc' }],
      select: {
        status: true,
        note: true,
        recordedAt: true,
        student: {
          select: { nisn: true, nis: true, fullName: true },
        },
        recordedBy: { select: { fullName: true } },
        session: {
          select: {
            sessionDate: true,
            sourceType: true,
            class: { select: { name: true } },
            schedule: { select: { subject: { select: { name: true } } } },
            event: { select: { title: true } },
          },
        },
      },
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'SIPRES Kartini';
    wb.created = new Date();
    const ws = wb.addWorksheet('Absensi');

    ws.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Tanggal', key: 'tanggal', width: 13 },
      { header: 'NISN', key: 'nisn', width: 16 },
      { header: 'Nama Murid', key: 'nama', width: 26 },
      { header: 'Kelas', key: 'kelas', width: 12 },
      { header: 'Konteks', key: 'konteks', width: 24 },
      { header: 'Status', key: 'status', width: 10 },
      { header: 'Catatan', key: 'catatan', width: 24 },
      { header: 'Dicatat oleh', key: 'oleh', width: 22 },
    ];
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' },
    };
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    rows.forEach((r, i) => {
      const konteks =
        r.session.sourceType === 'SCHEDULE'
          ? r.session.schedule?.subject?.name || 'Jadwal'
          : r.session.event?.title || 'Kegiatan';
      ws.addRow({
        no: i + 1,
        tanggal: r.session.sessionDate.toISOString().slice(0, 10),
        nisn: r.student.nisn,
        nama: r.student.fullName,
        kelas: r.session.class?.name || '-',
        konteks,
        status: r.status,
        catatan: r.note || '',
        oleh: r.recordedBy.fullName,
      });
    });

    // Baris ringkasan
    const count = (s: AttendanceStatus) =>
      rows.filter((r) => r.status === s).length;
    ws.addRow({});
    const sum = ws.addRow({
      nama: 'RINGKASAN',
      kelas: `Total: ${rows.length}`,
      konteks: `Hadir: ${count('HADIR')}  Sakit: ${count('SAKIT')}`,
      status: `Izin: ${count('IZIN')}`,
      catatan: `Alpha: ${count('ALPHA')}`,
    });
    sum.font = { bold: true };

    const buffer = await wb.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ---------- HELPER ----------

  private async aggregate(where: Prisma.AttendanceWhereInput): Promise<Breakdown> {
    const grouped = await this.prisma.attendance.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
    });

    const count = (s: AttendanceStatus) =>
      grouped.find((g) => g.status === s)?._count._all ?? 0;

    const hadir = count(AttendanceStatus.HADIR);
    const sakit = count(AttendanceStatus.SAKIT);
    const izin = count(AttendanceStatus.IZIN);
    const alpha = count(AttendanceStatus.ALPHA);
    const total = hadir + sakit + izin + alpha;

    const pct = (n: number) =>
      total === 0 ? 0 : Math.round((n / total) * 10000) / 100;

    return {
      total,
      hadir,
      sakit,
      izin,
      alpha,
      hadirEfektifPct: pct(hadir),
      kehadiranSahPct: pct(hadir + sakit + izin),
      alphaPct: pct(alpha),
    };
  }

  private sessionDateFilter(range: DateRange | null) {
    if (!range) return {};
    return { sessionDate: { gte: range.start, lt: range.end } };
  }

  /**
   * Filter sesi gabungan: rentang tanggal + opsional kelas + opsional mapel.
   * Filter mapel via session.schedule.subjectId — otomatis mengecualikan sesi
   * kegiatan (EVENT) yang tidak terkait mata pelajaran.
   */
  private sessionWhere(
    range: DateRange | null,
    opts?: { classId?: string; subjectId?: string },
  ): Prisma.AttendanceSessionWhereInput {
    const f: Prisma.AttendanceSessionWhereInput = {
      ...this.sessionDateFilter(range),
    };
    if (opts?.classId) f.classId = opts.classId;
    if (opts?.subjectId) f.schedule = { subjectId: opts.subjectId };
    return f;
  }

  private rangeLabel(range: DateRange | null) {
    if (!range) return null;
    return {
      start: range.start.toISOString().slice(0, 10),
      end: new Date(range.end.getTime() - 1).toISOString().slice(0, 10),
    };
  }

  private async resolveRange(
    period: string,
    date?: string,
    termId?: string,
  ): Promise<DateRange | null> {
    // Periode berbasis term (mid/semester/triwulan/tahun)
    if (['mid', 'semester', 'triwulan', 'year'].includes(period)) {
      if (termId) {
        const term = await this.prisma.term.findUnique({
          where: { id: termId },
        });
        if (!term) throw new BadRequestException('Periode (term) tidak ditemukan');
        return { start: term.startDate, end: this.addDays(term.endDate, 1) };
      }

      // Tanpa termId: untuk semester/triwulan/mid, pakai periode aktif yang
      // memuat tanggal acuan. Untuk "year", gunakan seluruh riwayat.
      const typeMap: Record<string, TermType | undefined> = {
        semester: TermType.SEMESTER,
        triwulan: TermType.TRIWULAN,
        mid: TermType.MID,
      };
      const type = typeMap[period];
      if (!type) return null;

      const ref = date ? new Date(date) : new Date();
      const term = await this.prisma.term.findFirst({
        where: { type, startDate: { lte: ref }, endDate: { gte: ref } },
      });
      if (!term) return null; // belum ada periode terdefinisi -> seluruh riwayat
      return { start: term.startDate, end: this.addDays(term.endDate, 1) };
    }

    const base = date ? new Date(date) : new Date();
    const day = this.atMidnight(base);

    switch (period) {
      case 'day':
        return { start: day, end: this.addDays(day, 1) };
      case 'week': {
        const dow = (day.getUTCDay() + 6) % 7; // Senin = 0
        const start = this.addDays(day, -dow);
        return { start, end: this.addDays(start, 7) };
      }
      case 'month': {
        const start = new Date(
          Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), 1),
        );
        const end = new Date(
          Date.UTC(day.getUTCFullYear(), day.getUTCMonth() + 1, 1),
        );
        return { start, end };
      }
      default:
        throw new BadRequestException(
          'period harus: day|week|month|mid|triwulan|semester|year',
        );
    }
  }

  private atMidnight(d: Date): Date {
    return new Date(
      Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
    );
  }

  private addDays(d: Date, days: number): Date {
    const r = new Date(d);
    r.setUTCDate(r.getUTCDate() + days);
    return r;
  }
}
