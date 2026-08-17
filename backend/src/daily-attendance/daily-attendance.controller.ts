import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { DailyAttendanceService } from './daily-attendance.service';
import { SaveDailyAttendanceDto } from './dto/save-daily-attendance.dto';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentUser,
  JwtUser,
} from '../common/decorators/current-user.decorator';

@Controller('daily-attendance')
export class DailyAttendanceController {
  constructor(private readonly service: DailyAttendanceService) {}

  // Daftar murid + status pada tanggal; scope via classId / studentId (opsional).
  @Roles(Role.ADMIN, Role.PIKET)
  @Get('roster')
  roster(
    @Query('date') date: string,
    @Query('classId') classId?: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.service.roster(
      date ?? new Date().toISOString().slice(0, 10),
      classId || undefined,
      studentId || undefined,
    );
  }

  @Roles(Role.ADMIN, Role.PIKET)
  @Put()
  save(@Body() dto: SaveDailyAttendanceDto, @CurrentUser() user: JwtUser) {
    return this.service.save(dto, user);
  }

  @Roles(Role.ADMIN, Role.PIKET)
  @Get('summary')
  summary(@Query('date') date: string, @Query('classId') classId?: string) {
    return this.service.summary(
      date ?? new Date().toISOString().slice(0, 10),
      classId || undefined,
    );
  }

  // Kirim rekap harian ke WhatsApp admin (dan kembalikan pratinjau pesannya).
  @Roles(Role.ADMIN, Role.PIKET)
  @Post('send-wa')
  sendWa(@Query('date') date: string, @Query('classId') classId?: string) {
    return this.service.sendWa(
      date ?? new Date().toISOString().slice(0, 10),
      classId || undefined,
    );
  }
}
