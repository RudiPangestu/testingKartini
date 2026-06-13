import { Controller, Get, Param, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ReportsService } from './reports.service';
import { Roles } from '../common/decorators/roles.decorator';

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
    @Query('period') period = 'semester',
    @Query('termId') termId?: string,
  ) {
    return this.service.student(studentId, period, termId);
  }

  @Roles(Role.ADMIN, Role.GURU)
  @Get('class/:classId')
  byClass(
    @Param('classId') classId: string,
    @Query('period') period = 'month',
    @Query('date') date?: string,
    @Query('termId') termId?: string,
  ) {
    return this.service.byClass(classId, period, date, termId);
  }
}
