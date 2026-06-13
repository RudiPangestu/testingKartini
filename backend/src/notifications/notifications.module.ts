import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import {
  NotificationsController,
  PushTokenController,
} from './notifications.controller';
import { PushService } from './channels/push.service';
import { EmailService } from './channels/email.service';
import { WaService } from './channels/wa.service';

@Module({
  controllers: [NotificationsController, PushTokenController],
  providers: [NotificationsService, PushService, EmailService, WaService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
