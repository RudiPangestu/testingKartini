import { IsJWT } from 'class-validator';

export class RefreshDto {
  @IsJWT({ message: 'Refresh token tidak valid' })
  refreshToken: string;
}
