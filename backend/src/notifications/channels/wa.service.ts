import { Injectable, Logger } from '@nestjs/common';
import { retry } from '../../common/retry';

/**
 * Pengiriman WhatsApp via gateway HTTP (default: Fonnte).
 * Aktif hanya bila WA_GATEWAY_URL dikonfigurasi; jika tidak, no-op aman.
 *
 * Fonnte (https://api.fonnte.com/send) menerima body form-urlencoded dengan
 * field `target` & `message`, dan header `Authorization: <TOKEN>` (tanpa
 * "Bearer"). Format ini juga umum kompatibel dengan Wablas.
 * Nomor tujuan memakai kode negara tanpa '+' (mis. 628123456789).
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
        const body = new URLSearchParams({ target: phone, message });
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: token,
          },
          body: body.toString(),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      });
    } catch (err) {
      this.logger.warn(`WA gagal setelah retry: ${(err as Error).message}`);
    }
  }
}
