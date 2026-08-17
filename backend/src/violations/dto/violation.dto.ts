import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ViolationLevel } from '@prisma/client';

export class CreateViolationTypeDto {
  @IsString()
  @IsNotEmpty({ message: 'Kategori wajib diisi' })
  category: string;

  @IsEnum(ViolationLevel, { message: 'Tingkat harus RINGAN/SEDANG/BERAT' })
  level: ViolationLevel;

  @IsString()
  @IsNotEmpty({ message: 'Nama pelanggaran wajib diisi' })
  name: string;

  @IsInt()
  @Min(0)
  points: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateViolationTypeDto extends PartialType(CreateViolationTypeDto) {}

// Catat pelanggaran murid: pilih dari katalog (typeId) ATAU manual
// (description + points). Snapshot deskripsi & poin disimpan di record.
export class CreateViolationDto {
  @IsUUID()
  studentId: string;

  @IsOptional()
  @IsUUID()
  typeId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  points?: number;

  @IsDateString({}, { message: 'Tanggal tidak valid (YYYY-MM-DD)' })
  date: string;

  @IsOptional()
  @IsString()
  note?: string;
}
