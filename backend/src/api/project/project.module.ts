import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { AuthorizationService } from 'src/common/services';

@Module({
  controllers: [
    ProjectController,
  ],
  providers: [
    ProjectService,
    AuthorizationService,
  ],
})
export class ProjectModule {}
