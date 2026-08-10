import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { AuthorizationService } from 'src/common/services';

@Module({
  controllers: [
    OrganizationController
  ],
  providers: [
    OrganizationService,
    AuthorizationService,
  ],
})
export class OrganizationModule {}
