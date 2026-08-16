import { Module } from '@nestjs/common';
import { AuthorizationService } from 'src/common/services';
import { NotificationService } from '../notification/services/notification.service';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';

@Module({
  controllers: [
    CommentController,
  ],
  providers: [
    CommentService,
    AuthorizationService,
    NotificationService,
  ],
})
export class CommentModule {}
