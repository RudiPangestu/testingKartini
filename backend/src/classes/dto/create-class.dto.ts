import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateClassDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama kelas wajib diisi' })
  name: string;

  @IsInt()
  @Min(10)
  @Max(12)
  grade: number;

  @IsString()
  @IsNotEmpty({ message: 'Tahun ajaran wajib diisi' })
  academicYear: string;

  @IsOptional()
  @IsUUID()
  homeroomTeacherId?: string;
}
