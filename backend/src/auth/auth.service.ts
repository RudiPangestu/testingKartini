import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/channels/email.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private email: EmailService,
  ) {}

  /**
   * Pendaftaran mandiri orang tua/wali. Akun dibuat sebagai ORTU dengan
   * isActive=false (tidak bisa login) sampai email diverifikasi. Penautan ke
   * murid dilakukan Admin setelahnya.
   */
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException('Email sudah terdaftar');
    }

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        role: Role.ORTU,
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        isActive: false,
      },
    });

    await this.sendVerification(user.id, user.email, user.fullName);
    return {
      message:
        'Pendaftaran berhasil. Cek email Anda untuk tautan verifikasi sebelum login.',
    };
  }

  /** Verifikasi email via token sekali pakai; aktifkan akun bila valid. */
  async verifyEmail(token: string) {
    if (!token) throw new BadRequestException('Token tidak ada');
    const record = await this.prisma.verificationToken.findFirst({
      where: { tokenHash: sha256(token) },
    });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Token tidak valid atau kedaluwarsa');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { isActive: true, emailVerifiedAt: new Date() },
      }),
      this.prisma.verificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);
    return { message: 'Email terverifikasi. Anda sekarang bisa login.' };
  }

  /** Kirim ulang email verifikasi (tidak membocorkan apakah email terdaftar). */
  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && !user.emailVerifiedAt) {
      await this.sendVerification(user.id, user.email, user.fullName);
    }
    return {
      message:
        'Jika email terdaftar & belum diverifikasi, tautan telah dikirim.',
    };
  }

  /** Buat token verifikasi baru, simpan hash, dan kirim email berisi tautan. */
  private async sendVerification(
    userId: string,
    toEmail: string,
    name: string,
  ) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 jam
    await this.prisma.verificationToken.create({
      data: { userId, tokenHash: sha256(token), expiresAt },
    });

    const base = process.env.APP_WEB_URL || 'http://localhost:5173';
    const link = `${base}/verify-email?token=${token}`;
    await this.email.send(
      toEmail,
      'Verifikasi Email — SIPRES Kartini',
      `Halo ${name},\n\n` +
        'Terima kasih telah mendaftar di SIPRES Kartini. Klik tautan berikut ' +
        'untuk memverifikasi email Anda (berlaku 24 jam):\n\n' +
        `${link}\n\n` +
        'Jika Anda tidak merasa mendaftar, abaikan email ini.',
    );
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // Pesan spesifik hanya setelah password benar (tidak membocorkan info).
    if (!user.isActive) {
      if (!user.emailVerifiedAt) {
        throw new UnauthorizedException(
          'Email belum diverifikasi. Cek email Anda untuk tautan verifikasi.',
        );
      }
      throw new UnauthorizedException('Akun nonaktif. Hubungi admin.');
    }

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; jti: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
      });
    } catch {
      throw new UnauthorizedException('Refresh token tidak valid/kedaluwarsa');
    }

    // Token harus ada di DB, belum dicabut, dan cocok hash-nya (anti reuse).
    const record = await this.prisma.refreshToken.findUnique({
      where: { id: payload.jti },
    });
    if (
      !record ||
      record.revokedAt ||
      record.expiresAt < new Date() ||
      record.tokenHash !== sha256(refreshToken)
    ) {
      throw new UnauthorizedException('Refresh token tidak valid/kedaluwarsa');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: record.userId },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    // Rotasi: cabut token lama lalu terbitkan pasangan baru.
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(user.id, user.email, user.role);
  }

  /** Logout: cabut refresh token yang diberikan (idempoten). */
  async logout(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
      });
      await this.prisma.refreshToken.updateMany({
        where: { id: payload.jti, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      // token sudah tidak valid -> anggap sudah logout
    }
    return { message: 'Berhasil keluar' };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }

  private async issueTokens(userId: string, email: string, role: Role) {
    const jti = randomUUID();
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email, role },
      {
        secret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
        expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
      },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: userId, jti },
      {
        secret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
        expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
      },
    );

    // Simpan catatan refresh token (hash) untuk rotasi & revocation.
    const decoded = this.jwt.decode(refreshToken) as { exp: number };
    await this.prisma.refreshToken.create({
      data: {
        id: jti,
        userId,
        tokenHash: sha256(refreshToken),
        expiresAt: new Date(decoded.exp * 1000),
      },
    });

    return { accessToken, refreshToken };
  }
}
