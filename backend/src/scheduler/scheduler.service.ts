import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AttendanceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SettingsService } from '../settings/settings.module';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private settings: SettingsService,
  ) {}

  /**
   * Setiap hari pukul 03:00 WIB — bersihkan refresh token yang sudah
   * kedaluwarsa atau telah dicabut (tak terpakai lagi) agar tabel tak membengkak.
   */
  @Cron('0 3 * * *', { timeZone: 'Asia/Jakarta' })
  async cleanupRefreshTokens() {
    const now = new Date();
    const { count } = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { revokedAt: { not: null } }],
      },
    });
    if (count > 0) {
      this.logger.log(`Pembersihan refresh token: ${count} baris dihapus`);
    }
  }

  /**
   * Berjalan tiap jam; kirim reminder kegiatan H-1 hanya pada jam yang
   * dikonfigurasi admin (`reminderHour`, default 17 WIB). Template pesan juga
   * dapat diatur admin.
   */
  @Cron('0 * * * *', { timeZone: 'Asia/Jakarta' })
  async sendH1Reminders() {
    const cfg = await this.settings.get();
    if (this.jakartaHour() !== cfg.reminderHour) return;

    const { start, end } = this.tomorrowRange();
    const events = await this.prisma.event.findMany({
      where: { eventDate: { gte: start, lt: end } },
    });
    if (events.length === 0) {
      this.logger.log('Tidak ada kegiatan besok, reminder dilewati');
      return;
    }

    for (const ev of events) {
      const students = await this.prisma.student.findMany({
        where: ev.targetClassId ? { classId: ev.targetClassId } : {},
        select: { id: true, userId: true },
      });

      const body = this.settings.render(cfg.reminderTemplate, {
        judul: ev.title,
        jam: ev.startTime,
        lokasi: ev.location ? ` di ${ev.location}` : '',
      });

      for (const s of students) {
        await this.notifications.notifyParentsOfStudent(s.id, {
          type: 'REMINDER',
          title: 'Reminder Kegiatan Besok',
          body,
          data: { eventId: ev.id },
        });
        if (s.userId) {
          await this.notifications.notifyUser(s.userId, {
            type: 'REMINDER',
            title: 'Reminder Kegiatan Besok',
            body,
            data: { eventId: ev.id },
          });
        }
      }
    }
    this.logger.log(`Reminder H-1 terkirim untuk ${events.length} kegiatan`);
  }

  /**
   * Rekap mingguan: tiap Minggu 18:00 WIB (bila diaktifkan admin), kirim
   * ringkasan kehadiran 7 hari terakhir ke orang tua tiap murid.
   */
  @Cron('0 18 * * 0', { timeZone: 'Asia/Jakarta' })
  async sendWeeklyRecap() {
    const cfg = await this.settings.get();
    if (!cfg.weeklyRecapEnabled) return;

    const end = this.atUtcMidnight(new Date());
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 7);

    // Satu query agregat: per murid per status dalam rentang seminggu.
    const grouped = await this.prisma.attendance.groupBy({
      by: ['studentId', 'status'],
      where: { session: { sessionDate: { gte: start, lt: end } } },
      _count: { _all: true },
    });
    if (grouped.length === 0) return;

    const perStudent = new Map<string, Record<AttendanceStatus, number>>();
    for (const g of grouped) {
      const rec =
        perStudent.get(g.studentId) ??
        ({ HADIR: 0, SAKIT: 0, IZIN: 0, ALPHA: 0 } as Record<
          AttendanceStatus,
          number
        >);
      rec[g.status] = g._count._all;
      perStudent.set(g.studentId, rec);
    }

    for (const [studentId, c] of perStudent) {
      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
        select: { fullName: true },
      });
      if (!student) continue;
      const total = c.HADIR + c.SAKIT + c.IZIN + c.ALPHA;
      const body =
        `Rekap kehadiran ${student.fullName} minggu ini: ` +
        `Hadir ${c.HADIR}, Sakit ${c.SAKIT}, Izin ${c.IZIN}, Alpha ${c.ALPHA} ` +
        `dari ${total} pertemuan.`;
      await this.notifications.notifyParentsOfStudent(studentId, {
        type: 'INFO',
        title: 'Rekap Kehadiran Mingguan',
        body,
        data: { studentId },
      });
    }
    this.logger.log(`Rekap mingguan terkirim untuk ${perStudent.size} murid`);
  }

  private jakartaHour(): number {
    const h = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      hour12: false,
    }).format(new Date());
    return parseInt(h, 10) % 24;
  }

  private atUtcMidnight(d: Date): Date {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  private tomorrowRange() {
    const now = new Date();
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
    );
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end };
  }
}
