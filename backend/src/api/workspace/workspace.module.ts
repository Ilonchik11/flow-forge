import { Module } from '@nestjs/common';
import { AuthorizationService } from 'src/common/services';
import { NotificationService } from '../notification/services/notification.service';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';

@Module({
  controllers: [
    WorkspaceController
  ],
  providers: [
    WorkspaceService,
    AuthorizationService,
    NotificationService,
  ],
})
export class WorkspaceModule {}
