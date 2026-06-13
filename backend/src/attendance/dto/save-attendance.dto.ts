import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

export class AttendanceRecordDto {
  @IsUUID()
  studentId: string;

  @IsEnum(AttendanceStatus, {
    message: 'Status harus HADIR/SAKIT/IZIN/ALPHA',
  })
  status: AttendanceStatus;

  @IsOptional()
  @IsString()
  note?: string;
}

export class SaveAttendanceDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'Daftar presensi tidak boleh kosong' })
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  records: AttendanceRecordDto[];
}
