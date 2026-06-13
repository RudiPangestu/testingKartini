import { Test } from '@nestjs/testing';
import { AttendanceSource, AttendanceStatus } from '@prisma/client';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '../prisma/prisma.service';
import { TermsService } from '../terms/terms.module';
import { NotificationsService } from '../notifications/notifications.service';

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
    schedule: { subject: { name: 'Matematika' }, class: { id: 'c1', name: 'XII' } },
    event: null,
    records: [],
  };

  const prisma = {
    attendanceSession: { findUnique: jest.fn().mockResolvedValue(session) },
    attendance: { upsert: jest.fn().mockReturnValue({}) },
    $transaction: jest.fn().mockResolvedValue([]),
    student: {
      findUnique: jest.fn().mockResolvedValue({ fullName: 'Budi' }),
    },
  };
  const notifications = { notifyParentsOfStudent: jest.fn().mockResolvedValue(undefined) };
  const terms = { findContaining: jest.fn() };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: PrismaService, useValue: prisma },
        { provide: TermsService, useValue: terms },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();
    service = moduleRef.get(AttendanceService);
    notifications.notifyParentsOfStudent.mockClear();
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
      'guru-1',
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
      'guru-1',
    );

    expect(notifications.notifyParentsOfStudent).toHaveBeenCalledTimes(2);
  });
});
