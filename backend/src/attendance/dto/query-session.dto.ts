import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class QuerySessionDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsUUID()
  classId?: string;
}
