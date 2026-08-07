import { Test } from '@nestjs/testing';
import { AttendanceSource, AttendanceStatus } from '@prisma/client';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '../prisma/prisma.service';
import { TermsService } from '../terms/terms.module';
import { NotificationsService } from '../notifications/notifications.service';
import { SettingsService } from '../settings/settings.module';

/**
 * Memastikan saat presensi disimpan, notifikasi ke orang tua HANYA dipicu
 * untuk status SAKIT / IZIN / ALPHA — tidak untuk HADIR.
 */
describe('AttendanceService (pemicu notifikasi)', () => {
  let service: AttendanceService;

  const session = {
    id: 'sess-1',
    sourceType: AttendanceSource.SCHEDULE,
    sessionDate: new Date('2026-06-13'),
    schedule: {
      teacherId: 'guru-1',
      subjectId: 'mtk',
      classId: 'c1',
      subject: { name: 'Matematika' },
      class: { id: 'c1', name: 'XII' },
    },
    event: null,
    records: [],
  };

  const guru1 = { userId: 'guru-1', email: 'g1@kartini.sch.id', role: 'GURU' };

  const prisma = {
    attendanceSession: { findUnique: jest.fn().mockResolvedValue(session) },
    attendance: {
      upsert: jest.fn().mockReturnValue({}),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    // Default: tidak ada penugasan SubjectTeacher (guru lain tetap ditolak).
    subjectTeacher: { findUnique: jest.fn().mockResolvedValue(null) },
    $transaction: jest.fn().mockResolvedValue([]),
    student: {
      findUnique: jest.fn().mockResolvedValue({ fullName: 'Budi' }),
    },
  };
  const notifications = { notifyParentsOfStudent: jest.fn().mockResolvedValue(undefined) };
  const terms = { findContaining: jest.fn() };
  const settings = {
    get: jest.fn().mockResolvedValue({
      notifyStatuses: ['SAKIT', 'IZIN', 'ALPHA'],
      attendanceTemplate: '{nama} {status}',
    }),
    render: (t: string, v: Record<string, string>) =>
      t.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? ''),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: PrismaService, useValue: prisma },
        { provide: TermsService, useValue: terms },
        { provide: NotificationsService, useValue: notifications },
        { provide: SettingsService, useValue: settings },
      ],
    }).compile();
    service = moduleRef.get(AttendanceService);
    notifications.notifyParentsOfStudent.mockClear();
    prisma.subjectTeacher.findUnique.mockResolvedValue(null);
    prisma.attendance.groupBy.mockResolvedValue([]);
  });

  it('memicu notifikasi untuk ALPHA, tidak untuk HADIR', async () => {
    await service.saveAttendance(
      'sess-1',
      {
        records: [
          { studentId: 'hadir-1', status: AttendanceStatus.HADIR },
          { studentId: 'alpha-1', status: AttendanceStatus.ALPHA },
        ],
      },
      guru1,
    );

    expect(notifications.notifyParentsOfStudent).toHaveBeenCalledTimes(1);
    expect(notifications.notifyParentsOfStudent).toHaveBeenCalledWith(
      'alpha-1',
      expect.objectContaining({ type: 'KEHADIRAN' }),
    );
  });

  it('memicu notifikasi untuk SAKIT dan IZIN', async () => {
    await service.saveAttendance(
      'sess-1',
      {
        records: [
          { studentId: 's1', status: AttendanceStatus.SAKIT },
          { studentId: 's2', status: AttendanceStatus.IZIN },
        ],
      },
      guru1,
    );

    expect(notifications.notifyParentsOfStudent).toHaveBeenCalledTimes(2);
  });

  it('menolak guru yang bukan pengampu jadwal', async () => {
    const guruLain = { userId: 'guru-2', email: 'g2@kartini.sch.id', role: 'GURU' };
    await expect(
      service.saveAttendance(
        'sess-1',
        { records: [{ studentId: 's1', status: AttendanceStatus.SAKIT }] },
        guruLain,
      ),
    ).rejects.toThrow('Guru hanya dapat presensi pada jadwal yang diampu');
    expect(notifications.notifyParentsOfStudent).not.toHaveBeenCalled();
  });

  it('mengizinkan ADMIN menyimpan presensi sesi guru mana pun', async () => {
    const admin = { userId: 'admin-1', email: 'a@kartini.sch.id', role: 'ADMIN' };
    await service.saveAttendance(
      'sess-1',
      { records: [{ studentId: 's1', status: AttendanceStatus.HADIR }] },
      admin,
    );
    // Tidak melempar = lolos (HADIR tidak memicu notifikasi).
    expect(notifications.notifyParentsOfStudent).not.toHaveBeenCalled();
  });

  it('mengizinkan guru lain yang DITUGASKAN via SubjectTeacher', async () => {
    // Ada penugasan mapel+kelas untuk guru-2 -> boleh presensi.
    prisma.subjectTeacher.findUnique.mockResolvedValue({ id: 'st-1' });
    const guruLain = { userId: 'guru-2', email: 'g2@kartini.sch.id', role: 'GURU' };
    await service.saveAttendance(
      'sess-1',
      { records: [{ studentId: 's1', status: AttendanceStatus.HADIR }] },
      guruLain,
    );
    expect(prisma.subjectTeacher.findUnique).toHaveBeenCalledWith({
      where: {
        subjectId_classId_teacherId: {
          subjectId: 'mtk',
          classId: 'c1',
          teacherId: 'guru-2',
        },
      },
    });
  });

  it('telatCounts mengembalikan jumlah TELAT per murid dalam periode', async () => {
    terms.findContaining.mockResolvedValue({
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-06-30'),
    });
    prisma.attendance.groupBy.mockResolvedValue([
      { studentId: 'a', _count: { _all: 3 } },
      { studentId: 'b', _count: { _all: 1 } },
    ]);
    const res = await service.telatCounts('c1', '2026-03-01');
    expect(res).toEqual({ a: 3, b: 1 });
    // Hanya status TELAT yang dihitung.
    expect(prisma.attendance.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: AttendanceStatus.TELAT }),
      }),
    );
  });
});
