import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class QueryEventDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsUUID()
  classId?: string;
}
