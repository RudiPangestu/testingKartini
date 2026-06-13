import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { QueryClassDto } from './dto/query-class.dto';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryClassDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const where: Prisma.ClassWhereInput = {
      ...(query.academicYear ? { academicYear: query.academicYear } : {}),
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.class.findMany({
        where,
        include: {
          homeroomTeacher: { select: { id: true, fullName: true } },
          _count: { select: { students: true } },
        },
        orderBy: [{ grade: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.class.count({ where }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  async findOne(id: string) {
    const kelas = await this.prisma.class.findUnique({
      where: { id },
      include: {
        homeroomTeacher: { select: { id: true, fullName: true } },
        _count: { select: { students: true } },
      },
    });
    if (!kelas) {
      throw new NotFoundException('Kelas tidak ditemukan');
    }
    return kelas;
  }

  async findStudents(id: string) {
    await this.findOne(id);
    return this.prisma.student.findMany({
      where: { classId: id },
      orderBy: { fullName: 'asc' },
      select: {
        id: true,
        nisn: true,
        nis: true,
        fullName: true,
        gender: true,
      },
    });
  }

  create(dto: CreateClassDto) {
    return this.prisma.class.create({ data: dto });
  }

  async update(id: string, dto: UpdateClassDto) {
    await this.findOne(id);
    return this.prisma.class.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.class.delete({ where: { id } });
    return { message: 'Kelas berhasil dihapus' };
  }
}
