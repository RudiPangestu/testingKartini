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
        // Fonnte membalas HTTP 200 walau gagal — periksa field status di body
        // agar kegagalan (mis. device disconnect, target salah) tidak tersembunyi.
        const raw = await res.text();
        let json: { status?: boolean; reason?: string; detail?: string } | null;
        try {
          json = JSON.parse(raw);
        } catch {
          json = null;
        }
        if (json && json.status === false) {
          throw new Error(
            `gateway menolak: ${json.reason || json.detail || raw.slice(0, 120)}`,
          );
        }
      });
      this.logger.log(`WA terkirim ke ${phone}`);
    } catch (err) {
      this.logger.warn(
        `WA gagal ke ${phone} setelah retry: ${(err as Error).message}`,
      );
    }
  }
}
