import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

// Satu entri buku batas pembelajaran (satu pertemuan/sesi mengajar).
export class CreateLessonLogDto {
  @IsUUID('4', { message: 'Kelas tidak valid' })
  classId: string;

  @IsOptional()
  @IsUUID('4', { message: 'Mata pelajaran tidak valid' })
  subjectId?: string;

  // Guru pengisi/paraf. Bila kosong, diisi user yang sedang login.
  @IsOptional()
  @IsUUID('4', { message: 'Guru tidak valid' })
  teacherId?: string;

  @IsDateString({}, { message: 'Tanggal tidak valid' })
  date: string;

  @IsString()
  @IsNotEmpty({ message: 'Jam ke wajib diisi' })
  jamKe: string;

  @IsOptional()
  @IsString()
  namaSiswa?: string;

  @IsString()
  @IsNotEmpty({ message: 'Pokok bahasan wajib diisi' })
  pokokBahasan: string;

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
