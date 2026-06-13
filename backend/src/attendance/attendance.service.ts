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
import { JwtUser } from '../common/decorators/current-user.decorator';
import { assertStudentAccess } from '../common/student-access';

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

    // Tentukan snapshot kelas untuk sesi ini (akurasi laporan historis).
    let classId: string | null = null;
    if (dto.sourceType === AttendanceSource.SCHEDULE) {
      if (!dto.scheduleId) throw new BadRequestException('scheduleId wajib diisi');
      const schedule = await this.prisma.schedule.findUnique({
        where: { id: dto.scheduleId },
      });
      if (!schedule) throw new BadRequestException('Jadwal tidak ditemukan');
      classId = schedule.classId;
    } else {
      if (!dto.eventId) throw new BadRequestException('eventId wajib diisi');
      const event = await this.prisma.event.findUnique({
        where: { id: dto.eventId },
      });
      if (!event) throw new BadRequestException('Kegiatan tidak ditemukan');
      classId = event.targetClassId;
    }

    // Idempoten: kembalikan sesi yang sudah ada untuk sumber+tanggal yang sama
    // agar tidak terbuat sesi ganda (yang akan menggandakan hitungan laporan).
    const existing = await this.prisma.attendanceSession.findFirst({
      where: {
        sourceType: dto.sourceType,
        sessionDate,
        scheduleId: dto.scheduleId ?? null,
        eventId: dto.eventId ?? null,
      },
      include: SESSION_INCLUDE,
    });
    if (existing) {
      return existing;
    }

    // Tentukan periode (semester) yang memuat tanggal — untuk laporan
    const term = await this.terms.findContaining(sessionDate, TermType.SEMESTER);

    return this.prisma.attendanceSession.create({
      data: {
        sourceType: dto.sourceType,
        scheduleId: dto.scheduleId,
        eventId: dto.eventId,
        classId,
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
      ...(query.classId ? { classId: query.classId } : {}),
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

    // Status sebelumnya per murid — untuk menentukan apakah perlu notifikasi.
    const prevStatus = new Map<string, AttendanceStatus>(
      session.records.map((r) => [r.studentId, r.status]),
    );

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

    // Hanya notifikasi untuk status Sakit/Izin/Alpha yang BARU/BERUBAH,
    // agar penyuntingan ulang tidak mengirim notifikasi duplikat.
    const changed = dto.records.filter(
      (r) =>
        NOTIFY_STATUSES.includes(r.status) &&
        prevStatus.get(r.studentId) !== r.status,
    );
    await this.notifyParents(session, changed);
    return this.findSession(sessionId);
  }

  async findByStudent(studentId: string, requester: JwtUser) {
    await assertStudentAccess(this.prisma, requester, studentId);
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
    toNotify: SaveAttendanceDto['records'],
  ) {
    const context =
      session.sourceType === AttendanceSource.SCHEDULE
        ? `mata pelajaran ${session.schedule?.subject.name ?? ''}`
        : `kegiatan ${session.event?.title ?? ''}`;
    const tanggal = session.sessionDate.toISOString().slice(0, 10);

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
