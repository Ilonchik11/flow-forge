import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from 'src/common/decorators';
import { JwtGuard } from 'src/common/guards';
import { AuthenticatedUser } from 'src/common/interfaces';

import {
  NotificationResponseDto,
  UpdateNotificationDto,
} from '../dto';

import { NotificationService } from '../services/notification.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('notifications')
export class NotificationController {

  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  @ApiOperation({
    summary: 'Get my notifications',
    description: 'Returns all notifications belonging to the authenticated user',
  })
  @ApiOkResponse({
    type: NotificationResponseDto,
    isArray: true,
    description: 'Notifications successfully found',
  })
  @Get()
  async findAll(
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return await this.notificationService.findAll(
      currentUser,
    );
  }

  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Mark all unread notifications belonging to the authenticated user as read',
  })
  @ApiOkResponse({
    description: 'Number of notifications marked as read',
    schema: {
      example: {
        updatedCount: 5,
      },
    },
  })
  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return await this.notificationService.markAllAsRead(
      currentUser,
    );
  }

  @ApiOperation({
    summary: 'Get notification by ID',
    description: 'Returns a notification belonging to the authenticated user',
  })
  @ApiOkResponse({
    type: NotificationResponseDto,
    description: 'Notification successfully found',
  })
  @ApiNotFoundResponse({
    description: 'Notification not found',
  })
  @ApiForbiddenResponse({
    description: 'User does not have permission to access this notification',
  })
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return await this.notificationService.findOne(
      id,
      currentUser,
    );
  }

  @ApiOperation({
    summary: 'Update notification',
    description: 'Marks a notification as read or unread',
  })
  @ApiOkResponse({
    type: NotificationResponseDto,
    description: 'Notification successfully updated',
  })
  @ApiBadRequestResponse({
    description: 'Incorrect input data',
  })
  @ApiNotFoundResponse({
    description: 'Notification not found',
  })
  @ApiForbiddenResponse({
    description: 'User does not have permission to update this notification',
  })
  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() dto: UpdateNotificationDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return await this.notificationService.update(
      id, 
      dto,
      currentUser,
    );
  }

  @ApiOperation({
    summary: 'Delete notification',
    description: 'Deletes a notification belonging to the authenticated user',
  })
  @ApiNoContentResponse({
    description: 'Notification successfully deleted',
  })
  @ApiNotFoundResponse({
    description: 'Notification not found',
  })
  @ApiForbiddenResponse({
    description: 'User does not have permission to delete this notification',
  })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return await this.notificationService.remove(
      id, 
      currentUser,
    );
  }
}
