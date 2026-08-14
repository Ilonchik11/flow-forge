import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { AuthorizationService } from 'src/common/services';

@Module({
  controllers: [
    CommentController,
  ],
  providers: [
    CommentService,
    AuthorizationService,
  ],
})
export class CommentModule {}
