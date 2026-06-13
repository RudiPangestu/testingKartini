import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { DayOfWeek } from '@prisma/client';

export class QueryScheduleDto {
  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsUUID()
  teacherId?: string;

  @IsOptional()
  @IsEnum(DayOfWeek)
  day?: DayOfWeek;
}
