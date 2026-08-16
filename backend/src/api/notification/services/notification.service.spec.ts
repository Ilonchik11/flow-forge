import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, Notification as PrismaNotification } from '@prisma/client';

import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  const currentUser = {
    id: 'user-1',
    email: 'user1@test.com',
    role: 'MEMBER',
  } as any;

  const notification: PrismaNotification = {
    id: 'notification-id',
    userId: 'user-id',
    type: NotificationType.PROJECT_MEMBER_ADDED,
    title: 'Project member added',
    message: 'You were added to project',
    isRead: false,
    readAt: null,
    createdAt: new Date(),
  };

  let prismaService = {
    notification: {
      create: jest.fn<
        (args: any) => Promise<typeof notification>
      >(),

      findMany: jest.fn<
        (args: any) => Promise<(typeof notification)[]>
      >(),

      findUnique: jest.fn<
        (args: any) => Promise<typeof notification | null>
      >(),

      update: jest.fn<
        (args: any) => Promise<typeof notification>
      >(),

      delete: jest.fn<
        (args: any) => Promise<typeof notification>
      >(),

      updateMany: jest.fn<
        (args: any) => Promise<{ count: number }>
      >(),
    },
  };

  let authorizationService: {
    canAccessNotification: jest.Mock;
  };

  beforeEach(() => {
    prismaService = {
      notification: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    authorizationService = {
      canAccessNotification: jest.fn(),
    };

    service = new NotificationService(
      prismaService as any,
      authorizationService as any,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a notification', async () => {
      prismaService.notification.create.mockResolvedValue(notification);

      const data = {
        userId: 'user-1',
        type: NotificationType.PROJECT_MEMBER_ADDED,
        title: 'Added to project',
        message: 'You were added to project "Flow Forge"',
      };

      const result = await service.create(data);

      expect(result).toEqual(notification);

      expect(prismaService.notification.create).toHaveBeenCalledWith({
        data,
      });
    });
  });

  describe('createTx', () => {
    it('should create a notification using the transaction client', async () => {
      const tx = {
        notification: {
          create: jest.fn<
            (args: any) => Promise<typeof notification>
          >(),
        },
      };

      tx.notification.create.mockResolvedValue(notification);

      const data = {
        userId: 'user-1',
        type: NotificationType.PROJECT_MEMBER_ADDED,
        title: 'Added to project',
        message: 'You were added to project "Flow Forge"',
      };

      const result = await service.createTx(
        tx as any,
        data,
      );

      expect(result).toEqual(notification);

      expect(tx.notification.create).toHaveBeenCalledWith({
        data,
      });

      expect(
        prismaService.notification.create,
      ).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return notifications belonging to the current user', async () => {
      prismaService.notification.findMany.mockResolvedValue([
        notification,
      ]);

      const result = await service.findAll(currentUser);

      expect(result).toEqual([notification]);

      expect(
        prismaService.notification.findMany,
      ).toHaveBeenCalledWith({
        where: {
          userId: currentUser.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return the notification when the user has access', async () => {
      prismaService.notification.findUnique.mockResolvedValue(
        notification,
      );

      const result = await service.findOne(
        notification.id,
        currentUser,
      );

      expect(result).toEqual(notification);

      expect(
        authorizationService.canAccessNotification,
      ).toHaveBeenCalledWith(
        currentUser,
        notification,
      );
    });

    it('should throw NotFoundException when notification does not exist', async () => {
      prismaService.notification.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.findOne(
          'non-existent-id',
          currentUser,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(
        authorizationService.canAccessNotification,
      ).not.toHaveBeenCalled();
    });

    it('should propagate authorization errors', async () => {
      prismaService.notification.findUnique.mockResolvedValue(
        notification,
      );

      authorizationService.canAccessNotification.mockImplementation(
        () => {
          throw new ForbiddenException();
        },
      );

      await expect(
        service.findOne(
          notification.id,
          currentUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should mark a notification as read', async () => {
      prismaService.notification.findUnique.mockResolvedValue(
        notification,
      );

      const updatedNotification = {
        ...notification,
        isRead: true,
        readAt: new Date(),
      };

      prismaService.notification.update.mockResolvedValue(
        updatedNotification,
      );

      const result = await service.update(
        notification.id,
        {
          isRead: true,
        },
        currentUser,
      );

      expect(result).toEqual(updatedNotification);

      expect(
        authorizationService.canAccessNotification,
      ).toHaveBeenCalledWith(
        currentUser,
        notification,
      );

      expect(
        prismaService.notification.update,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: notification.id,
          },
          data: expect.objectContaining({
            isRead: true,
            readAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should mark a notification as unread', async () => {
      prismaService.notification.findUnique.mockResolvedValue(
        notification,
      );

      const updatedNotification = {
        ...notification,
        isRead: false,
        readAt: null,
      };

      prismaService.notification.update.mockResolvedValue(
        updatedNotification,
      );

      const result = await service.update(
        notification.id,
        {
          isRead: false,
        },
        currentUser,
      );

      expect(result).toEqual(updatedNotification);

      expect(
        prismaService.notification.update,
      ).toHaveBeenCalledWith({
        where: {
          id: notification.id,
        },
        data: {
          isRead: false,
          readAt: null,
        },
      });
    });

    it('should throw when notification does not exist', async () => {
      prismaService.notification.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.update(
          'non-existent-id',
          {
            isRead: true,
          },
          currentUser,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(
        prismaService.notification.update,
      ).not.toHaveBeenCalled();
    });

    it('should not update a notification when authorization fails', async () => {
      prismaService.notification.findUnique.mockResolvedValue(
        notification,
      );

      authorizationService.canAccessNotification.mockImplementation(
        () => {
          throw new ForbiddenException();
        },
      );

      await expect(
        service.update(
          notification.id,
          {
            isRead: true,
          },
          currentUser,
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(
        prismaService.notification.update,
      ).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a notification', async () => {
      prismaService.notification.findUnique.mockResolvedValue(
        notification,
      );

      prismaService.notification.delete.mockResolvedValue(
        notification,
      );

      await service.remove(
        notification.id,
        currentUser,
      );

      expect(
        authorizationService.canAccessNotification,
      ).toHaveBeenCalledWith(
        currentUser,
        notification,
      );

      expect(
        prismaService.notification.delete,
      ).toHaveBeenCalledWith({
        where: {
          id: notification.id,
        },
      });
    });

    it('should throw when notification does not exist', async () => {
      prismaService.notification.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.remove(
          'non-existent-id',
          currentUser,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(
        prismaService.notification.delete,
      ).not.toHaveBeenCalled();
    });

    it('should not delete when authorization fails', async () => {
      prismaService.notification.findUnique.mockResolvedValue(
        notification,
      );

      authorizationService.canAccessNotification.mockImplementation(
        () => {
          throw new ForbiddenException();
        },
      );

      await expect(
        service.remove(
          notification.id,
          currentUser,
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(
        prismaService.notification.delete,
      ).not.toHaveBeenCalled();
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications of the current user as read', async () => {
      prismaService.notification.updateMany.mockResolvedValue({
        count: 3,
      });

      const result = await service.markAllAsRead(
        currentUser,
      );

      expect(result).toEqual({
        updatedCount: 3,
      });

      expect(
        prismaService.notification.updateMany,
      ).toHaveBeenCalledWith({
        where: {
          userId: currentUser.id,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: expect.any(Date),
        },
      });
    });

    it('should return zero when there are no unread notifications', async () => {
      prismaService.notification.updateMany.mockResolvedValue({
        count: 0,
      });

      const result = await service.markAllAsRead(
        currentUser,
      );

      expect(result).toEqual({
        updatedCount: 0,
      });
    });
  });

  describe('notifyUsers', () => {
    it('should create a notification for every user', async () => {
      prismaService.notification.create.mockResolvedValue(
        notification,
      );

      const userIds = [
        'user-1',
        'user-2',
        'user-3',
      ];

      await service.notifyUsers(
        userIds,
        NotificationType.PROJECT_MEMBER_ADDED,
        'New project member',
        'A new member was added',
      );

      expect(
        prismaService.notification.create,
      ).toHaveBeenCalledTimes(3);

      expect(
        prismaService.notification.create,
      ).toHaveBeenNthCalledWith(1, {
        data: {
          userId: 'user-1',
          type: NotificationType.PROJECT_MEMBER_ADDED,
          title: 'New project member',
          message: 'A new member was added',
        },
      });

      expect(
        prismaService.notification.create,
      ).toHaveBeenNthCalledWith(2, {
        data: {
          userId: 'user-2',
          type: NotificationType.PROJECT_MEMBER_ADDED,
          title: 'New project member',
          message: 'A new member was added',
        },
      });

      expect(
        prismaService.notification.create,
      ).toHaveBeenNthCalledWith(3, {
        data: {
          userId: 'user-3',
          type: NotificationType.PROJECT_MEMBER_ADDED,
          title: 'New project member',
          message: 'A new member was added',
        },
      });
    });

    it('should not create notifications when userIds is empty', async () => {
      await service.notifyUsers(
        [],
        NotificationType.PROJECT_MEMBER_ADDED,
        'New project member',
        'A new member was added',
      );

      expect(
        prismaService.notification.create,
      ).not.toHaveBeenCalled();
    });
  });

  describe('notifyUsersTx', () => {
    it('should create a notification for every user using the transaction client', async () => {
      const tx = {
        notification: {
          create: jest.fn<
            (args: any) => Promise<typeof notification>
          >(),
        },
      };

      tx.notification.create.mockResolvedValue(
        notification,
      );

      const userIds = [
        'user-1',
        'user-2',
        'user-3',
      ];

      await service.notifyUsersTx(
        tx as any,
        userIds,
        NotificationType.PROJECT_MEMBER_ADDED,
        'New project member',
        'A new member was added',
      );

      expect(
        tx.notification.create,
      ).toHaveBeenCalledTimes(3);

      expect(
        tx.notification.create,
      ).toHaveBeenNthCalledWith(1, {
        data: {
          userId: 'user-1',
          type: NotificationType.PROJECT_MEMBER_ADDED,
          title: 'New project member',
          message: 'A new member was added',
        },
      });

      expect(
        tx.notification.create,
      ).toHaveBeenNthCalledWith(2, {
        data: {
          userId: 'user-2',
          type: NotificationType.PROJECT_MEMBER_ADDED,
          title: 'New project member',
          message: 'A new member was added',
        },
      });

      expect(
        tx.notification.create,
      ).toHaveBeenNthCalledWith(3, {
        data: {
          userId: 'user-3',
          type: NotificationType.PROJECT_MEMBER_ADDED,
          title: 'New project member',
          message: 'A new member was added',
        },
      });
    });

    it('should not use the main PrismaService', async () => {
      const tx = {
        notification: {
          create: jest.fn<
            (args: any) => Promise<typeof notification>
          >(),
        },
      };

      await service.notifyUsersTx(
        tx as any,
        ['user-1'],
        NotificationType.PROJECT_MEMBER_ADDED,
        'New project member',
        'A new member was added',
      );

      expect(
        prismaService.notification.create,
      ).not.toHaveBeenCalled();
    });

    it('should not create notifications when userIds is empty', async () => {
      const tx = {
        notification: {
          create: jest.fn(),
        },
      };

      await service.notifyUsersTx(
        tx as any,
        [],
        NotificationType.PROJECT_MEMBER_ADDED,
        'New project member',
        'A new member was added',
      );

      expect(
        tx.notification.create,
      ).not.toHaveBeenCalled();
    });
  });
});