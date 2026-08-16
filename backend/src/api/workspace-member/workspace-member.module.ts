import { Module } from '@nestjs/common';
import { AuthorizationService } from 'src/common/services';
import { NotificationService } from '../notification/services/notification.service';
import { WorkspaceMemberController } from './controllers/workspace-member.controller';
import { WorkspaceMemberService } from './services/workspace-member.service';

@Module({
  controllers: [
    WorkspaceMemberController
  ],
  providers: [
    WorkspaceMemberService,
    AuthorizationService,
    NotificationService,
  ],
})
export class WorkspaceMemberModule {}
