import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Authorization, CurrentUser, Roles } from 'src/common/decorators';
import { JwtGuard, RolesGuard } from 'src/common/guards';
import { AuthenticatedUser } from 'src/common/interfaces';
import { UserResponseDto } from './dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: 'Get all users',
    description: 'Returns a list of users',
  })
  @ApiOkResponse({
    type: UserResponseDto,
    isArray: true,
  })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  async findAll() {
    return await this.userService.findAll();
  }

  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Returns a user by their unique identifier',
  })
  @ApiOkResponse({
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @Get(':id')
  @UseGuards(JwtGuard)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.userService.findOne(id, user);
  }

  @ApiOperation({
    summary: 'Update user',
    description: 'Updates user profile information',
  })
  @ApiOkResponse({
    type: UserResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @UseGuards(JwtGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserDto,
  ) {
    return await this.userService.update(id, dto, user);
  }

  @ApiOperation({
    summary: 'Delete user',
    description: 'Deletes a user account',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @Delete(':id')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return await this.userService.remove(id, user);
  }
}
