import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtUser } from './decorators/current-user.decorator';

/**
 * Memastikan user berhak mengakses data seorang murid.
 * - ADMIN & GURU: selalu boleh.
 * - MURID: hanya data dirinya sendiri (student.userId === user).
 * - ORTU: hanya murid yang tertaut padanya (StudentParent).
 * Selain itu -> ForbiddenException.
 */
export async function assertStudentAccess(
  prisma: PrismaService,
  user: JwtUser,
  studentId: string,
): Promise<void> {
  if (user.role === Role.ADMIN || user.role === Role.GURU) {
    return;
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { userId: true },
  });
  if (!student) {
    throw new NotFoundException('Murid tidak ditemukan');
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
