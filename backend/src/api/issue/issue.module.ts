import { Module } from '@nestjs/common';
import { AuthorizationService } from 'src/common/services';
import { NotificationService } from '../notification/services/notification.service';
import { IssueController } from './controllers/issue.controller';
import { IssueService } from './services/issue.service';

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
