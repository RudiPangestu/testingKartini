import { Module } from '@nestjs/common';
import { LessonLogsService } from './lesson-logs.service';
import { LessonLogsController } from './lesson-logs.controller';

@Module({
  controllers: [LessonLogsController],
  providers: [LessonLogsService],
  exports: [LessonLogsService],
})
export class LessonLogsModule {}
