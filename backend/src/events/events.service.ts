import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';

const INCLUDE = {
  targetClass: { select: { id: true, name: true } },
  createdBy: { select: { id: true, fullName: true } },
} satisfies Prisma.EventInclude;

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  findAll(query: QueryEventDto) {
    const where: Prisma.EventWhereInput = {
      ...(query.from || query.to
        ? {
            eventDate: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
      // kegiatan utk kelas tsb ATAU kegiatan umum (targetClassId null)
      ...(query.classId
        ? { OR: [{ targetClassId: query.classId }, { targetClassId: null }] }
        : {}),
    };
    return this.prisma.event.findMany({
      where,
      include: INCLUDE,
      orderBy: { eventDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: INCLUDE,
    });
    if (!event) throw new NotFoundException('Kegiatan tidak ditemukan');
    return event;
  }

  create(dto: CreateEventDto, createdById: string) {
    return this.prisma.event.create({
      data: {
        title: dto.title,
        description: dto.description,
        eventDate: new Date(dto.eventDate),
        startTime: dto.startTime,
        endTime: dto.endTime,
        location: dto.location,
        targetClassId: dto.targetClassId,
        createdById,
      },
      include: INCLUDE,
    });
  }

  async update(id: string, dto: UpdateEventDto) {
    await this.findOne(id);
    return this.prisma.event.update({
      where: { id },
      data: {
        ...dto,
        eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
      },
      include: INCLUDE,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.event.delete({ where: { id } });
    return { message: 'Kegiatan berhasil dihapus' };
  }
}
