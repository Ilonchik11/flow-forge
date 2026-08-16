import { Module } from '@nestjs/common';
import { AuthorizationService } from 'src/common/services';
import { NotificationService } from '../notification/services/notification.service';
import { IssueController } from './issue.controller';
import { IssueService } from './issue.service';

@Module({
  controllers: [
    IssueController,
  ],
  providers: [
    IssueService,
    AuthorizationService,
    NotificationService,
  ],
})
export class IssueModule {}
