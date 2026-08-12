import { Module } from '@nestjs/common';
import { IssueService } from './issue.service';
import { IssueController } from './issue.controller';
import { AuthorizationService } from 'src/common/services';

@Module({
  controllers: [
    IssueController,
  ],
  providers: [
    IssueService,
    AuthorizationService,
  ],
})
export class IssueModule {}
