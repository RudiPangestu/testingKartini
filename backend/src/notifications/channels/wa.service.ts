import { Injectable, Logger } from '@nestjs/common';
import { retry } from '../../common/retry';

/**
 * Pengiriman WhatsApp via gateway HTTP generik (mis. Fonnte/Wablas - gratis/murah).
 * Aktif hanya bila WA_GATEWAY_URL dikonfigurasi; jika tidak, no-op aman.
 *
 * Format request mengikuti gateway umum: POST { target, message } dengan
 * header Authorization berisi token. Sesuaikan bila gateway berbeda.
 */
@Injectable()
export class WaService {
  private readonly logger = new Logger(WaService.name);

  async send(phone: string | null, message: string): Promise<void> {
    const url = process.env.WA_GATEWAY_URL;
    const token = process.env.WA_TOKEN;
    if (!url || !token || !phone) {
      return; // belum dikonfigurasi atau tidak ada nomor
    }
    try {
      await retry(async () => {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token,
          },
          body: JSON.stringify({ target: phone, message }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      });
    } catch (err) {
      this.logger.warn(`WA gagal setelah retry: ${(err as Error).message}`);
    }
  }
}
