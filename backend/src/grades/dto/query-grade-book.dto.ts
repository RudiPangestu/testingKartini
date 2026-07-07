import { IsOptional, IsString } from 'class-validator';

export class QueryGradeBookDto {
  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsOptional()
  @IsString()
  academicYear?: string;

  // Angka via query string; dikonversi di service.
  @IsOptional()
  @IsString()
  cawu?: string;
}
