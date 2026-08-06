import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { QueryStudentDto } from './dto/query-student.dto';
import { LinkParentDto } from './dto/link-parent.dto';
import { JwtUser } from '../common/decorators/current-user.decorator';
import { assertStudentAccess } from '../common/student-access';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryStudentDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const where: Prisma.StudentWhereInput = {
      ...(query.classId ? { classId: query.classId } : {}),
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: 'insensitive' } },
              { nisn: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        include: {
          class: { select: { id: true, name: true } },
          // Sertakan tautan akun orang tua agar tabel murid bisa menampilkan
          // status "sudah/belum ditautkan" beserta akun ortu yang ditautkan.
          parents: {
            include: {
              parent: { select: { id: true, fullName: true, email: true } },
            },
          },
        },
        orderBy: { fullName: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.student.count({ where }),
    ]);

    return { data, meta: { total, page, limit } };
  }

  // requester opsional: bila diisi (endpoint publik), validasi kepemilikan.
  // Pemanggilan internal (admin-only) memanggil tanpa requester.
  async findOne(id: string, requester?: JwtUser) {
    if (requester) {
      await assertStudentAccess(this.prisma, requester, id);
    }
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        class: { select: { id: true, name: true } },
        parents: {
          include: {
            parent: { select: { id: true, fullName: true, email: true, phone: true } },
          },
        },
      },
    });
    if (!student) {
      throw new NotFoundException('Murid tidak ditemukan');
    }
    return student;
  }

  // Murid milik user saat ini: ORTU -> anak-anaknya, MURID -> dirinya sendiri.
  async findMine(userId: string, role: string) {
    const where: Prisma.StudentWhereInput =
      role === Role.MURID
        ? { userId }
        : { parents: { some: { parentUserId: userId } } };

    return this.prisma.student.findMany({
      where,
      include: { class: { select: { id: true, name: true } } },
      orderBy: { fullName: 'asc' },
    });
  }

  async create(dto: CreateStudentDto) {
    // NISN opsional: kosong disimpan sebagai null (unik hanya berlaku bila diisi).
    const nisn = dto.nisn?.trim() || null;
    if (nisn) {
      await this.ensureNisnUnique(nisn);
    }
    if (dto.classId) {
      await this.ensureClassExists(dto.classId);
    }
    return this.prisma.student.create({
      data: {
        nisn,
        nis: dto.nis,
        fullName: dto.fullName,
        classId: dto.classId,
        gender: dto.gender,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        address: dto.address,
      },
    });
  }

  async update(id: string, dto: UpdateStudentDto) {
    await this.findOne(id);
    // undefined = field tak diubah; '' = dikosongkan -> null.
    const nisn =
      dto.nisn === undefined ? undefined : dto.nisn.trim() || null;
    if (nisn) {
      await this.ensureNisnUnique(nisn, id);
    }
    if (dto.classId) {
      await this.ensureClassExists(dto.classId);
    }
    return this.prisma.student.update({
      where: { id },
      data: {
        nisn,
        nis: dto.nis,
        fullName: dto.fullName,
        classId: dto.classId,
        gender: dto.gender,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        address: dto.address,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.student.delete({ where: { id } });
    return { message: 'Murid berhasil dihapus' };
  }

  // Tautkan akun orang tua/wali ke murid (penerima notifikasi)
  async linkParent(studentId: string, dto: LinkParentDto) {
    await this.findOne(studentId);
    const parent = await this.prisma.user.findUnique({
      where: { id: dto.parentUserId },
    });
    if (!parent || parent.role !== Role.ORTU) {
      throw new BadRequestException('User bukan akun orang tua (ORTU)');
    }
    return this.prisma.studentParent.upsert({
      where: {
        studentId_parentUserId: {
          studentId,
          parentUserId: dto.parentUserId,
        },
      },
      create: {
        studentId,
        parentUserId: dto.parentUserId,
        relation: dto.relation,
      },
      update: { relation: dto.relation },
    });
  }

  async unlinkParent(studentId: string, parentUserId: string) {
    await this.prisma.studentParent.deleteMany({
      where: { studentId, parentUserId },
    });
    return { message: 'Wali berhasil dilepas dari murid' };
  }

  private async ensureNisnUnique(nisn: string, exceptId?: string) {
    const existing = await this.prisma.student.findUnique({ where: { nisn } });
    if (existing && existing.id !== exceptId) {
      throw new ConflictException('NISN sudah terdaftar');
    }
  }

  private async ensureClassExists(classId: string) {
    const kelas = await this.prisma.class.findUnique({ where: { id: classId } });
    if (!kelas) {
      throw new BadRequestException('Kelas tujuan tidak ditemukan');
    }
  }
}
