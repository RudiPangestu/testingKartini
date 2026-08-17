import { Injectable } from '@nestjs/common';
import { AttendanceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WaService } from '../notifications/channels/wa.service';
import { JwtUser } from '../common/decorators/current-user.decorator';
import { SaveDailyAttendanceDto } from './dto/save-daily-attendance.dto';

@Injectable()
export class DailyAttendanceService {
  constructor(
    private prisma: PrismaService,
    private wa: WaService,
  ) {}

  // 'YYYY-MM-DD' -> Date tengah malam UTC (kolom @db.Date menyimpan tanggal saja).
  private day(dateStr: string): Date {
    return new Date(dateStr);
  }

  /**
   * Daftar murid + status harian pada suatu tanggal, sesuai scope:
   *  - studentId  -> satu murid
   *  - classId    -> satu kelas
   *  - (kosong)   -> se-sekolah
   */
  async roster(dateStr: string, classId?: string, studentId?: string) {
    const where: Prisma.StudentWhereInput = studentId
      ? { id: studentId }
      : classId
        ? { classId }
        : {};

    const students = await this.prisma.student.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        nisn: true,
        nis: true,
        class: { select: { id: true, name: true } },
      },
      orderBy: [{ class: { name: 'asc' } }, { fullName: 'asc' }],
    });

    const date = this.day(dateStr);
    const existing = await this.prisma.dailyAttendance.findMany({
      where: { date, studentId: { in: students.map((s) => s.id) } },
      select: { studentId: true, status: true, note: true },
    });
    const byStudent = new Map(existing.map((e) => [e.studentId, e]));

    return students.map((s) => ({
      studentId: s.id,
      fullName: s.fullName,
      nisn: s.nisn,
      nis: s.nis,
      className: s.class?.name ?? null,
      status: byStudent.get(s.id)?.status ?? null,
      note: byStudent.get(s.id)?.note ?? null,
    }));
  }

  /** Simpan/patch daftar hadir harian (bulk upsert, 1 record per murid/hari). */
  async save(dto: SaveDailyAttendanceDto, user: JwtUser) {
    const date = this.day(dto.date);
    await this.prisma.$transaction(
      dto.records.map((r) =>
        this.prisma.dailyAttendance.upsert({
          where: { studentId_date: { studentId: r.studentId, date } },
          create: {
            studentId: r.studentId,
            date,
            status: r.status,
            note: r.note,
            recordedById: user.userId,
          },
          update: {
            status: r.status,
            note: r.note,
            recordedById: user.userId,
            recordedAt: new Date(),
          },
        }),
      ),
    );
    return { saved: dto.records.length };
  }

  /** Rekap hitungan status + daftar nama untuk telat & alpha (untuk WA). */
  async summary(dateStr: string, classId?: string) {
    const date = this.day(dateStr);
    const where: Prisma.DailyAttendanceWhereInput = { date };
    if (classId) where.student = { classId };

    const records = await this.prisma.dailyAttendance.findMany({
      where,
      select: {
        status: true,
        student: {
          select: { fullName: true, class: { select: { name: true } } },
        },
      },
      orderBy: { student: { fullName: 'asc' } },
    });

    const namesOf = (st: AttendanceStatus) =>
      records
        .filter((r) => r.status === st)
        .map((r) =>
          r.student.class?.name
            ? `${r.student.fullName} (${r.student.class.name})`
            : r.student.fullName,
        );

    const count = (st: AttendanceStatus) =>
      records.filter((r) => r.status === st).length;

    return {
      total: records.length,
      hadir: count(AttendanceStatus.HADIR),
      telat: count(AttendanceStatus.TELAT),
      sakit: count(AttendanceStatus.SAKIT),
      izin: count(AttendanceStatus.IZIN),
      alpha: count(AttendanceStatus.ALPHA),
      telatNames: namesOf(AttendanceStatus.TELAT),
      alphaNames: namesOf(AttendanceStatus.ALPHA),
      sakitNames: namesOf(AttendanceStatus.SAKIT),
      izinNames: namesOf(AttendanceStatus.IZIN),
    };
  }

  /** Susun teks rekap WhatsApp (format sementara — bisa diubah). */
  buildMessage(
    dateStr: string,
    scopeLabel: string,
    s: Awaited<ReturnType<DailyAttendanceService['summary']>>,
  ): string {
    const tgl = new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
    const lines: string[] = [];
    lines.push('*REKAP DAFTAR HADIR HARIAN*');
    lines.push('SMA Kartini Batam');
    lines.push(`${tgl}`);
    lines.push(`Cakupan: ${scopeLabel}`);
    lines.push('');
    lines.push(`Total tercatat : ${s.total}`);
    lines.push(`Hadir          : ${s.hadir}`);
    lines.push(`Telat          : ${s.telat}`);
    lines.push(`Sakit          : ${s.sakit}`);
    lines.push(`Izin           : ${s.izin}`);
    lines.push(`Alpha          : ${s.alpha}`);
    if (s.telatNames.length) {
      lines.push('');
      lines.push(`*Telat (${s.telatNames.length}):*`);
      lines.push(s.telatNames.map((n) => `- ${n}`).join('\n'));
    }
    if (s.alphaNames.length) {
      lines.push('');
      lines.push(`*Alpha (${s.alphaNames.length}):*`);
      lines.push(s.alphaNames.map((n) => `- ${n}`).join('\n'));
    }
    if (s.sakitNames.length) {
      lines.push('');
      lines.push(`*Sakit (${s.sakitNames.length}):*`);
      lines.push(s.sakitNames.map((n) => `- ${n}`).join('\n'));
    }
    if (s.izinNames.length) {
      lines.push('');
      lines.push(`*Izin (${s.izinNames.length}):*`);
      lines.push(s.izinNames.map((n) => `- ${n}`).join('\n'));
    }
    lines.push('');
    lines.push('— Diisi guru piket via SIPRES Kartini');
    return lines.join('\n');
  }

  /**
   * Kirim rekap harian ke WhatsApp semua admin (nomor HP terisi). Bila WA
   * gateway belum dikonfigurasi, pengiriman no-op tetapi pesan tetap
   * dikembalikan untuk pratinjau.
   */
  async sendWa(dateStr: string, classId?: string) {
    const summary = await this.summary(dateStr, classId);
    let scopeLabel = 'Se-sekolah';
    if (classId) {
      const kelas = await this.prisma.class.findUnique({
        where: { id: classId },
        select: { name: true },
      });
      scopeLabel = `Kelas ${kelas?.name ?? '-'}`;
    }
    const message = this.buildMessage(dateStr, scopeLabel, summary);

    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true, phone: { not: null } },
      select: { phone: true },
    });
    await Promise.all(admins.map((a) => this.wa.send(a.phone, message)));

    const configured = !!process.env.WA_GATEWAY_URL && !!process.env.WA_TOKEN;
    return {
      message,
      sentTo: admins.length,
      configured,
      note: configured
        ? undefined
        : 'WA gateway belum dikonfigurasi (WA_GATEWAY_URL/WA_TOKEN) — pesan tidak terkirim, ini hanya pratinjau.',
    };
  }
}
