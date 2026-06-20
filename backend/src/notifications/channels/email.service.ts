import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { retry } from '../../common/retry';

/**
 * Pengiriman email multi-channel dengan fallback otomatis:
 *
 * 1. **Gmail API** (prioritas — gratis ~500 email/hari, kirim lewat akun Gmail
 *    sendiri via REST API port 443; tidak butuh domain & tidak diblokir Render):
 *    set env `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`,
 *    dan `SMTP_FROM` (alamat Gmail pengirim).
 *
 * 2. **Mailjet** (gratis 200 email/hari, cukup verifikasi email pengirim — tapi
 *    sering diblokir di Render): set env `MAILJET_API_KEY` + `MAILJET_SECRET_KEY`.
 *
 * 3. **Resend** (gratis 100 email/hari, butuh verifikasi domain untuk kirim ke
 *    luar): set env `RESEND_API_KEY`.
 *
 * 4. **SMTP** (fallback untuk lokal / self-hosted yang tidak blokir port
 *    587/465): set env `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`.
 *
 * Bila tidak ada yang dikonfigurasi, email dilewati (no-op aman).
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  /** Cache access token Gmail (refresh token ditukar jadi access token). */
  private gmailToken: { value: string; expiresAt: number } | null = null;

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
  /*  Gmail API (HTTP, OAuth2)                                            */
  /* ------------------------------------------------------------------ */

  /** Tukar refresh token jadi access token (dicache sampai mendekati expired). */
  private async getGmailAccessToken(): Promise<string | null> {
    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
    if (!clientId || !clientSecret || !refreshToken) return null;

    // Pakai cache bila masih berlaku (sisa > 60 detik).
    if (this.gmailToken && this.gmailToken.expiresAt - Date.now() > 60_000) {
      return this.gmailToken.value;
    }

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    });
    if (!res.ok) {
      this.logger.warn(`Gmail OAuth gagal: HTTP ${res.status} ${await res.text()}`);
      return null;
    }
    const json = (await res.json()) as {
      access_token: string;
      expires_in: number;
    };
    this.gmailToken = {
      value: json.access_token,
      expiresAt: Date.now() + json.expires_in * 1000,
    };
    return json.access_token;
  }

  /** Susun pesan RFC 2822 (UTF-8 aman) lalu encode base64url untuk Gmail API. */
  private buildRawMessage(to: string, subject: string, text: string): string {
    const from = this.senderFrom;
    const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString(
      'base64',
    )}?=`;
    const encodedBody = Buffer.from(text, 'utf8').toString('base64');
    const headers = [
      `From: ${from.name} <${from.email}>`,
      `To: ${to}`,
      `Subject: ${encodedSubject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
    ].join('\r\n');
    const mime = `${headers}\r\n\r\n${encodedBody}`;
    // base64url: tanpa padding, +/ -> -_
    return Buffer.from(mime, 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  private async sendViaGmailApi(
    to: string,
    subject: string,
    text: string,
  ): Promise<boolean> {
    const accessToken = await this.getGmailAccessToken();
    if (!accessToken) return false;

    try {
      await retry(async () => {
        const res = await fetch(
          'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              raw: this.buildRawMessage(to, subject, text),
            }),
          },
        );
        if (!res.ok) {
          // Token bisa kedaluwarsa di tengah jalan — buang cache agar di-refresh.
          if (res.status === 401) this.gmailToken = null;
          throw new Error(`Gmail API HTTP ${res.status}: ${await res.text()}`);
        }
      });
      this.logger.log(`Email terkirim via Gmail API ke ${to}`);
      return true;
    } catch (err) {
      this.logger.warn(
        `Gmail API gagal setelah retry ke ${to}: ${(err as Error).message}`,
      );
      return false;
    }
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

    // Prioritas 1: Gmail API (lewat akun Gmail sendiri, HTTP 443, tanpa domain)
    if (await this.sendViaGmailApi(to, subject, text)) return;

    // Prioritas 2: Mailjet (cukup verifikasi email pengirim)
    if (await this.sendViaMailjet(to, subject, text)) return;

    // Prioritas 3: Resend (butuh verifikasi domain)
    if (await this.sendViaResend(to, subject, text)) return;

    // Prioritas 4: SMTP (untuk lokal / self-hosted)
    if (await this.sendViaSmtp(to, subject, text)) return;

    // Tidak ada channel email yang dikonfigurasi
    this.logger.warn(
      `Email ke ${to} dilewati — belum ada email provider yang dikonfigurasi`,
    );
  }
}

