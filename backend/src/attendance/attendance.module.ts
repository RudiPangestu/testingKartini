import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { TermsModule } from '../terms/terms.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TermsModule, NotificationsModule],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
