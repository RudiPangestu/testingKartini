import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtUser } from './decorators/current-user.decorator';
import { teacherClassIds } from './teacher-scope';

/**
 * Memastikan user berhak mengakses data seorang murid.
 * - ADMIN: selalu boleh.
 * - GURU: hanya murid pada kelas yang ia ampu.
 * - MURID: hanya data dirinya sendiri (student.userId === user).
 * - ORTU: hanya murid yang tertaut padanya (StudentParent).
 * Selain itu -> ForbiddenException.
 */
export async function assertStudentAccess(
  prisma: PrismaService,
  user: JwtUser,
  studentId: string,
): Promise<void> {
  if (user.role === Role.ADMIN) {
    return;
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { userId: true, classId: true },
  });
  if (!student) {
    throw new NotFoundException('Murid tidak ditemukan');
  }

  if (user.role === Role.GURU) {
    const ids = await teacherClassIds(prisma, user.userId);
    if (student.classId && ids.includes(student.classId)) return;
  }

  if (user.role === Role.MURID && student.userId === user.userId) {
    return;
  }

  if (user.role === Role.ORTU) {
    const link = await prisma.studentParent.findFirst({
      where: { studentId, parentUserId: user.userId },
      select: { id: true },
    });
    if (link) return;
  }

  throw new ForbiddenException('Anda tidak berhak mengakses data murid ini');
}
