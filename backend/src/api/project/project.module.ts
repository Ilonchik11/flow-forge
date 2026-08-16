import { Module } from '@nestjs/common';
import { AuthorizationService } from 'src/common/services';
import { NotificationService } from '../notification/services/notification.service';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

@Module({
  controllers: [
    ProjectController,
  ],
  providers: [
    ProjectService,
    AuthorizationService,
    NotificationService,
  ],
})
export class ProjectModule {}
