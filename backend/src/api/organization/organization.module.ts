import { Module } from '@nestjs/common';
import { OrganizationService } from './services/organization.service';
import { OrganizationController } from './controllers/organization.controller';
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
