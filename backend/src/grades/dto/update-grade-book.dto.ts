import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class UpdateGradeBookDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  kkm?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  cawu?: number;

  @IsOptional()
  @IsUUID('4', { message: 'Guru tidak valid' })
  teacherId?: string;
}
