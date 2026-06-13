import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AttendanceSource,
  AttendanceStatus,
  Prisma,
  TermType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TermsService } from '../terms/terms.module';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SaveAttendanceDto } from './dto/save-attendance.dto';
import { QuerySessionDto } from './dto/query-session.dto';

const SESSION_INCLUDE = {
  schedule: {
    include: {
      subject: { select: { name: true } },
      class: { select: { id: true, name: true } },
    },
  },
  event: { select: { id: true, title: true, targetClassId: true } },
  records: {
    include: { student: { select: { id: true, fullName: true, nisn: true } } },
  },
} satisfies Prisma.AttendanceSessionInclude;

// Status yang memicu notifikasi ke orang tua
const NOTIFY_STATUSES: AttendanceStatus[] = [
  AttendanceStatus.SAKIT,
  AttendanceStatus.IZIN,
  AttendanceStatus.ALPHA,
];

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private terms: TermsService,
    private notifications: NotificationsService,
  ) {}

  async createSession(dto: CreateSessionDto, userId: string) {
    const sessionDate = new Date(dto.sessionDate);

    if (dto.sourceType === AttendanceSource.SCHEDULE) {
      if (!dto.scheduleId) throw new BadRequestException('scheduleId wajib diisi');
      const schedule = await this.prisma.schedule.findUnique({
        where: { id: dto.scheduleId },
      });
      if (!schedule) throw new BadRequestException('Jadwal tidak ditemukan');
    } else {
      if (!dto.eventId) throw new BadRequestException('eventId wajib diisi');
      const event = await this.prisma.event.findUnique({
        where: { id: dto.eventId },
      });
      if (!event) throw new BadRequestException('Kegiatan tidak ditemukan');
    }

    // Tentukan periode (semester) yang memuat tanggal — untuk laporan
    const term = await this.terms.findContaining(sessionDate, TermType.SEMESTER);

    return this.prisma.attendanceSession.create({
      data: {
        sourceType: dto.sourceType,
        scheduleId: dto.scheduleId,
        eventId: dto.eventId,
        sessionDate,
        termId: term?.id,
        createdById: userId,
      },
      include: SESSION_INCLUDE,
    });
  }

  findSessions(query: QuerySessionDto) {
    const where: Prisma.AttendanceSessionWhereInput = {
      ...(query.date ? { sessionDate: new Date(query.date) } : {}),
      ...(query.classId
        ? {
            OR: [
              { schedule: { classId: query.classId } },
              { event: { targetClassId: query.classId } },
            ],
          }
        : {}),
    };
    return this.prisma.attendanceSession.findMany({
      where,
      include: SESSION_INCLUDE,
      orderBy: { sessionDate: 'desc' },
    });
  }

  async findSession(id: string) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id },
      include: SESSION_INCLUDE,
    });
    if (!session) throw new NotFoundException('Sesi presensi tidak ditemukan');
    return session;
  }

  /** Simpan / perbarui presensi (bulk) lalu picu notifikasi ke orang tua. */
  async saveAttendance(sessionId: string, dto: SaveAttendanceDto, userId: string) {
    const session = await this.findSession(sessionId);

    // Upsert tiap record dalam satu transaksi
    await this.prisma.$transaction(
      dto.records.map((r) =>
        this.prisma.attendance.upsert({
          where: {
            sessionId_studentId: { sessionId, studentId: r.studentId },
          },
          create: {
            sessionId,
            studentId: r.studentId,
            status: r.status,
            note: r.note,
            recordedById: userId,
          },
          update: {
            status: r.status,
            note: r.note,
            recordedById: userId,
            recordedAt: new Date(),
          },
        }),
      ),
    );

    await this.notifyParents(session, dto);
    return this.findSession(sessionId);
  }

  async findByStudent(studentId: string) {
    return this.prisma.attendance.findMany({
      where: { studentId },
      include: {
        session: {
          include: {
            schedule: { include: { subject: { select: { name: true } } } },
            event: { select: { title: true } },
          },
        },
      },
      orderBy: { recordedAt: 'desc' },
      take: 200,
    });
  }

  private async notifyParents(
    session: Prisma.AttendanceSessionGetPayload<{ include: typeof SESSION_INCLUDE }>,
    dto: SaveAttendanceDto,
  ) {
    const context =
      session.sourceType === AttendanceSource.SCHEDULE
        ? `mata pelajaran ${session.schedule?.subject.name ?? ''}`
        : `kegiatan ${session.event?.title ?? ''}`;
    const tanggal = session.sessionDate.toISOString().slice(0, 10);

    const toNotify = dto.records.filter((r) =>
      NOTIFY_STATUSES.includes(r.status),
    );

    for (const r of toNotify) {
      const student = await this.prisma.student.findUnique({
        where: { id: r.studentId },
        select: { fullName: true },
      });
      if (!student) continue;
      await this.notifications.notifyParentsOfStudent(r.studentId, {
        type: 'KEHADIRAN',
        title: 'Laporan Kehadiran',
        body: `Ananda ${student.fullName} tercatat ${r.status} pada ${context}, tanggal ${tanggal}.`,
        data: { studentId: r.studentId, status: r.status },
      });
    }
  }
}
