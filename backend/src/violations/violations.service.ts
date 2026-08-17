import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtUser } from '../common/decorators/current-user.decorator';
import {
  CreateViolationDto,
  CreateViolationTypeDto,
  UpdateViolationTypeDto,
} from './dto/violation.dto';

@Injectable()
export class ViolationsService {
  constructor(private prisma: PrismaService) {}

  // ---------- KATALOG (ViolationType) ----------

  listTypes(includeInactive = false) {
    return this.prisma.violationType.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: [{ level: 'asc' }, { category: 'asc' }, { points: 'asc' }],
    });
  }

  createType(dto: CreateViolationTypeDto) {
    return this.prisma.violationType.create({ data: dto });
  }

  async updateType(id: string, dto: UpdateViolationTypeDto) {
    await this.getType(id);
    return this.prisma.violationType.update({ where: { id }, data: dto });
  }

  async removeType(id: string) {
    await this.getType(id);
    // Jangan hapus bila sudah dipakai riwayat — nonaktifkan saja agar riwayat
    // (yang menyimpan snapshot) tetap utuh dan referensinya tidak putus.
    const used = await this.prisma.studentViolation.count({
      where: { typeId: id },
    });
    if (used > 0) {
      return this.prisma.violationType.update({
        where: { id },
        data: { active: false },
      });
    }
    await this.prisma.violationType.delete({ where: { id } });
    return { message: 'Jenis pelanggaran dihapus' };
  }

  private async getType(id: string) {
    const t = await this.prisma.violationType.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Jenis pelanggaran tidak ditemukan');
    return t;
  }

  // ---------- CATATAN PELANGGARAN MURID ----------

  async record(dto: CreateViolationDto, user: JwtUser) {
    let description = dto.description?.trim();
    let points = dto.points;

    if (dto.typeId) {
      const t = await this.getType(dto.typeId);
      description = t.name;
      points = t.points;
    }
    if (!description) {
      throw new BadRequestException('Deskripsi pelanggaran wajib diisi');
    }
    if (points == null) {
      throw new BadRequestException('Poin wajib diisi');
    }

    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
      select: { id: true },
    });
    if (!student) throw new BadRequestException('Murid tidak ditemukan');

    return this.prisma.studentViolation.create({
      data: {
        studentId: dto.studentId,
        typeId: dto.typeId ?? null,
        description,
        points,
        date: new Date(dto.date),
        note: dto.note,
        recordedById: user.userId,
      },
    });
  }

  async listByStudent(studentId: string) {
    const records = await this.prisma.studentViolation.findMany({
      where: { studentId },
      include: {
        type: { select: { level: true, category: true } },
        recordedBy: { select: { fullName: true } },
      },
      orderBy: { date: 'desc' },
    });
    const totalPoints = records.reduce((sum, r) => sum + r.points, 0);
    return { studentId, totalPoints, count: records.length, records };
  }

  async removeRecord(id: string) {
    const rec = await this.prisma.studentViolation.findUnique({
      where: { id },
    });
    if (!rec) throw new NotFoundException('Catatan pelanggaran tidak ditemukan');
    await this.prisma.studentViolation.delete({ where: { id } });
    return { message: 'Catatan pelanggaran dihapus' };
  }
}
