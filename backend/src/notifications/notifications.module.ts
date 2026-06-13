import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import {
  NotificationsController,
  PushTokenController,
} from './notifications.controller';
import { PushService } from './channels/push.service';
import { EmailService } from './channels/email.service';

@Module({
  controllers: [NotificationsController, PushTokenController],
  providers: [NotificationsService, PushService, EmailService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
