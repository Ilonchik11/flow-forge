import { Module } from '@nestjs/common';
import { ProjectMemberService } from './project-member.service';
import { ProjectMemberController } from './project-member.controller';
import { AuthorizationService } from 'src/common/services';
import { NotificationService } from '../notification/services/notification.service';

@Module({
  controllers: [
    ProjectMemberController
  ],
  providers: [
    ProjectMemberService,
    AuthorizationService,
    NotificationService,
  ],
})
export class ProjectMemberModule {}
