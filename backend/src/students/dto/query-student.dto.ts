import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryStudentDto {
  @IsOptional()
  @IsUUID()
  classId?: string;

  @IsOptional()
  @IsString()
  search?: string; // cari berdasarkan NISN atau nama

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number = 20;
}
