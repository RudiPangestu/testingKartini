import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';

const SAFE_SELECT = {
  id: true,
  role: true,
  fullName: true,
  email: true,
  phone: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryUserDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const where: Prisma.UserWhereInput = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: SAFE_SELECT,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: SAFE_SELECT,
    });
    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }
    return user;
  }

  async create(dto: CreateUserDto) {
    await this.ensureEmailUnique(dto.email);
    const passwordHash = await argon2.hash(dto.password);
    return this.prisma.user.create({
      data: {
        role: dto.role,
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        isActive: dto.isActive ?? true,
        passwordHash,
      },
      select: SAFE_SELECT,
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    if (dto.email) {
      await this.ensureEmailUnique(dto.email, id);
    }
    const data: Prisma.UserUpdateInput = {
      role: dto.role,
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      isActive: dto.isActive,
    };
    if (dto.password) {
      data.passwordHash = await argon2.hash(dto.password);
    }
    return this.prisma.user.update({
      where: { id },
      data,
      select: SAFE_SELECT,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
    return { message: 'User berhasil dihapus' };
  }

  private async ensureEmailUnique(email: string, exceptId?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== exceptId) {
      throw new ConflictException('Email sudah digunakan');
    }
  }
}
