import { Injectable, Logger } from '@nestjs/common';

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
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
        body: JSON.stringify({ target: phone, message }),
      });
      if (!res.ok) {
        this.logger.warn(`WA gagal: HTTP ${res.status}`);
      }
    } catch (err) {
      this.logger.warn(`WA error: ${(err as Error).message}`);
    }
  }
}
