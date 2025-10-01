import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { EmailService } from './services/email.service';
import { SlackService } from './services/slack.service';

@Module({
  providers: [NotificationService, EmailService, SlackService],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}
