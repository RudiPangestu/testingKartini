import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { Platform, Role } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { Roles } from '../common/decorators/roles.decorator';
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

class BroadcastDto {
  @IsString()
  @IsNotEmpty({ message: 'Judul wajib diisi' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Isi pengumuman wajib diisi' })
  body: string;

  @IsIn(['ALL', 'ROLE', 'CLASS'], { message: 'target harus ALL/ROLE/CLASS' })
  target: 'ALL' | 'ROLE' | 'CLASS';

  @ValidateIf((o) => o.target === 'ROLE')
  @IsEnum(Role)
  role?: Role;

  @ValidateIf((o) => o.target === 'CLASS')
  @IsUUID()
  classId?: string;
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

  // Pengumuman/Info dari admin ke audiens tertentu
  @Roles(Role.ADMIN)
  @Post('broadcast')
  broadcast(@Body() dto: BroadcastDto) {
    return this.service.broadcast(dto);
  }
}
