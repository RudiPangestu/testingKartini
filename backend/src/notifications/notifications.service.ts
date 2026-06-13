import { Injectable } from '@nestjs/common';
import { NotificationType, Platform } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from './channels/push.service';
import { EmailService } from './channels/email.service';
import { WaService } from './channels/wa.service';

interface NotifyPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private push: PushService,
    private email: EmailService,
    private wa: WaService,
  ) {}

  registerPushToken(userId: string, token: string, platform: Platform) {
    return this.prisma.pushToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform },
    });
  }

  list(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      take: 100,
    });
  }

  async markRead(id: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
    return { message: 'Notifikasi ditandai dibaca' };
  }

  /** Kirim notifikasi ke satu user lewat push + email, sekaligus simpan ke inbox. */
  async notifyUser(userId: string, payload: NotifyPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { pushTokens: true },
    });
    if (!user) return;

    // Simpan inbox (channel PUSH sebagai catatan utama)
    await this.prisma.notification.create({
      data: {
        userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        channel: 'PUSH',
      },
    });

    await this.push.send(
      user.pushTokens.map((t) => t.token),
      { title: payload.title, body: payload.body, data: payload.data },
    );

    if (user.email) {
      await this.email.send(user.email, payload.title, payload.body);
    }

    await this.wa.send(user.phone, `${payload.title}\n${payload.body}`);
  }

  /** Kirim notifikasi ke semua wali/orang tua dari seorang murid. */
  async notifyParentsOfStudent(studentId: string, payload: NotifyPayload) {
    const links = await this.prisma.studentParent.findMany({
      where: { studentId },
      select: { parentUserId: true },
    });
    await Promise.all(
      links.map((l) => this.notifyUser(l.parentUserId, payload)),
    );
  }
}
