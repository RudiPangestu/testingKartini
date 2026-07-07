import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { GradeComponentType } from '@prisma/client';

export class ScoreItemDto {
  @IsUUID('4')
  kdId: string;

  @IsUUID('4')
  studentId: string;

  @IsEnum(GradeComponentType)
  komponen: GradeComponentType;

  @IsInt()
  @Min(1)
  @Max(50)
  urutan: number;

  // null = hapus sel nilai ini.
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  nilai?: number | null;
}

export class SaveScoresDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScoreItemDto)
  items: ScoreItemDto[];
}
