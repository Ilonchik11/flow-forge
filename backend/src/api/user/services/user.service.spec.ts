import {
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals';
import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthorizationService } from 'src/common/services';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  const prismaService = {
    user: {
      findMany: jest.fn<() => Promise<any[]>>(),
      findUnique: jest.fn<() => Promise<any>>(),
      update: jest.fn<() => Promise<any>>(),
      delete: jest.fn<() => Promise<any>>(),
    },
  };

  const authorizationService = {
    canViewUser: jest.fn(),
    canUpdateUser: jest.fn(),
    canDeleteUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: AuthorizationService,
          useValue: authorizationService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all users with profiles', async () => {
      const users = [
        {
          id: 'user-1',
          email: 'john@example.com',
          profile: {
            firstName: 'John',
          },
        },
        {
          id: 'user-2',
          email: 'jane@example.com',
          profile: {
            firstName: 'Jane',
          },
        },
      ];

      prismaService.user.findMany.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);

      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        include: {
          profile: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });

  describe('findOne', () => {
    const currentUser = {
      id: 'user-1',
      email: 'john@example.com',
      role: 'USER',
    } as any;

    it('should return a user', async () => {
      const user = {
        id: 'user-2',
        email: 'jane@example.com',
      };

      prismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.findOne('user-2', currentUser);

      expect(result).toEqual(user);

      expect(
        authorizationService.canViewUser,
      ).toHaveBeenCalledWith(currentUser, 'user-2');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'user-2',
        },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('user-2', currentUser),
      ).rejects.toThrow(
        new NotFoundException('User with user-2 not found'),
      );

      expect(
        authorizationService.canViewUser,
      ).toHaveBeenCalledWith(currentUser, 'user-2');
    });
  });

  describe('update', () => {
    const currentUser = {
      id: 'user-1',
      email: 'john@example.com',
      role: 'USER',
    } as any;

    it('should update user email', async () => {
      const existingUser = {
        id: 'user-1',
        email: 'old@example.com',
        profile: null,
      };

      const updatedUser = {
        id: 'user-1',
        email: 'new@example.com',
        profile: null,
      };

      prismaService.user.findUnique.mockResolvedValueOnce(existingUser);

      prismaService.user.findUnique.mockResolvedValueOnce(null);

      prismaService.user.update.mockResolvedValue(updatedUser);

      const updateDto = {
        email: 'new@example.com',
      };

      const result = await service.update(
        'user-1',
        updateDto as any,
        currentUser,
      );

      expect(result).toEqual(updatedUser);

      expect(
        authorizationService.canUpdateUser,
      ).toHaveBeenCalledWith(currentUser, 'user-1');

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: {
          id: 'user-1',
        },
        data: {
          email: 'new@example.com',
        },
        include: {
          profile: true,
        },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.update(
          'user-1',
          {
            email: 'new@example.com',
          } as any,
          currentUser,
        ),
      ).rejects.toThrow(
        new NotFoundException('User with id "user-1" not found'),
      );

      expect(prismaService.user.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when email is already taken', async () => {
      const existingUser = {
        id: 'user-1',
        email: 'old@example.com',
        profile: null,
      };

      const emailTakenUser = {
        id: 'user-2',
        email: 'new@example.com',
      };

      prismaService.user.findUnique
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(emailTakenUser);

      await expect(
        service.update(
          'user-1',
          {
            email: 'new@example.com',
          } as any,
          currentUser,
        ),
      ).rejects.toThrow(
        new ConflictException(
          'User with this email already exists',
        ),
      );

      expect(prismaService.user.update).not.toHaveBeenCalled();
    });

    it('should update user profile', async () => {
      const existingUser = {
        id: 'user-1',
        email: 'john@example.com',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      const updatedUser = {
        id: 'user-1',
        email: 'john@example.com',
        profile: {
          firstName: 'Johnny',
          lastName: 'Doe',
        },
      };

      prismaService.user.findUnique.mockResolvedValue(existingUser);

      prismaService.user.update.mockResolvedValue(updatedUser);

      const updateDto = {
        profile: {
          firstName: 'Johnny',
        },
      };

      const result = await service.update(
        'user-1',
        updateDto as any,
        currentUser,
      );

      expect(result).toEqual(updatedUser);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: {
          id: 'user-1',
        },
        data: {
          profile: {
            upsert: {
              create: {
                firstName: 'Johnny',
                lastName: '',
                displayName: '',
                avatarUrl: undefined,
                jobTitle: undefined,
                bio: undefined,
                timezone: 'UTC',
                language: 'en',
              },
              update: {
                firstName: 'Johnny',
              },
            },
          },
        },
        include: {
          profile: true,
        },
      });
    });

    it('should update email and profile together', async () => {
      const existingUser = {
        id: 'user-1',
        email: 'old@example.com',
        profile: null,
      };

      const updatedUser = {
        id: 'user-1',
        email: 'new@example.com',
        profile: {
          firstName: 'John',
        },
      };

      prismaService.user.findUnique
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(null);

      prismaService.user.update.mockResolvedValue(updatedUser);

      const updateDto = {
        email: 'new@example.com',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          displayName: 'John Doe',
        },
      };

      const result = await service.update(
        'user-1',
        updateDto as any,
        currentUser,
      );

      expect(result).toEqual(updatedUser);

      expect(prismaService.user.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const currentUser = {
      id: 'user-1',
      email: 'john@example.com',
      role: 'USER',
    } as any;

    it('should delete a user', async () => {
      const user = {
        id: 'user-2',
        email: 'jane@example.com',
      };

      prismaService.user.findUnique.mockResolvedValue(user);
      prismaService.user.delete.mockResolvedValue(user);

      const result = await service.remove(
        'user-2',
        currentUser,
      );

      expect(result).toEqual({
        message: 'User user-2 deleted successfully',
      });

      expect(
        authorizationService.canDeleteUser,
      ).toHaveBeenCalledWith(currentUser, 'user-2');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'user-2',
        },
      });

      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: {
          id: 'user-2',
        },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.remove('user-2', currentUser),
      ).rejects.toThrow(
        new NotFoundException('User not found'),
      );

      expect(prismaService.user.delete).not.toHaveBeenCalled();
    });
  });
});