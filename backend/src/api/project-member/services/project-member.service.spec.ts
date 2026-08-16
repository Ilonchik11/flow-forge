import {
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, ProjectRole } from '@prisma/client';

import { ProjectMemberService } from './project-member.service';
import { CreateProjectMemberDto, UpdateProjectMemberDto } from '../dto';
import { AuthenticatedUser } from 'src/common/interfaces';

describe('ProjectMemberService', () => {
  let service: ProjectMemberService;

  type TxMock = {
    projectMember: {
      findMany: jest.Mock<() => Promise<any[]>>;
      create: jest.Mock<() => Promise<any>>;
      update: jest.Mock<() => Promise<any>>;
      delete: jest.Mock<() => Promise<any>>;
    };
  };

  const tx: TxMock = {
    projectMember: {
      findMany: jest.fn<() => Promise<any[]>>(),
      create: jest.fn<() => Promise<any>>(),
      update: jest.fn<() => Promise<any>>(),
      delete: jest.fn<() => Promise<any>>(),
    },
  };

  const prismaService = {
    projectMember: {
      findUnique: jest.fn<() => Promise<any>>(),
      findFirst: jest.fn<() => Promise<any>>(),
      findMany: jest.fn<() => Promise<any[]>>(),
      create: jest.fn<() => Promise<any>>(),
      update: jest.fn<() => Promise<any>>(),
      delete: jest.fn<() => Promise<any>>(),
    },

    user: {
      findUnique: jest.fn<() => Promise<any>>(),
    },

    project: {
      findUnique: jest.fn<() => Promise<any>>(),
    },

    $transaction: jest.fn(
      async (callback: (tx: TxMock) => Promise<any>) => {
        return callback(tx);
      },
    ),
  };

  const authorizationService = {
    canViewProjectMembers: jest.fn(),
    canManageProjectMembers: jest.fn(),
    canLeaveProject: jest.fn(),
  };

  const notificationService = {
    createTx: jest.fn<() => Promise<any>>(),
    notifyUsersTx: jest.fn<() => Promise<any>>(),
  };

  const currentUser: AuthenticatedUser = {
    id: 'user-1',
    email: 'john@example.com',
    role: 'USER',
    status: 'ACTIVE',
  };

  const project = {
    id: 'project-1',
    name: 'Flow Forge',
    ownerId: 'user-2',

    members: [
      {
        userId: 'user-1',
        role: ProjectRole.MEMBER,
      },
      {
        userId: 'user-2',
        role: ProjectRole.ADMIN,
      },
      {
        userId: 'user-3',
        role: ProjectRole.MEMBER,
      },
    ],
  };

  const member = {
    id: 'member-1',
    projectId: 'project-1',
    userId: 'user-3',
    role: ProjectRole.MEMBER,
    joinedAt: new Date(),
  };

  const memberResponse = {
    id: 'member-1',
    projectId: 'project-1',
    userId: 'user-3',
    role: ProjectRole.MEMBER,
    joinedAt: member.joinedAt,
    user: {
      id: 'user-3',
      email: 'jane@example.com',
      status: 'ACTIVE',
      isEmailVerified: true,
      profile: {
        id: 'profile-3',
        firstName: 'Jane',
        lastName: 'Doe',
        displayName: 'Jane Doe',
        avatarUrl: null,
        jobTitle: 'Developer',
      },
    },
  };

  const user = {
    id: 'user-3',
    email: 'jane@example.com',
    status: 'ACTIVE',
    isEmailVerified: true,
  };

  const setupTransaction = (
    overrides: Partial<TxMock> = {},
  ) => {
    const transaction: TxMock = {
      projectMember: {
        findMany: jest.fn<() => Promise<any[]>>(),
        create: jest.fn<() => Promise<any>>(),
        update: jest.fn<() => Promise<any>>(),
        delete: jest.fn<() => Promise<any>>(),
      },
    };

    Object.assign(transaction, overrides);

    prismaService.$transaction.mockImplementationOnce(
      async (callback: (tx: TxMock) => Promise<any>) => {
        return callback(transaction);
      },
    );

    return transaction;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    prismaService.projectMember.findUnique.mockReset();
    prismaService.projectMember.findFirst.mockReset();
    prismaService.projectMember.findMany.mockReset();
    prismaService.projectMember.create.mockReset();
    prismaService.projectMember.update.mockReset();
    prismaService.projectMember.delete.mockReset();

    prismaService.user.findUnique.mockReset();
    prismaService.project.findUnique.mockReset();

    authorizationService.canViewProjectMembers.mockReset();
    authorizationService.canManageProjectMembers.mockReset();
    authorizationService.canLeaveProject.mockReset();

    notificationService.createTx.mockReset();
    notificationService.notifyUsersTx.mockReset();

    prismaService.$transaction.mockReset();

    prismaService.$transaction.mockImplementation(
      async (callback: (tx: TxMock) => Promise<any>) => {
        return callback(tx);
      },
    );

    service = new ProjectMemberService(
      prismaService as any,
      authorizationService as any,
      notificationService as any,
    );
  });

  describe('findAll', () => {
    beforeEach(() => {
      prismaService.project.findUnique.mockResolvedValue(project);

      authorizationService.canViewProjectMembers.mockImplementation(
        () => undefined,
      );
    });

    it('should return all project members', async () => {
      const members = [memberResponse];

      prismaService.projectMember.findMany.mockResolvedValue(
        members,
      );

      const result = await service.findAll(
        'project-1',
        currentUser,
      );

      expect(result).toEqual(members);

      expect(
        prismaService.project.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          id: 'project-1',
        },
        include: {
          members: {
            select: {
              userId: true,
              role: true,
            },
          },
        },
      });

      expect(
        authorizationService.canViewProjectMembers,
      ).toHaveBeenCalledWith(
        currentUser,
        project,
      );

      expect(
        prismaService.projectMember.findMany,
      ).toHaveBeenCalledWith({
        where: {
          projectId: project.id,
        },
        select: expect.any(Object),
        orderBy: {
          joinedAt: 'asc',
        },
      });
    });

    it('should throw NotFoundException when project does not exist', async () => {
      prismaService.project.findUnique.mockResolvedValue(null);

      await expect(
        service.findAll(
          'project-1',
          currentUser,
        ),
      ).rejects.toThrow(
        new NotFoundException('Project not found'),
      );

      expect(
        authorizationService.canViewProjectMembers,
      ).not.toHaveBeenCalled();

      expect(
        prismaService.projectMember.findMany,
      ).not.toHaveBeenCalled();
    });

    it('should propagate authorization errors', async () => {
      authorizationService.canViewProjectMembers.mockImplementation(
        () => {
          throw new Error('Forbidden');
        },
      );

      await expect(
        service.findAll(
          'project-1',
          currentUser,
        ),
      ).rejects.toThrow('Forbidden');

      expect(
        prismaService.projectMember.findMany,
      ).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    beforeEach(() => {
      prismaService.project.findUnique.mockResolvedValue(project);

      authorizationService.canViewProjectMembers.mockImplementation(
        () => undefined,
      );
    });

    it('should return a project member', async () => {
      prismaService.projectMember.findFirst.mockResolvedValue(
        memberResponse,
      );

      const result = await service.findOne(
        'project-1',
        'member-1',
        currentUser,
      );

      expect(result).toEqual(memberResponse);

      expect(
        authorizationService.canViewProjectMembers,
      ).toHaveBeenCalledWith(
        currentUser,
        project,
      );

      expect(
        prismaService.projectMember.findFirst,
      ).toHaveBeenCalledWith({
        where: {
          id: 'member-1',
          projectId: 'project-1',
        },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when member does not exist', async () => {
      prismaService.projectMember.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(
          'project-1',
          'member-1',
          currentUser,
        ),
      ).rejects.toThrow(
        new NotFoundException('Project member not found'),
      );
    });

    it('should throw NotFoundException when project does not exist', async () => {
      prismaService.project.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne(
          'project-1',
          'member-1',
          currentUser,
        ),
      ).rejects.toThrow(
        new NotFoundException('Project not found'),
      );

      expect(
        prismaService.projectMember.findFirst,
      ).not.toHaveBeenCalled();
    });

    it('should propagate authorization errors', async () => {
      authorizationService.canViewProjectMembers.mockImplementation(
        () => {
          throw new Error('Forbidden');
        },
      );

      await expect(
        service.findOne(
          'project-1',
          'member-1',
          currentUser,
        ),
      ).rejects.toThrow('Forbidden');

      expect(
        prismaService.projectMember.findFirst,
      ).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    const dto: CreateProjectMemberDto = {
      userId: 'user-3',
    };

    beforeEach(() => {
      prismaService.project.findUnique.mockResolvedValue(project);

      authorizationService.canManageProjectMembers.mockImplementation(
        () => undefined,
      );

      prismaService.user.findUnique.mockResolvedValue(user);

      prismaService.projectMember.findUnique.mockResolvedValue(
        null,
      );
    });

    it('should create a project member', async () => {
      const existingMembers = [
        { userId: 'user-1' },
        { userId: 'user-2' },
      ];

      const transaction = setupTransaction();

      transaction.projectMember.findMany.mockResolvedValue(
        existingMembers,
      );

      transaction.projectMember.create.mockResolvedValue(
        memberResponse,
      );

      notificationService.createTx.mockResolvedValue(undefined);
      notificationService.notifyUsersTx.mockResolvedValue(
        undefined,
      );

      const result = await service.create(
        'project-1',
        dto,
        currentUser,
      );

      expect(result).toEqual(memberResponse);

      expect(
        transaction.projectMember.findMany,
      ).toHaveBeenCalledWith({
        where: {
          projectId: project.id,
        },
        select: {
          userId: true,
        },
      });

      expect(
        transaction.projectMember.create,
      ).toHaveBeenCalledWith({
        data: {
          projectId: project.id,
          userId: dto.userId,
          role: ProjectRole.MEMBER,
        },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when project does not exist', async () => {
      prismaService.project.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          'project-1',
          dto,
          currentUser,
        ),
      ).rejects.toThrow(
        new NotFoundException('Project not found'),
      );

      expect(
        prismaService.user.findUnique,
      ).not.toHaveBeenCalled();
    });

    it('should propagate authorization errors', async () => {
      authorizationService.canManageProjectMembers.mockImplementation(
        () => {
          throw new Error('Forbidden');
        },
      );

      await expect(
        service.create(
          'project-1',
          dto,
          currentUser,
        ),
      ).rejects.toThrow('Forbidden');

      expect(
        prismaService.user.findUnique,
      ).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          'project-1',
          dto,
          currentUser,
        ),
      ).rejects.toThrow(
        new NotFoundException('User not found'),
      );

      expect(
        prismaService.projectMember.findUnique,
      ).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when user is already a member', async () => {
      prismaService.projectMember.findUnique.mockResolvedValue(
        member,
      );

      await expect(
        service.create(
          'project-1',
          dto,
          currentUser,
        ),
      ).rejects.toThrow(
        new ConflictException(
          'User is already a member of this project',
        ),
      );

      expect(
        prismaService.$transaction,
      ).not.toHaveBeenCalled();
    });

    it('should notify the newly added member', async () => {
      const transaction = setupTransaction();

      transaction.projectMember.findMany.mockResolvedValue([]);

      transaction.projectMember.create.mockResolvedValue(
        memberResponse,
      );

      notificationService.createTx.mockResolvedValue(undefined);
      notificationService.notifyUsersTx.mockResolvedValue(
        undefined,
      );

      await service.create(
        'project-1',
        dto,
        currentUser,
      );

      expect(
        notificationService.createTx,
      ).toHaveBeenCalledWith(
        transaction,
        {
          userId: dto.userId,
          type: NotificationType.PROJECT_MEMBER_ADDED,
          title: 'Added to project',
          message: 'You were added to project "Flow Forge"',
        },
      );
    });

    it('should notify existing project members except the current user', async () => {
      const existingMembers = [
        { userId: 'user-1' },
        { userId: 'user-2' },
        { userId: 'user-3' },
      ];

      const transaction = setupTransaction();

      transaction.projectMember.findMany.mockResolvedValue(
        existingMembers,
      );

      transaction.projectMember.create.mockResolvedValue(
        memberResponse,
      );

      notificationService.createTx.mockResolvedValue(undefined);
      notificationService.notifyUsersTx.mockResolvedValue(
        undefined,
      );

      await service.create(
        'project-1',
        dto,
        currentUser,
      );

      expect(
        notificationService.notifyUsersTx,
      ).toHaveBeenCalledWith(
        transaction,
        ['user-2', 'user-3'],
        NotificationType.PROJECT_MEMBER_ADDED,
        'New project member',
        'jane@example.com was added to project "Flow Forge"',
      );
    });

    it('should not notify the current user about the new member', async () => {
      const transaction = setupTransaction();

      transaction.projectMember.findMany.mockResolvedValue([
        { userId: 'user-1' },
      ]);

      transaction.projectMember.create.mockResolvedValue(
        memberResponse,
      );

      notificationService.createTx.mockResolvedValue(undefined);
      notificationService.notifyUsersTx.mockResolvedValue(
        undefined,
      );

      await service.create(
        'project-1',
        dto,
        currentUser,
      );

      expect(
        notificationService.notifyUsersTx,
      ).toHaveBeenCalledWith(
        transaction,
        [],
        NotificationType.PROJECT_MEMBER_ADDED,
        'New project member',
        'jane@example.com was added to project "Flow Forge"',
      );
    });
  });

  describe('update', () => {
    const dto: UpdateProjectMemberDto = {
      role: ProjectRole.ADMIN,
    };

    beforeEach(() => {
      prismaService.project.findUnique.mockResolvedValue(project);

      authorizationService.canManageProjectMembers.mockImplementation(
        () => undefined,
      );

      prismaService.projectMember.findFirst.mockResolvedValue(
        member,
      );
    });

    it('should update a project member role', async () => {
      const updatedMember = {
        ...memberResponse,
        role: ProjectRole.ADMIN,
      };

      const transaction = setupTransaction();

      transaction.projectMember.update.mockResolvedValue(
        updatedMember,
      );

      notificationService.createTx.mockResolvedValue(undefined);

      const result = await service.update(
        'project-1',
        'member-1',
        dto,
        currentUser,
      );

      expect(result).toEqual(updatedMember);

      expect(
        transaction.projectMember.update,
      ).toHaveBeenCalledWith({
        where: {
          id: member.id,
        },
        data: {
          role: dto.role,
        },
        select: expect.any(Object),
      });
    });

    it('should notify the member when their role changes', async () => {
      const updatedMember = {
        ...memberResponse,
        role: ProjectRole.ADMIN,
      };

      const transaction = setupTransaction();

      transaction.projectMember.update.mockResolvedValue(
        updatedMember,
      );

      notificationService.createTx.mockResolvedValue(undefined);

      await service.update(
        'project-1',
        'member-1',
        dto,
        currentUser,
      );

      expect(
        notificationService.createTx,
      ).toHaveBeenCalledWith(
        transaction,
        {
          userId: member.userId,
          type: NotificationType.PROJECT_MEMBER_ROLE_CHANGED,
          title: 'Project role changed',
          message:
            'Your role in project "Flow Forge" was changed from MEMBER to ADMIN',
        },
      );
    });

    it('should return the updated member', async () => {
      const updatedMember = {
        ...memberResponse,
        role: ProjectRole.ADMIN,
      };

      const transaction = setupTransaction();

      transaction.projectMember.update.mockResolvedValue(
        updatedMember,
      );

      notificationService.createTx.mockResolvedValue(undefined);

      const result = await service.update(
        'project-1',
        'member-1',
        dto,
        currentUser,
      );

      expect(result).toEqual(updatedMember);
    });

    it('should throw NotFoundException when member does not exist', async () => {
      prismaService.projectMember.findFirst.mockResolvedValue(
        null,
      );

      await expect(
        service.update(
          'project-1',
          'member-1',
          dto,
          currentUser,
        ),
      ).rejects.toThrow(
        new NotFoundException('Project member not found'),
      );

      expect(
        prismaService.$transaction,
      ).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when trying to change project owner role', async () => {
      prismaService.projectMember.findFirst.mockResolvedValue({
        ...member,
        userId: project.ownerId,
      });

      await expect(
        service.update(
          'project-1',
          'member-1',
          dto,
          currentUser,
        ),
      ).rejects.toThrow(
        new ForbiddenException(
          'Project owner role cannot be changed',
        ),
      );

      expect(
        prismaService.$transaction,
      ).not.toHaveBeenCalled();
    });

    it('should propagate authorization errors', async () => {
      authorizationService.canManageProjectMembers.mockImplementation(
        () => {
          throw new Error('Forbidden');
        },
      );

      await expect(
        service.update(
          'project-1',
          'member-1',
          dto,
          currentUser,
        ),
      ).rejects.toThrow('Forbidden');

      expect(
        prismaService.projectMember.findFirst,
      ).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when project does not exist', async () => {
      prismaService.project.findUnique.mockResolvedValue(null);

      await expect(
        service.update(
          'project-1',
          'member-1',
          dto,
          currentUser,
        ),
      ).rejects.toThrow(
        new NotFoundException('Project not found'),
      );

      expect(
        prismaService.projectMember.findFirst,
      ).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      prismaService.project.findUnique.mockResolvedValue(project);

      authorizationService.canManageProjectMembers.mockImplementation(
        () => undefined,
      );

      prismaService.projectMember.findFirst.mockResolvedValue(
        member,
      );
    });

    it('should remove a project member', async () => {
      const transaction = setupTransaction();

      transaction.projectMember.delete.mockResolvedValue(
        member,
      );

      notificationService.createTx.mockResolvedValue(undefined);

      const result = await service.remove(
        'project-1',
        'member-1',
        currentUser,
      );

      expect(result).toBeUndefined();

      expect(
        transaction.projectMember.delete,
      ).toHaveBeenCalledWith({
        where: {
          id: member.id,
        },
      });
    });

    it('should notify the removed member', async () => {
      const transaction = setupTransaction();

      transaction.projectMember.delete.mockResolvedValue(
        member,
      );

      notificationService.createTx.mockResolvedValue(undefined);

      await service.remove(
        'project-1',
        'member-1',
        currentUser,
      );

      expect(
        notificationService.createTx,
      ).toHaveBeenCalledWith(
        transaction,
        {
          userId: member.userId,
          type: NotificationType.PROJECT_MEMBER_REMOVED,
          title: 'Removed from project',
          message: 'You were removed from project "Flow Forge"',
        },
      );
    });

    it('should throw NotFoundException when member does not exist', async () => {
      prismaService.projectMember.findFirst.mockResolvedValue(
        null,
      );

      await expect(
        service.remove(
          'project-1',
          'member-1',
          currentUser,
        ),
      ).rejects.toThrow(
        new NotFoundException('Project member not found'),
      );

      expect(
        prismaService.$transaction,
      ).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when trying to remove project owner', async () => {
      prismaService.projectMember.findFirst.mockResolvedValue({
        ...member,
        userId: project.ownerId,
      });

      await expect(
        service.remove(
          'project-1',
          'member-1',
          currentUser,
        ),
      ).rejects.toThrow(
        new ForbiddenException(
          'Project owner cannot be removed',
        ),
      );

      expect(
        prismaService.$transaction,
      ).not.toHaveBeenCalled();
    });

    it('should propagate authorization errors', async () => {
      authorizationService.canManageProjectMembers.mockImplementation(
        () => {
          throw new Error('Forbidden');
        },
      );

      await expect(
        service.remove(
          'project-1',
          'member-1',
          currentUser,
        ),
      ).rejects.toThrow('Forbidden');

      expect(
        prismaService.projectMember.findFirst,
      ).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when project does not exist', async () => {
      prismaService.project.findUnique.mockResolvedValue(null);

      await expect(
        service.remove(
          'project-1',
          'member-1',
          currentUser,
        ),
      ).rejects.toThrow(
        new NotFoundException('Project not found'),
      );

      expect(
        prismaService.projectMember.findFirst,
      ).not.toHaveBeenCalled();
    });
  });

  describe('leave', () => {
    beforeEach(() => {
      prismaService.project.findUnique.mockResolvedValue(project);

      authorizationService.canLeaveProject.mockImplementation(
        () => undefined,
      );

      prismaService.projectMember.findUnique.mockResolvedValue(
        member,
      );
    });

    it('should allow the current user to leave the project', async () => {
      const currentUserMember = {
        ...member,
        userId: currentUser.id,
      };

      prismaService.projectMember.findUnique.mockResolvedValue(
        currentUserMember,
      );

      const transaction = setupTransaction();

      transaction.projectMember.findMany.mockResolvedValue([
        { userId: 'user-2' },
        { userId: 'user-3' },
      ]);

      transaction.projectMember.delete.mockResolvedValue(
        currentUserMember,
      );

      notificationService.notifyUsersTx.mockResolvedValue(
        undefined,
      );

      const result = await service.leave(
        'project-1',
        currentUser,
      );

      expect(result).toBeUndefined();

      expect(
        transaction.projectMember.delete,
      ).toHaveBeenCalledWith({
        where: {
          id: currentUserMember.id,
        },
      });
    });

    it('should notify remaining project members', async () => {
      const currentUserMember = {
        ...member,
        userId: currentUser.id,
      };

      prismaService.projectMember.findUnique.mockResolvedValue(
        currentUserMember,
      );

      const transaction = setupTransaction();

      transaction.projectMember.findMany.mockResolvedValue([
        { userId: 'user-2' },
        { userId: 'user-3' },
      ]);

      transaction.projectMember.delete.mockResolvedValue(
        currentUserMember,
      );

      notificationService.notifyUsersTx.mockResolvedValue(
        undefined,
      );

      await service.leave(
        'project-1',
        currentUser,
      );

      expect(
        notificationService.notifyUsersTx,
      ).toHaveBeenCalledWith(
        transaction,
        ['user-2', 'user-3'],
        NotificationType.PROJECT_MEMBER_LEFT,
        'Project member left',
        'john@example.com left project "Flow Forge"',
      );
    });

    it('should not notify the current user', async () => {
      const currentUserMember = {
        ...member,
        userId: currentUser.id,
      };

      prismaService.projectMember.findUnique.mockResolvedValue(
        currentUserMember,
      );

      const transaction = setupTransaction();

      transaction.projectMember.findMany.mockResolvedValue([
        { userId: 'user-2' },
      ]);

      transaction.projectMember.delete.mockResolvedValue(
        currentUserMember,
      );

      notificationService.notifyUsersTx.mockResolvedValue(undefined);

      await service.leave(
        'project-1',
        currentUser,
      );

      expect(
        notificationService.notifyUsersTx,
      ).toHaveBeenCalledWith(
        transaction,
        ['user-2'],
        NotificationType.PROJECT_MEMBER_LEFT,
        'Project member left',
        'john@example.com left project "Flow Forge"',
      );
    });

    it('should allow leaving when there are no remaining members', async () => {
      const currentUserMember = {
        ...member,
        userId: currentUser.id,
      };

      prismaService.projectMember.findUnique.mockResolvedValue(
        currentUserMember,
      );

      const transaction = setupTransaction();

      transaction.projectMember.findMany.mockResolvedValue([]);

      transaction.projectMember.delete.mockResolvedValue(
        currentUserMember,
      );

      notificationService.notifyUsersTx.mockResolvedValue(
        undefined,
      );

      await service.leave(
        'project-1',
        currentUser,
      );

      expect(
        notificationService.notifyUsersTx,
      ).toHaveBeenCalledWith(
        transaction,
        [],
        NotificationType.PROJECT_MEMBER_LEFT,
        'Project member left',
        'john@example.com left project "Flow Forge"',
      );

      expect(
        transaction.projectMember.delete,
      ).toHaveBeenCalledWith({
        where: {
          id: currentUserMember.id,
        },
      });
    });

    it('should throw NotFoundException when current user is not a project member', async () => {
      prismaService.projectMember.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.leave(
          'project-1',
          currentUser,
        ),
      ).rejects.toThrow(
        new NotFoundException(
          'You are not a member of this project',
        ),
      );

      expect(
        prismaService.$transaction,
      ).not.toHaveBeenCalled();
    });

    it('should propagate authorization errors', async () => {
      authorizationService.canLeaveProject.mockImplementation(
        () => {
          throw new Error('Forbidden');
        },
      );

      await expect(
        service.leave(
          'project-1',
          currentUser,
        ),
      ).rejects.toThrow('Forbidden');

      expect(
        prismaService.projectMember.findUnique,
      ).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when project does not exist', async () => {
      prismaService.project.findUnique.mockResolvedValue(null);

      await expect(
        service.leave(
          'project-1',
          currentUser,
        ),
      ).rejects.toThrow(
        new NotFoundException('Project not found'),
      );

      expect(
        prismaService.projectMember.findUnique,
      ).not.toHaveBeenCalled();
    });
  });
});