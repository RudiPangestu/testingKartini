import { IsEnum, IsNotEmpty, IsString, IsUUID, Matches } from 'class-validator';
import { DayOfWeek } from '@prisma/client';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class CreateScheduleDto {
  @IsUUID()
  subjectId: string;

  @IsUUID()
  classId: string;

  @IsUUID()
  teacherId: string;

  @IsEnum(DayOfWeek, { message: 'Hari tidak valid (SEN..SAB)' })
  dayOfWeek: DayOfWeek;

  @Matches(TIME_REGEX, { message: 'Jam mulai harus format HH:mm' })
  startTime: string;

  @Matches(TIME_REGEX, { message: 'Jam selesai harus format HH:mm' })
  endTime: string;

  @IsString()
  @IsNotEmpty({ message: 'Tahun ajaran wajib diisi' })
  academicYear: string;
}
