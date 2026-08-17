import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

export class DailyRecordDto {
  @IsUUID()
  studentId: string;

  @IsEnum(AttendanceStatus, {
    message: 'Status harus HADIR/SAKIT/IZIN/ALPHA/TELAT',
  })
  status: AttendanceStatus;

  @IsOptional()
  @IsString()
  note?: string;
}

export class SaveDailyAttendanceDto {
  @IsDateString({}, { message: 'Tanggal tidak valid (YYYY-MM-DD)' })
  date: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'Daftar hadir tidak boleh kosong' })
  @ValidateNested({ each: true })
  @Type(() => DailyRecordDto)
  records: DailyRecordDto[];
}
