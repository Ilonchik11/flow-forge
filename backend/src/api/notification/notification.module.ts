import { Module } from '@nestjs/common';
import { NotificationService } from './services/notification.service';
import { NotificationController } from './controllers/notification.controller';
import { AuthorizationService } from 'src/common/services';

@Module({
  controllers: [
    NotificationController,
  ],
  providers: [
    NotificationService,
    AuthorizationService,
  ],
})
export class NotificationModule {}
