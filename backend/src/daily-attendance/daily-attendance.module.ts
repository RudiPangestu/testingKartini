import { Module } from '@nestjs/common';
import { DailyAttendanceService } from './daily-attendance.service';
import { DailyAttendanceController } from './daily-attendance.controller';
import { WaService } from '../notifications/channels/wa.service';

@Module({
  controllers: [DailyAttendanceController],
  providers: [DailyAttendanceService, WaService],
})
export class DailyAttendanceModule {}
