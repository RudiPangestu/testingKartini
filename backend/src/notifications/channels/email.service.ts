import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { retry } from '../../common/retry';

/**
 * Pengiriman email via SMTP (mis. Gmail SMTP - gratis).
 * Aktif hanya bila SMTP_* dikonfigurasi di .env; jika tidak, no-op aman.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter(): nodemailer.Transporter | null {
    if (this.transporter) return this.transporter;
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      return null;
    }
    this.transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    return this.transporter;
  }

  async send(to: string, subject: string, text: string): Promise<void> {
    if (!to) return;
    const transporter = this.getTransporter();
    if (!transporter) {
      this.logger.debug(`SMTP belum dikonfigurasi, email ke ${to} dilewati`);
      return;
    }
    try {
      await retry(() =>
        transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to,
          subject,
          text,
        }),
      );
    } catch (err) {
      this.logger.warn(
        `Email gagal setelah retry ke ${to}: ${(err as Error).message}`,
      );
    }
  }
}
