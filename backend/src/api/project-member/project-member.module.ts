import { Module } from '@nestjs/common';
import { ProjectMemberService } from './project-member.service';
import { ProjectMemberController } from './project-member.controller';
import { AuthorizationService } from 'src/common/services';

@Module({
  controllers: [
    ProjectMemberController
  ],
  providers: [
    ProjectMemberService,
    AuthorizationService,
  ],
})
export class ProjectMemberModule {}
