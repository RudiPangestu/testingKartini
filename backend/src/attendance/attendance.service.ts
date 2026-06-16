import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AttendanceSource,
  AttendanceStatus,
  DayOfWeek,
  Prisma,
  Role,
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
import { SettingsService } from '../settings/settings.module';

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

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private terms: TermsService,
    private notifications: NotificationsService,
    private settings: SettingsService,
  ) {}

  async createSession(dto: CreateSessionDto, user: JwtUser) {
    const sessionDate = new Date(dto.sessionDate);
    const userId = user.userId;

    // Tentukan snapshot kelas untuk sesi ini (akurasi laporan historis).
    let classId: string | null = null;
    if (dto.sourceType === AttendanceSource.SCHEDULE) {
      if (!dto.scheduleId) throw new BadRequestException('scheduleId wajib diisi');
      const schedule = await this.prisma.schedule.findUnique({
        where: { id: dto.scheduleId },
      });
      if (!schedule) throw new BadRequestException('Jadwal tidak ditemukan');
      // Guru hanya boleh membuka sesi untuk jadwal yang ia ajar.
      if (user.role === 'GURU' && schedule.teacherId !== userId) {
        throw new ForbiddenException(
          'Guru hanya dapat presensi pada jadwal yang diampu',
        );
      }
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

  // Pemetaan getUTCDay() (1=Sen..6=Sab) -> enum DayOfWeek (sekolah Senin–Sabtu).
  private static readonly DOW: Record<number, DayOfWeek | undefined> = {
    1: DayOfWeek.SEN,
    2: DayOfWeek.SEL,
    3: DayOfWeek.RAB,
    4: DayOfWeek.KAM,
    5: DayOfWeek.JUM,
    6: DayOfWeek.SAB,
  };

  /**
   * Jadwal yang BELUM diabsen pada suatu tanggal: jadwal pada hari tsb yang
   * belum punya sesi presensi dengan minimal satu record. Guru hanya melihat
   * jadwal yang ia ampu.
   */
  async findUnmarked(dateStr: string, user: JwtUser) {
    const date = new Date(dateStr);
    const day = AttendanceService.DOW[date.getUTCDay()];
    if (!day) return []; // Minggu: tidak ada jadwal

    const schedules = await this.prisma.schedule.findMany({
      where: {
        dayOfWeek: day,
        ...(user.role === Role.GURU ? { teacherId: user.userId } : {}),
      },
      include: {
        subject: { select: { name: true } },
        class: { select: { id: true, name: true } },
        teacher: { select: { id: true, fullName: true } },
      },
      orderBy: { startTime: 'asc' },
    });
    if (schedules.length === 0) return [];

    const sessions = await this.prisma.attendanceSession.findMany({
      where: {
        sessionDate: date,
        sourceType: AttendanceSource.SCHEDULE,
        scheduleId: { in: schedules.map((s) => s.id) },
      },
      select: { scheduleId: true, _count: { select: { records: true } } },
    });
    const recorded = new Set(
      sessions
        .filter((s) => s._count.records > 0)
        .map((s) => s.scheduleId),
    );

    return schedules.filter((s) => !recorded.has(s.id));
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
  async saveAttendance(
    sessionId: string,
    dto: SaveAttendanceDto,
    user: JwtUser,
  ) {
    const session = await this.findSession(sessionId);
    const userId = user.userId;

    // Guru hanya boleh menyimpan presensi pada sesi jadwal yang ia ampu
    // (konsisten dengan pembatasan saat membuka sesi). Sesi kegiatan (EVENT)
    // tidak terikat guru tertentu. Admin tidak dibatasi.
    if (
      user.role === Role.GURU &&
      session.sourceType === AttendanceSource.SCHEDULE &&
      session.schedule?.teacherId !== userId
    ) {
      throw new ForbiddenException(
        'Guru hanya dapat presensi pada jadwal yang diampu',
      );
    }

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

    // Status pemicu notifikasi dapat dikonfigurasi admin (default S/I/A).
    const cfg = await this.settings.get();
    const notifyStatuses = cfg.notifyStatuses as AttendanceStatus[];

    // Hanya notifikasi untuk status pemicu yang BARU/BERUBAH,
    // agar penyuntingan ulang tidak mengirim notifikasi duplikat.
    const changed = dto.records.filter(
      (r) =>
        notifyStatuses.includes(r.status) &&
        prevStatus.get(r.studentId) !== r.status,
    );
    await this.notifyParents(session, changed, cfg.attendanceTemplate);
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
    template: string,
  ) {
    const context =
      session.sourceType === AttendanceSource.SCHEDULE
        ? `mata pelajaran ${session.schedule?.subject.name ?? ''}`
        : `kegiatan ${session.event?.title ?? ''}`;
    const kelas = session.schedule?.class.name ?? '';
    const tanggal = session.sessionDate.toISOString().slice(0, 10);

    for (const r of toNotify) {
      const student = await this.prisma.student.findUnique({
        where: { id: r.studentId },
        select: { fullName: true },
      });
      if (!student) continue;
      const body = this.settings.render(template, {
        nama: student.fullName,
        status: r.status,
        konteks: context,
        mapel: session.schedule?.subject.name ?? '',
        kelas,
        tanggal,
      });
      await this.notifications.notifyParentsOfStudent(r.studentId, {
        type: 'KEHADIRAN',
        title: 'Laporan Kehadiran',
        body,
        data: { studentId: r.studentId, status: r.status },
      });
    }
  }
}
