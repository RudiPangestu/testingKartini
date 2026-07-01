import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

// Semua field opsional saat update.
export class UpdateLessonLogDto {
  @IsOptional()
  @IsUUID('4', { message: 'Mata pelajaran tidak valid' })
  subjectId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Guru tidak valid' })
  teacherId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Tanggal tidak valid' })
  date?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Jam ke tidak boleh kosong' })
  jamKe?: string;

  @IsOptional()
  @IsString()
  namaSiswa?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Pokok bahasan tidak boleh kosong' })
  pokokBahasan?: string;

  @IsOptional()
  @IsString()
  metode?: string;

  @IsOptional()
  @IsBoolean()
  selesai?: boolean;

  @IsOptional()
  @IsString()
  siswaTidakHadir?: string;

  @IsOptional()
  @IsString()
  refleksi?: string;

  @IsOptional()
  @IsString()
  tindakLanjut?: string;
}
