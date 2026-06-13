import { Test } from '@nestjs/testing';
import { SchedulerService } from './scheduler.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('SchedulerService.cleanupRefreshTokens', () => {
  let service: SchedulerService;
  const deleteMany = jest.fn().mockResolvedValue({ count: 3 });

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        SchedulerService,
        {
          provide: PrismaService,
          useValue: { refreshToken: { deleteMany } },
        },
        { provide: NotificationsService, useValue: {} },
      ],
    }).compile();
    service = moduleRef.get(SchedulerService);
    deleteMany.mockClear();
  });

  it('menghapus refresh token yang kedaluwarsa ATAU sudah dicabut', async () => {
    await service.cleanupRefreshTokens();

    expect(deleteMany).toHaveBeenCalledTimes(1);
    const where = deleteMany.mock.calls[0][0].where;
    expect(where.OR).toEqual([
      { expiresAt: { lt: expect.any(Date) } },
      { revokedAt: { not: null } },
    ]);
  });
});
