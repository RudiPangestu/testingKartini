import { Injectable } from '@nestjs/common';
import {
  NotificationChannel,
  NotificationType,
  Platform,
  Role,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from './channels/push.service';
import { EmailService } from './channels/email.service';
import { WaService } from './channels/wa.service';
import { SettingsService } from '../settings/settings.module';

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
    private settings: SettingsService,
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

    const cfg = await this.settings.get();
    // Catat channel sesuai kanal aktif (prioritas push > email > wa).
    const channel: NotificationChannel = cfg.channelPush
      ? 'PUSH'
      : cfg.channelEmail
        ? 'EMAIL'
        : cfg.channelWa
          ? 'WA'
          : 'PUSH';

    // Simpan inbox (selalu, sebagai catatan & status baca)
    await this.prisma.notification.create({
      data: {
        userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        channel,
      },
    });

    // Kirim hanya lewat kanal yang diaktifkan admin.
    if (cfg.channelPush) {
      await this.push.send(
        user.pushTokens.map((t) => t.token),
        { title: payload.title, body: payload.body, data: payload.data },
      );
    }
    if (cfg.channelEmail && user.email) {
      await this.email.send(user.email, payload.title, payload.body);
    }
    if (cfg.channelWa) {
      await this.wa.send(user.phone, `${payload.title}\n${payload.body}`);
    }
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

  /**
   * Pengumuman/Info dari admin ke audiens tertentu:
   * - ALL: seluruh user aktif
   * - ROLE: user aktif dengan role tertentu
   * - CLASS: orang tua + akun murid pada satu kelas
   */
  async broadcast(dto: {
    title: string;
    body: string;
    target: 'ALL' | 'ROLE' | 'CLASS';
    role?: Role;
    classId?: string;
  }) {
    const userIds = await this.resolveAudience(dto);
    const payload: NotifyPayload = {
      type: 'INFO',
      title: dto.title,
      body: dto.body,
    };
    await Promise.all([...userIds].map((id) => this.notifyUser(id, payload)));
    return { recipients: userIds.size };
  }

  private async resolveAudience(dto: {
    target: 'ALL' | 'ROLE' | 'CLASS';
    role?: Role;
    classId?: string;
  }): Promise<Set<string>> {
    const ids = new Set<string>();

    if (dto.target === 'ALL') {
      const users = await this.prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      users.forEach((u) => ids.add(u.id));
    } else if (dto.target === 'ROLE' && dto.role) {
      const users = await this.prisma.user.findMany({
        where: { isActive: true, role: dto.role },
        select: { id: true },
      });
      users.forEach((u) => ids.add(u.id));
    } else if (dto.target === 'CLASS' && dto.classId) {
      const students = await this.prisma.student.findMany({
        where: { classId: dto.classId },
        select: {
          userId: true,
          parents: { select: { parentUserId: true } },
        },
      });
      for (const s of students) {
        if (s.userId) ids.add(s.userId);
        s.parents.forEach((p) => ids.add(p.parentUserId));
      }
    }
    return ids;
  }
}
