import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ClassesModule } from './classes/classes.module';
import { StudentsModule } from './students/students.module';
import { SubjectsModule } from './subjects/subjects.module';
import { SchedulesModule } from './schedules/schedules.module';
import { EventsModule } from './events/events.module';
import { TermsModule } from './terms/terms.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ReportsModule } from './reports/reports.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    ClassesModule,
    StudentsModule,
    SubjectsModule,
    SchedulesModule,
    EventsModule,
    TermsModule,
    NotificationsModule,
    AttendanceModule,
    ReportsModule,
    SchedulerModule,
  ],
})
export class AppModule {}
