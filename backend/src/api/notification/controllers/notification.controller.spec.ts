import {
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals';

import { NotificationType, UserRole, UserStatus } from '@prisma/client';

import { NotificationService } from '../services/notification.service';

import { AuthenticatedUser } from 'src/common/interfaces';
import { UpdateNotificationDto } from '../dto';
import { NotificationController } from './notification.controller';

describe('NotificationController', () => {
  let controller: NotificationController;

  let notificationService: jest.Mocked<
    Pick<
      NotificationService,
      'findAll' | 'markAllAsRead' | 'findOne' | 'update' | 'remove'
    >
  >;

  const currentUser: AuthenticatedUser = {
    id: 'user-1',
    email: 'john@example.com',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
  };

  const notification = {
    id: 'notification-1',
    userId: currentUser.id,
    type: NotificationType.PROJECT_MEMBER_ADDED,
    title: 'Added to project',
    message: 'You were added to project "Flow Forge"',
    isRead: false,
    readAt: null,
    createdAt: new Date(),
  };

  beforeEach(() => {
    notificationService = {
      findAll: jest.fn(),
      markAllAsRead: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    controller = new NotificationController(
      notificationService as unknown as NotificationService,
    );
  });

  describe('findAll', () => {
    it('should return notifications from the service', async () => {
      const notifications = [notification];

      notificationService.findAll.mockResolvedValue(
        notifications,
      );

      const result = await controller.findAll(
        currentUser,
      );

      expect(result).toEqual(notifications);

      expect(
        notificationService.findAll,
      ).toHaveBeenCalledWith(currentUser);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      const response = {
        updatedCount: 5,
      };

      notificationService.markAllAsRead.mockResolvedValue(
        response,
      );

      const result = await controller.markAllAsRead(
        currentUser,
      );

      expect(result).toEqual(response);

      expect(
        notificationService.markAllAsRead,
      ).toHaveBeenCalledWith(currentUser);
    });
  });

  describe('findOne', () => {
    it('should return a notification from the service', async () => {
      notificationService.findOne.mockResolvedValue(
        notification,
      );

      const result = await controller.findOne(
        notification.id,
        currentUser,
      );

      expect(result).toEqual(notification);

      expect(
        notificationService.findOne,
      ).toHaveBeenCalledWith(
        notification.id,
        currentUser,
      );
    });
  });

  describe('update', () => {
    it('should update a notification', async () => {
      const dto: UpdateNotificationDto = {
        isRead: true,
      };

      const updatedNotification = {
        ...notification,
        isRead: true,
        readAt: new Date(),
      };

      notificationService.update.mockResolvedValue(
        updatedNotification,
      );

      const result = await controller.update(
        notification.id,
        dto,
        currentUser,
      );

      expect(result).toEqual(updatedNotification);

      expect(
        notificationService.update,
      ).toHaveBeenCalledWith(
        notification.id,
        dto,
        currentUser,
      );
    });
  });

  describe('remove', () => {
    it('should remove a notification', async () => {
      notificationService.remove.mockResolvedValue(
        undefined,
      );

      const result = await controller.remove(
        notification.id,
        currentUser,
      );

      expect(result).toBeUndefined();

      expect(
        notificationService.remove,
      ).toHaveBeenCalledWith(
        notification.id,
        currentUser,
      );
    });
  });
});