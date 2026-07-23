import { Module } from '@nestjs/common';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from '../common/decorators/roles.decorator';

class CreateSubjectDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama mata pelajaran wajib diisi' })
  name: string;

  @IsOptional()
  @IsString()
  code?: string;
}

class UpdateSubjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;
}

class AssignTeacherDto {
  @IsUUID(undefined, { message: 'classId tidak valid' })
  classId: string;

  @IsUUID(undefined, { message: 'teacherId tidak valid' })
  teacherId: string;
}

@Injectable()
class SubjectsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.subject.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const subject = await this.prisma.subject.findUnique({ where: { id } });
    if (!subject) throw new NotFoundException('Mata pelajaran tidak ditemukan');
    return subject;
  }

  create(dto: CreateSubjectDto) {
    return this.prisma.subject.create({ data: dto });
  }

  async update(id: string, dto: UpdateSubjectDto) {
    await this.findOne(id);
    return this.prisma.subject.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.subject.delete({ where: { id } });
    return { message: 'Mata pelajaran berhasil dihapus' };
  }

  // ---------- PENUGASAN GURU (per kelas) ----------

  listTeachers(subjectId: string) {
    return this.prisma.subjectTeacher.findMany({
      where: { subjectId },
      include: {
        class: { select: { id: true, name: true } },
        teacher: { select: { id: true, fullName: true } },
      },
      orderBy: [{ class: { name: 'asc' } }, { teacher: { fullName: 'asc' } }],
    });
  }

  async assignTeacher(subjectId: string, dto: AssignTeacherDto) {
    await this.findOne(subjectId);

    const teacher = await this.prisma.user.findUnique({
      where: { id: dto.teacherId },
      select: { role: true },
    });
    if (!teacher) throw new BadRequestException('Guru tidak ditemukan');
    if (teacher.role !== Role.GURU)
      throw new BadRequestException('Pengguna yang dipilih bukan guru');

    const kelas = await this.prisma.class.findUnique({
      where: { id: dto.classId },
      select: { id: true },
    });
    if (!kelas) throw new BadRequestException('Kelas tidak ditemukan');

    const existing = await this.prisma.subjectTeacher.findUnique({
      where: {
        subjectId_classId_teacherId: {
          subjectId,
          classId: dto.classId,
          teacherId: dto.teacherId,
        },
      },
    });
    if (existing)
      throw new BadRequestException(
        'Guru ini sudah ditugaskan pada mapel & kelas tersebut',
      );

    return this.prisma.subjectTeacher.create({
      data: { subjectId, classId: dto.classId, teacherId: dto.teacherId },
      include: {
        class: { select: { id: true, name: true } },
        teacher: { select: { id: true, fullName: true } },
      },
    });
  }

  async removeAssignment(assignmentId: string) {
    const found = await this.prisma.subjectTeacher.findUnique({
      where: { id: assignmentId },
    });
    if (!found) throw new NotFoundException('Penugasan tidak ditemukan');
    await this.prisma.subjectTeacher.delete({ where: { id: assignmentId } });
    return { message: 'Penugasan guru dihapus' };
  }
}

@Controller('subjects')
class SubjectsController {
  constructor(private readonly service: SubjectsService) {}

  @Roles(Role.ADMIN, Role.GURU)
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Roles(Role.ADMIN, Role.GURU)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateSubjectDto) {
    return this.service.create(dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSubjectDto) {
    return this.service.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // ---------- Penugasan guru per kelas ----------

  @Roles(Role.ADMIN, Role.GURU)
  @Get(':id/teachers')
  listTeachers(@Param('id') id: string) {
    return this.service.listTeachers(id);
  }

  @Roles(Role.ADMIN)
  @Post(':id/teachers')
  assignTeacher(@Param('id') id: string, @Body() dto: AssignTeacherDto) {
    return this.service.assignTeacher(id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete('teachers/:assignmentId')
  removeAssignment(@Param('assignmentId') assignmentId: string) {
    return this.service.removeAssignment(assignmentId);
  }
}

@Module({
  controllers: [SubjectsController],
  providers: [SubjectsService],
  exports: [SubjectsService],
})
export class SubjectsModule {}
