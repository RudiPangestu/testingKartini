import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomUUID } from 'crypto';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Email atau password salah');
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
