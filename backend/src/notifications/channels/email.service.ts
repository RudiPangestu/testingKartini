import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { retry } from '../../common/retry';

/**
 * Pengiriman email multi-channel dengan fallback otomatis:
 *
 * 1. **Mailjet** (prioritas — gratis 200 email/hari, cukup verifikasi email
 *    pengirim): set env `MAILJET_API_KEY` + `MAILJET_SECRET_KEY`.
 *
 * 2. **Resend** (alternatif — gratis 100 email/hari, butuh verifikasi domain
 *    untuk kirim ke luar): set env `RESEND_API_KEY`.
 *
 * 3. **SMTP** (fallback untuk lokal / self-hosted yang tidak blokir port
 *    587/465): set env `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`.
 *
 * Bila tidak ada yang dikonfigurasi, email dilewati (no-op aman).
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  /** Alamat pengirim yang dipakai di semua channel. */
  private get senderFrom(): { email: string; name: string } {
    const raw =
      process.env.SMTP_FROM ||
      process.env.SMTP_USER ||
      'noreply@kartini.sch.id';
    // Parse format "Name <email>" jika ada
    const match = raw.match(/^(.+?)\s*<(.+)>$/);
    return match
      ? { name: match[1].trim(), email: match[2].trim() }
      : { name: 'SIPRES Kartini', email: raw.trim() };
  }

  /* ------------------------------------------------------------------ */
  /*  Mailjet HTTP API                                                   */
  /* ------------------------------------------------------------------ */


  private sendViaMailjet(
    to: string,
    subject: string,
    text: string,
  ): Promise<boolean> {
    const apiKey = process.env.MAILJET_API_KEY;
    const secretKey = process.env.MAILJET_SECRET_KEY;
    if (!apiKey || !secretKey) return Promise.resolve(false);

    const from = this.senderFrom;
    const credentials = Buffer.from(`${apiKey}:${secretKey}`).toString(
      'base64',
    );
    const payload = JSON.stringify({
      Messages: [
        {
          From: { Email: from.email, Name: from.name },
          To: [{ Email: to }],
          Subject: subject,
          TextPart: text,
        },
      ],
    });

    // Gunakan https module bawaan Node — lebih kompatibel di Render
    // daripada native fetch yang kadang gagal ke endpoint tertentu.
    const https = require('https');
    return new Promise<boolean>((resolve) => {
      const req = https.request(
        {
          hostname: 'api.mailjet.com',
          path: '/v3.1/send',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
            Authorization: `Basic ${credentials}`,
          },
          timeout: 15_000,
        },
        (res: import('http').IncomingMessage) => {
          let body = '';
          res.on('data', (chunk: string) => (body += chunk));
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              this.logger.log(`Email terkirim via Mailjet ke ${to}`);
              resolve(true);
            } else {
              this.logger.warn(
                `Mailjet HTTP ${res.statusCode} ke ${to}: ${body}`,
              );
              resolve(false);
            }
          });
        },
      );
      req.on('timeout', () => {
        this.logger.warn(`Mailjet timeout ke ${to}`);
        req.destroy();
        resolve(false);
      });
      req.on('error', (err: Error) => {
        this.logger.warn(`Mailjet error ke ${to}: ${err.message}`);
        resolve(false);
      });
      req.write(payload);
      req.end();
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Resend HTTP API                                                    */
  /* ------------------------------------------------------------------ */

  private async sendViaResend(
    to: string,
    subject: string,
    text: string,
  ): Promise<boolean> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return false;

    const from =
      process.env.RESEND_FROM ||
      'SIPRES Kartini <onboarding@resend.dev>';

    try {
      await retry(async () => {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ from, to: [to], subject, text }),
        });
        if (!res.ok) {
          const body = await res.text();
          throw new Error(`Resend HTTP ${res.status}: ${body}`);
        }
      });
      this.logger.log(`Email terkirim via Resend ke ${to}`);
      return true;
    } catch (err) {
      this.logger.warn(
        `Resend gagal setelah retry ke ${to}: ${(err as Error).message}`,
      );
      return false;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  SMTP (fallback)                                                    */
  /* ------------------------------------------------------------------ */

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

  private async sendViaSmtp(
    to: string,
    subject: string,
    text: string,
  ): Promise<boolean> {
    const transporter = this.getTransporter();
    if (!transporter) return false;
    try {
      await retry(() =>
        transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to,
          subject,
          text,
        }),
      );
      this.logger.log(`Email terkirim via SMTP ke ${to}`);
      return true;
    } catch (err) {
      this.logger.warn(
        `SMTP gagal setelah retry ke ${to}: ${(err as Error).message}`,
      );
      return false;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  async send(to: string, subject: string, text: string): Promise<void> {
    if (!to) return;

    // Prioritas 1: Mailjet (cukup verifikasi email pengirim)
    if (await this.sendViaMailjet(to, subject, text)) return;

    // Prioritas 2: Resend (butuh verifikasi domain)
    if (await this.sendViaResend(to, subject, text)) return;

    // Prioritas 3: SMTP (untuk lokal / self-hosted)
    if (await this.sendViaSmtp(to, subject, text)) return;

    // Tidak ada channel email yang dikonfigurasi
    this.logger.warn(
      `Email ke ${to} dilewati — belum ada email provider yang dikonfigurasi`,
    );
  }
}

