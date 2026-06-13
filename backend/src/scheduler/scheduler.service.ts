import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  /** Setiap hari pukul 17:00 — kirim reminder kegiatan untuk besok (H-1). */
  @Cron('0 17 * * *', { timeZone: 'Asia/Jakarta' })
  async sendH1Reminders() {
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

      const body = `Reminder: besok ada "${ev.title}" pukul ${ev.startTime}${
        ev.location ? ` di ${ev.location}` : ''
      }.`;

      for (const s of students) {
        // Notifikasi ke orang tua
        await this.notifications.notifyParentsOfStudent(s.id, {
          type: 'REMINDER',
          title: 'Reminder Kegiatan Besok',
          body,
          data: { eventId: ev.id },
        });
        // Notifikasi ke akun murid (bila ada)
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
