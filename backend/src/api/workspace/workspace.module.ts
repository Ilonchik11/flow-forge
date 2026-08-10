import { Module } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { AuthorizationService } from 'src/common/services';

@Module({
  controllers: [
    WorkspaceController
  ],
  providers: [
    WorkspaceService,
    AuthorizationService,
  ],
})
export class WorkspaceModule {}
