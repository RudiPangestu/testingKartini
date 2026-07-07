import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './common/audit/audit.interceptor';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ClassesModule } from './classes/classes.module';
import { StudentsModule } from './students/students.module';
import { SubjectsModule } from './subjects/subjects.module';
import { SchedulesModule } from './schedules/schedules.module';
import { EventsModule } from './events/events.module';
import { TermsModule } from './terms/terms.module';
import { SettingsModule } from './settings/settings.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ReportsModule } from './reports/reports.module';
import { LessonLogsModule } from './lesson-logs/lesson-logs.module';
import { GradesModule } from './grades/grades.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    // Rate limiting global: maks 100 request / menit / IP (default).
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ClassesModule,
    StudentsModule,
    SubjectsModule,
    SchedulesModule,
    EventsModule,
    TermsModule,
    SettingsModule,
    NotificationsModule,
    AttendanceModule,
    ReportsModule,
    LessonLogsModule,
    GradesModule,
    SchedulerModule,
  ],
  providers: [
    // Rate limiting di seluruh endpoint
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Audit log untuk semua operasi mutasi
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
