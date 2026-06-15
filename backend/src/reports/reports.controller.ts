import { Controller, Get, Param, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ReportsService } from './reports.service';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentUser,
  JwtUser,
} from '../common/decorators/current-user.decorator';

@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  // Persentase umum: period=day|week|month|mid|semester|year
  @Roles(Role.ADMIN, Role.GURU)
  @Get('general')
  general(
    @Query('period') period = 'month',
    @Query('date') date?: string,
    @Query('termId') termId?: string,
  ) {
    return this.service.general(period, date, termId);
  }

  // Persentase individual: period=triwulan|semester|year
  @Roles(Role.ADMIN, Role.GURU, Role.ORTU, Role.MURID)
  @Get('student/:studentId')
  student(
    @Param('studentId') studentId: string,
    @CurrentUser() user: JwtUser,
    @Query('period') period = 'semester',
    @Query('termId') termId?: string,
  ) {
    return this.service.student(studentId, period, termId, user);
  }

  // Tren kehadiran per hari (untuk grafik). Filter opsional studentId/classId.
  @Roles(Role.ADMIN, Role.GURU, Role.ORTU, Role.MURID)
  @Get('trend')
  trend(
    @CurrentUser() user: JwtUser,
    @Query('days') days?: string,
    @Query('studentId') studentId?: string,
    @Query('classId') classId?: string,
  ) {
    return this.service.trend(
      { studentId, classId, days: days ? Number(days) : undefined },
      user,
    );
  }

  @Roles(Role.ADMIN, Role.GURU)
  @Get('class/:classId')
  byClass(
    @Param('classId') classId: string,
    @CurrentUser() user: JwtUser,
    @Query('period') period = 'month',
    @Query('date') date?: string,
    @Query('termId') termId?: string,
  ) {
    return this.service.byClass(classId, period, date, termId, user);
  }
}
