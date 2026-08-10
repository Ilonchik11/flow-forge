import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CommentModule } from './comment/comment.module';
import { IssueModule } from './issue/issue.module';
import { NotificationModule } from './notification/notification.module';
import { OrganizationModule } from './organization/organization.module';
import { ProjectModule } from './project/project.module';
import { UserModule } from './user/user.module';
import { WorkspaceModule } from './workspace/workspace.module';

@Module({
  imports: [
    UserModule, 
    OrganizationModule, 
    WorkspaceModule, 
    ProjectModule, 
    IssueModule, 
    CommentModule, 
    NotificationModule, 
    AuthModule,
  ],
})
export class ApiModule {}