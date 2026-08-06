import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Gender } from '@prisma/client';

export class CreateStudentDto {
  // NISN opsional (permintaan sekolah: sebagian murid belum punya NISN).
  @IsOptional()
  @IsString()
  nisn?: string;

  @IsOptional()
  @IsString()
  nis?: string;

  @IsString()
  @IsNotEmpty({ message: 'Nama murid wajib diisi' })
  fullName: string;

  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsEnum(Gender, { message: 'Jenis kelamin harus L atau P' })
  gender?: Gender;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
