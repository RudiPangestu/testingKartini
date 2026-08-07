import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Kelas yang "diampu" seorang guru: kelas tempat ia wali kelas (homeroom),
 * kelas tempat ia mengajar minimal satu jadwal, ATAU kelas tempat ia
 * ditugaskan sebagai guru pengampu mapel (SubjectTeacher).
 */
export async function teacherClassIds(
  prisma: PrismaService,
  userId: string,
): Promise<string[]> {
  const [homeroom, schedules, assignments] = await Promise.all([
    prisma.class.findMany({
      where: { homeroomTeacherId: userId },
      select: { id: true },
    }),
    prisma.schedule.findMany({
      where: { teacherId: userId },
      select: { classId: true },
    }),
    prisma.subjectTeacher.findMany({
      where: { teacherId: userId },
      select: { classId: true },
    }),
  ]);
  const set = new Set<string>();
  homeroom.forEach((c) => set.add(c.id));
  schedules.forEach((s) => set.add(s.classId));
  assignments.forEach((a) => set.add(a.classId));
  return [...set];
}

export async function assertTeacherManagesClass(
  prisma: PrismaService,
  userId: string,
  classId: string,
): Promise<void> {
  const ids = await teacherClassIds(prisma, userId);
  if (!ids.includes(classId)) {
    throw new ForbiddenException('Guru tidak mengampu kelas ini');
  }
}
