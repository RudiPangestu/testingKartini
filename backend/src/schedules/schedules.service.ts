import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { QueryScheduleDto } from './dto/query-schedule.dto';
import { JwtUser } from '../common/decorators/current-user.decorator';

const INCLUDE = {
  subject: { select: { id: true, name: true } },
  class: { select: { id: true, name: true } },
  teacher: { select: { id: true, fullName: true } },
} satisfies Prisma.ScheduleInclude;

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryScheduleDto, user?: JwtUser) {
    const where: Prisma.ScheduleWhereInput = {
      ...(query.classId ? { classId: query.classId } : {}),
      ...(query.teacherId ? { teacherId: query.teacherId } : {}),
      ...(query.day ? { dayOfWeek: query.day } : {}),
    };
    // Guru melihat jadwal yang ia ampu langsung ATAU jadwal mapel+kelas
    // tempat ia ditugaskan sebagai guru pengampu (SubjectTeacher).
    if (user?.role === Role.GURU) {
      const assigns = await this.prisma.subjectTeacher.findMany({
        where: { teacherId: user.userId },
        select: { subjectId: true, classId: true },
      });
      where.OR = [
        { teacherId: user.userId },
        ...assigns.map((a) => ({
          subjectId: a.subjectId,
          classId: a.classId,
        })),
      ];
    }
    return this.prisma.schedule.findMany({
      where,
      include: INCLUDE,
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async findOne(id: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: INCLUDE,
    });
    if (!schedule) throw new NotFoundException('Jadwal tidak ditemukan');
    return schedule;
  }

  create(dto: CreateScheduleDto) {
    return this.prisma.schedule.create({ data: dto, include: INCLUDE });
  }

  async update(id: string, dto: UpdateScheduleDto) {
    await this.findOne(id);
    return this.prisma.schedule.update({
      where: { id },
      data: dto,
      include: INCLUDE,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.schedule.delete({ where: { id } });
    return { message: 'Jadwal berhasil dihapus' };
  }
}
