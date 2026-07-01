import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttendanceStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtUser } from '../common/decorators/current-user.decorator';
import { CreateLessonLogDto } from './dto/create-lesson-log.dto';
import { UpdateLessonLogDto } from './dto/update-lesson-log.dto';
import { QueryLessonLogDto } from './dto/query-lesson-log.dto';

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  HADIR: 'Hadir',
  SAKIT: 'Sakit',
  IZIN: 'Izin',
  ALPHA: 'Alpha',
};

const INCLUDE = {
  subject: { select: { id: true, name: true } },
  teacher: { select: { id: true, fullName: true } },
  class: { select: { id: true, name: true, academicYear: true } },
} satisfies Prisma.LessonLogInclude;

/** Rentang [awal, akhir) untuk satu hari kalender (UTC, sesuai penyimpanan). */
function dayRange(dateStr: string) {
  const start = new Date(`${dateStr.slice(0, 10)}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

@Injectable()
export class LessonLogsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryLessonLogDto) {
    const where: Prisma.LessonLogWhereInput = {
      ...(query.classId ? { classId: query.classId } : {}),
      ...(query.teacherId ? { teacherId: query.teacherId } : {}),
    };

    if (query.year) {
      const m = query.month ? query.month - 1 : 0;
      const start = new Date(Date.UTC(query.year, m, 1));
      const end = query.month
        ? new Date(Date.UTC(query.year, m + 1, 1))
        : new Date(Date.UTC(query.year + 1, 0, 1));
      where.date = { gte: start, lt: end };
    }

    return this.prisma.lessonLog.findMany({
      where,
      include: INCLUDE,
      orderBy: [{ date: 'asc' }, { jamKe: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(id: string) {
    const log = await this.prisma.lessonLog.findUnique({
      where: { id },
      include: INCLUDE,
    });
    if (!log) throw new NotFoundException('Entri batas pelajaran tidak ditemukan');
    return log;
  }

  async create(dto: CreateLessonLogDto, user: JwtUser) {
    const kelas = await this.prisma.class.findUnique({
      where: { id: dto.classId },
      select: { academicYear: true },
    });
    if (!kelas) throw new NotFoundException('Kelas tidak ditemukan');

    return this.prisma.lessonLog.create({
      data: {
        classId: dto.classId,
        subjectId: dto.subjectId ?? null,
        teacherId: dto.teacherId ?? user.userId,
        date: new Date(dto.date),
        jamKe: dto.jamKe,
        namaSiswa: dto.namaSiswa ?? null,
        pokokBahasan: dto.pokokBahasan,
        metode: dto.metode ?? null,
        selesai: dto.selesai ?? true,
        siswaTidakHadir: dto.siswaTidakHadir ?? null,
        refleksi: dto.refleksi ?? null,
        tindakLanjut: dto.tindakLanjut ?? null,
        academicYear: kelas.academicYear,
      },
      include: INCLUDE,
    });
  }

  async update(id: string, dto: UpdateLessonLogDto, user: JwtUser) {
    const log = await this.findOne(id);
    // Guru hanya boleh mengubah entri miliknya; admin bebas.
    if (user.role === Role.GURU && log.teacherId !== user.userId) {
      throw new ForbiddenException('Hanya dapat mengubah entri milik sendiri');
    }

    return this.prisma.lessonLog.update({
      where: { id },
      data: {
        subjectId: dto.subjectId,
        teacherId: dto.teacherId,
        date: dto.date ? new Date(dto.date) : undefined,
        jamKe: dto.jamKe,
        namaSiswa: dto.namaSiswa,
        pokokBahasan: dto.pokokBahasan,
        metode: dto.metode,
        selesai: dto.selesai,
        siswaTidakHadir: dto.siswaTidakHadir,
        refleksi: dto.refleksi,
        tindakLanjut: dto.tindakLanjut,
      },
      include: INCLUDE,
    });
  }

  async remove(id: string, user: JwtUser) {
    const log = await this.findOne(id);
    if (user.role === Role.GURU && log.teacherId !== user.userId) {
      throw new ForbiddenException('Hanya dapat menghapus entri milik sendiri');
    }
    await this.prisma.lessonLog.delete({ where: { id } });
    return { message: 'Entri batas pelajaran dihapus' };
  }

  /**
   * Daftar siswa tidak hadir suatu kelas pada tanggal tertentu, diambil dari
   * data presensi (status selain HADIR). Dipakai untuk prefill kolom
   * "Siswa Tidak Hadir" pada form buku batas.
   */
  async suggestAbsent(classId: string, dateStr: string) {
    const { start, end } = dayRange(dateStr);
    const records = await this.prisma.attendance.findMany({
      where: {
        status: { not: AttendanceStatus.HADIR },
        session: { classId, sessionDate: { gte: start, lt: end } },
      },
      select: {
        status: true,
        student: { select: { id: true, fullName: true } },
      },
      orderBy: { student: { fullName: 'asc' } },
    });

    // Dedup per siswa (bila tercatat di beberapa sesi pada hari yang sama).
    const seen = new Map<string, { name: string; status: AttendanceStatus }>();
    for (const r of records) {
      if (!seen.has(r.student.id)) {
        seen.set(r.student.id, { name: r.student.fullName, status: r.status });
      }
    }
    const items = [...seen.values()];
    const text = items
      .map((i) => `${i.name} (${STATUS_LABEL[i.status]})`)
      .join(', ');
    return { items, text };
  }
}
