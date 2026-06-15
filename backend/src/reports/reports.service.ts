import { BadRequestException, Injectable } from '@nestjs/common';
import { AttendanceStatus, Prisma, TermType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtUser } from '../common/decorators/current-user.decorator';
import { assertStudentAccess } from '../common/student-access';
import { assertTeacherManagesClass } from '../common/teacher-scope';

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
  async general(period: string, date?: string, termId?: string) {
    const range = await this.resolveRange(period, date, termId);
    const where: Prisma.AttendanceWhereInput = {
      session: this.sessionDateFilter(range),
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
      session: this.sessionDateFilter(range),
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
  ) {
    if (requester && requester.role === 'GURU') {
      await assertTeacherManagesClass(this.prisma, requester.userId, classId);
    }
    const range = await this.resolveRange(period, date, termId);
    // Pakai snapshot kelas pada sesi (bukan kelas murid saat ini) agar rekap
    // historis tetap akurat meski murid sudah pindah kelas.
    const where: Prisma.AttendanceWhereInput = {
      session: { classId, ...this.sessionDateFilter(range) },
    };
    const breakdown = await this.aggregate(where);
    return { scope: 'class', classId, period, range: this.rangeLabel(range), ...breakdown };
  }

  // ---------- TREN (per hari) ----------
  async trend(
    opts: { studentId?: string; classId?: string; days?: number },
    requester?: JwtUser,
  ) {
    const days = Math.min(Math.max(Number(opts.days) || 14, 1), 90);
    const end = this.addDays(this.atMidnight(new Date()), 1); // termasuk hari ini
    const start = this.addDays(end, -days);

    const where: Prisma.AttendanceWhereInput = {
      session: { sessionDate: { gte: start, lt: end } },
    };
    if (opts.studentId) {
      if (requester) await assertStudentAccess(this.prisma, requester, opts.studentId);
      where.studentId = opts.studentId;
    } else if (opts.classId) {
      if (requester?.role === 'GURU') {
        await assertTeacherManagesClass(this.prisma, requester.userId, opts.classId);
      }
      where.session = { classId: opts.classId, sessionDate: { gte: start, lt: end } };
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
