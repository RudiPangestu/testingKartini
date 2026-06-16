import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { AttendanceStatus, Role } from '@prisma/client';
import { Response } from 'express';
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
    @Query('subjectId') subjectId?: string,
  ) {
    return this.service.general(period, date, termId, subjectId);
  }

  // Persentase individual: period=triwulan|semester|year
  @Roles(Role.ADMIN, Role.GURU, Role.ORTU, Role.MURID)
  @Get('student/:studentId')
  student(
    @Param('studentId') studentId: string,
    @CurrentUser() user: JwtUser,
    @Query('period') period = 'semester',
    @Query('termId') termId?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.service.student(studentId, period, termId, user, subjectId);
  }

  // Tren kehadiran per hari (untuk grafik). Filter opsional studentId/classId.
  @Roles(Role.ADMIN, Role.GURU, Role.ORTU, Role.MURID)
  @Get('trend')
  trend(
    @CurrentUser() user: JwtUser,
    @Query('days') days?: string,
    @Query('studentId') studentId?: string,
    @Query('classId') classId?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.service.trend(
      { studentId, classId, subjectId, days: days ? Number(days) : undefined },
      user,
    );
  }

  // Export rekap absensi ke Excel (.xlsx) sesuai filter.
  // Query: classId, studentId, subjectId, start, end (YYYY-MM-DD), status.
  @Roles(Role.ADMIN, Role.GURU)
  @Get('export')
  async export(
    @CurrentUser() user: JwtUser,
    @Res() res: Response,
    @Query('classId') classId?: string,
    @Query('studentId') studentId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('status') status?: AttendanceStatus,
  ) {
    const buffer = await this.service.exportXlsx(
      { classId, studentId, subjectId, start, end, status },
      user,
    );
    const stamp = new Date().toISOString().slice(0, 10);
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="absensi-${stamp}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Roles(Role.ADMIN, Role.GURU)
  @Get('class/:classId')
  byClass(
    @Param('classId') classId: string,
    @CurrentUser() user: JwtUser,
    @Query('period') period = 'month',
    @Query('date') date?: string,
    @Query('termId') termId?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.service.byClass(classId, period, date, termId, user, subjectId);
  }
}
