import { Injectable, Logger } from '@nestjs/common';

interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Pengiriman push notification via Expo Push API (gratis).
 * Bila token tidak ada / gagal, ditangani best-effort (tidak melempar error).
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly endpoint = 'https://exp.host/--/api/v2/push/send';

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
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(messages),
      });
      if (!res.ok) {
        this.logger.warn(`Push gagal: HTTP ${res.status}`);
      }
    } catch (err) {
      this.logger.warn(`Push error: ${(err as Error).message}`);
    }
  }
}
