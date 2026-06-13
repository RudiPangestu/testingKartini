import { Test } from '@nestjs/testing';
import { AttendanceStatus } from '@prisma/client';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Unit test logika perhitungan persentase kehadiran.
 * Kebijakan sekolah: Sakit & Izin TIDAK dihitung sebagai Alpha.
 *  - hadirEfektifPct  = HADIR / total
 *  - kehadiranSahPct  = (HADIR + SAKIT + IZIN) / total
 *  - alphaPct         = ALPHA / total
 */
describe('ReportsService (perhitungan persentase)', () => {
  let service: ReportsService;
  const groupBy = jest.fn();

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: PrismaService,
          useValue: {
            attendance: { groupBy },
            // tidak terpakai untuk period 'month' (tidak berbasis term)
            term: { findUnique: jest.fn(), findFirst: jest.fn() },
            student: { findUnique: jest.fn() },
          },
        },
      ],
    }).compile();

    service = moduleRef.get(ReportsService);
    groupBy.mockReset();
  });

  function mockCounts(h: number, s: number, i: number, a: number) {
    groupBy.mockResolvedValue([
      { status: AttendanceStatus.HADIR, _count: { _all: h } },
      { status: AttendanceStatus.SAKIT, _count: { _all: s } },
      { status: AttendanceStatus.IZIN, _count: { _all: i } },
      { status: AttendanceStatus.ALPHA, _count: { _all: a } },
    ]);
  }

  it('menghitung 1 Hadir / 1 Sakit / 1 Izin / 1 Alpha dengan benar', async () => {
    mockCounts(1, 1, 1, 1);
    const r = await service.general('month', '2026-06-13');

    expect(r.total).toBe(4);
    expect(r.hadirEfektifPct).toBe(25); // 1/4
    expect(r.kehadiranSahPct).toBe(75); // 3/4 (Sakit & Izin BUKAN Alpha)
    expect(r.alphaPct).toBe(25); // 1/4
  });

  it('Sakit & Izin tidak menambah Alpha (semua hadir-sah, 0% alpha)', async () => {
    mockCounts(2, 1, 1, 0);
    const r = await service.general('month', '2026-06-13');

    expect(r.total).toBe(4);
    expect(r.kehadiranSahPct).toBe(100);
    expect(r.alphaPct).toBe(0);
    expect(r.hadirEfektifPct).toBe(50); // hanya 2 HADIR dari 4
  });

  it('mengembalikan 0% saat belum ada data', async () => {
    mockCounts(0, 0, 0, 0);
    const r = await service.general('month', '2026-06-13');

    expect(r.total).toBe(0);
    expect(r.hadirEfektifPct).toBe(0);
    expect(r.kehadiranSahPct).toBe(0);
    expect(r.alphaPct).toBe(0);
  });

  it('membulatkan persentase 2 desimal (1 dari 3 = 33.33%)', async () => {
    mockCounts(1, 0, 0, 2);
    const r = await service.general('month', '2026-06-13');

    expect(r.total).toBe(3);
    expect(r.hadirEfektifPct).toBeCloseTo(33.33, 2);
    expect(r.alphaPct).toBeCloseTo(66.67, 2);
  });
});
