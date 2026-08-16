import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
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
