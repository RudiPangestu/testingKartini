/**
 * Coba ulang sebuah operasi async beberapa kali dengan backoff eksponensial.
 * Dipakai untuk pengiriman notifikasi (push/email/WA) yang bisa gagal sesaat.
 * Melempar error terakhir bila semua percobaan gagal.
 */
export async function retry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  baseDelayMs = 500,
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** i));
      }
    }
  }
  throw lastErr;
}
