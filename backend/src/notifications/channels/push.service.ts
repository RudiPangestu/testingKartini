import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { retry } from '../../common/retry';

interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

interface ExpoTicket {
  status: 'ok' | 'error';
  details?: { error?: string };
}

/**
 * Pengiriman push notification via Expo Push API (gratis).
 * Bila token tidak ada / gagal, ditangani best-effort (tidak melempar error).
 * Token yang sudah tidak terdaftar (DeviceNotRegistered) dibersihkan otomatis.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly endpoint = 'https://exp.host/--/api/v2/push/send';

  constructor(private prisma: PrismaService) {}

  async send(tokens: string[], msg: PushMessage): Promise<void> {
    const valid = tokens.filter((t) => !!t);
    if (valid.length === 0) return;

    const messages = valid.map((to) => ({
      to,
      sound: 'default',
      title: msg.title,
      body: msg.body,
      data: msg.data ?? {},
    }));

    try {
      // Coba ulang bila gagal sesaat (jaringan / 5xx).
      const json = await retry(async () => {
        const res = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(messages),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return (await res.json()) as { data?: ExpoTicket[] };
      });
      await this.pruneInvalidTokens(valid, json.data ?? []);
    } catch (err) {
      this.logger.warn(`Push gagal setelah retry: ${(err as Error).message}`);
    }
  }

  /** Hapus token yang ditolak Expo karena perangkat tak terdaftar lagi. */
  private async pruneInvalidTokens(tokens: string[], tickets: ExpoTicket[]) {
    const dead = tokens.filter(
      (_, i) =>
        tickets[i]?.status === 'error' &&
        tickets[i]?.details?.error === 'DeviceNotRegistered',
    );
    if (dead.length === 0) return;
    try {
      await this.prisma.pushToken.deleteMany({ where: { token: { in: dead } } });
      this.logger.log(`Push token tak valid dibersihkan: ${dead.length}`);
    } catch (err) {
      this.logger.warn(`Gagal hapus token mati: ${(err as Error).message}`);
    }
  }
}
