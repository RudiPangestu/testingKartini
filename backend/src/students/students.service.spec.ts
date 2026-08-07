import { Test } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { StudentsService } from './students.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Unit test kebijakan NISN opsional pada pembuatan murid.
 * - NISN boleh kosong -> disimpan sebagai null, tanpa cek keunikan.
 * - NISN yang diisi -> tetap wajib unik.
 */
describe('StudentsService (NISN opsional)', () => {
  let service: StudentsService;
  const student = {
    findUnique: jest.fn(),
    create: jest.fn().mockImplementation(({ data }) => Promise.resolve(data)),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: { student } },
      ],
    }).compile();
    service = moduleRef.get(StudentsService);
    student.findUnique.mockReset();
    student.create.mockClear();
  });

  it('membuat murid tanpa NISN -> nisn null, tanpa cek keunikan', async () => {
    const res = await service.create({ fullName: 'Tanpa NISN' } as never);
    expect(res.nisn).toBeNull();
    expect(student.findUnique).not.toHaveBeenCalled();
  });

  it('NISN berisi spasi dianggap kosong -> null', async () => {
    const res = await service.create({
      fullName: 'Spasi',
      nisn: '   ',
    } as never);
    expect(res.nisn).toBeNull();
    expect(student.findUnique).not.toHaveBeenCalled();
  });

  it('NISN yang diisi tetap dicek unik (duplikat -> ConflictException)', async () => {
    student.findUnique.mockResolvedValue({ id: 'lain', nisn: '123' });
    await expect(
      service.create({ fullName: 'Dup', nisn: '123' } as never),
    ).rejects.toThrow(ConflictException);
  });

  it('NISN unik yang diisi -> tersimpan apa adanya', async () => {
    student.findUnique.mockResolvedValue(null);
    const res = await service.create({ fullName: 'Ok', nisn: '999' } as never);
    expect(res.nisn).toBe('999');
    expect(student.findUnique).toHaveBeenCalledWith({ where: { nisn: '999' } });
  });
});
