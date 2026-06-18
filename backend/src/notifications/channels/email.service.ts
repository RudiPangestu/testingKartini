import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { retry } from '../../common/retry';

/**
 * Pengiriman email via Resend HTTP API (prioritas) atau SMTP (fallback).
 *
 * - **Resend** (direkomendasikan untuk hosting seperti Render yang memblokir
 *   port SMTP): set env `RESEND_API_KEY`. Gratis 100 email/hari.
 *   Tanpa verifikasi domain, pengirim otomatis `onboarding@resend.dev`.
 *   Bila `RESEND_FROM` diset (setelah verifikasi domain di Resend), alamat
 *   tersebut digunakan sebagai pengirim.
 *
 * - **SMTP** (fallback untuk lokal / self-hosted): set env `SMTP_HOST`,
 *   `SMTP_USER`, `SMTP_PASS`.
 *
 * Bila keduanya tidak dikonfigurasi, email dilewati (no-op aman).
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  /* ------------------------------------------------------------------ */
  /*  Resend HTTP API                                                    */
  /* ------------------------------------------------------------------ */

  private get resendKey(): string | undefined {
    return process.env.RESEND_API_KEY;
  }

  private async sendViaResend(
    to: string,
    subject: string,
    text: string,
  ): Promise<boolean> {
    const apiKey = this.resendKey;
    if (!apiKey) return false; // Resend tidak dikonfigurasi

    const from =
      process.env.RESEND_FROM ||
      process.env.SMTP_FROM ||
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

    // Prioritas 1: Resend HTTP API (tidak kena blokir port)
    if (await this.sendViaResend(to, subject, text)) return;

    // Prioritas 2: SMTP (untuk lokal / self-hosted)
    if (await this.sendViaSmtp(to, subject, text)) return;

    // Tidak ada channel email yang dikonfigurasi
    this.logger.warn(
      `Email ke ${to} dilewati — RESEND_API_KEY maupun SMTP belum dikonfigurasi`,
    );
  }
}
