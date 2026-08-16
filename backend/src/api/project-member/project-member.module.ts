import { Module } from '@nestjs/common';
import { AuthorizationService } from 'src/common/services';
import { NotificationService } from '../notification/services/notification.service';
import { ProjectMemberController } from './controllers/project-member.controller';
import { ProjectMemberService } from './services/project-member.service';

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
