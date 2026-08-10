import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AuthorizationService } from 'src/common/services';

@Module({
  controllers: [
    UserController
  ],
  providers: [
    UserService,
    AuthorizationService,
  ],
})
export class UserModule {}
