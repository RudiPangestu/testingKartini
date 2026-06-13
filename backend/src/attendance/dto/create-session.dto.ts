import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { AttendanceSource } from '@prisma/client';

export class CreateSessionDto {
  @IsEnum(AttendanceSource, { message: 'Sumber harus SCHEDULE atau EVENT' })
  sourceType: AttendanceSource;

  @ValidateIf((o) => o.sourceType === AttendanceSource.SCHEDULE)
  @IsUUID()
  scheduleId?: string;

  @ValidateIf((o) => o.sourceType === AttendanceSource.EVENT)
  @IsUUID()
  eventId?: string;

  @IsDateString({}, { message: 'Tanggal sesi tidak valid' })
  sessionDate: string;
}
