import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Platform } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import {
  CurrentUser,
  JwtUser,
} from '../common/decorators/current-user.decorator';

class RegisterPushTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsEnum(Platform, { message: 'Platform harus ANDROID atau IOS' })
  platform: Platform;
}

// Registrasi push token — sesuai dokumentasi: POST /auth/push-token
@Controller('auth')
export class PushTokenController {
  constructor(private readonly service: NotificationsService) {}

  @Post('push-token')
  register(
    @Body() dto: RegisterPushTokenDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.service.registerPushToken(user.userId, dto.token, dto.platform);
  }
}

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: JwtUser) {
    return this.service.list(user.userId);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.service.markRead(id, user.userId);
  }
}
