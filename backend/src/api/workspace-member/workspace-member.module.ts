import { Module } from '@nestjs/common';
import { WorkspaceMemberService } from './workspace-member.service';
import { WorkspaceMemberController } from './workspace-member.controller';
import { AuthorizationService } from 'src/common/services';

@Module({
  controllers: [
    WorkspaceMemberController
  ],
  providers: [
    WorkspaceMemberService,
    AuthorizationService,
  ],
})
export class WorkspaceMemberModule {}
