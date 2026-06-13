import { IsOptional, IsString, IsUUID } from 'class-validator';

export class LinkParentDto {
  @IsUUID()
  parentUserId: string;

  @IsOptional()
  @IsString()
  relation?: string; // ayah / ibu / wali
}
