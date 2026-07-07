import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateGradeBookDto {
  @IsUUID('4', { message: 'Kelas tidak valid' })
  classId: string;

  @IsUUID('4', { message: 'Mata pelajaran tidak valid' })
  subjectId: string;

  // Guru pemilik. Bila kosong, diisi user yang login.
  @IsOptional()
  @IsUUID('4', { message: 'Guru tidak valid' })
  teacherId?: string;

  // Bila kosong, diambil dari tahun ajaran kelas.
  @IsOptional()
  @IsString()
  academicYear?: string;

  @IsInt()
  @Min(1)
  @Max(6)
  cawu: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  kkm?: number;

  // Jumlah KD awal yang dibuat (default 5, seperti buku).
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  jumlahKd?: number;
}
