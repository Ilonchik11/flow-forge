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
import {
  NotificationType,
  WorkspaceRole,
} from '@prisma/client';

import { WorkspaceMemberService } from './workspace-member.service';

describe('WorkspaceMemberService', () => {
  let service: WorkspaceMemberService;

  type TxMock = {
    workspaceMember: {
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const tx: TxMock = {
    workspaceMember: {
      findMany: jest.fn<() => Promise<any[]>>(),
      create: jest.fn<() => Promise<any>>(),
      update: jest.fn<() => Promise<any>>(),
      delete: jest.fn<() => Promise<any>>(),
    },
  };

  const prismaService = {
    workspaceMember: {
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

    workspace: {
      findUnique: jest.fn<() => Promise<any>>(),
    },

    $transaction: jest.fn(
      async (callback: (tx: TxMock) => Promise<any>) => {
        return callback(tx);
      },
    ),
  };

  const authorizationService = {
    canViewWorkspaceMembers: jest.fn(),
    canManageWorkspaceMembers: jest.fn(),
    canLeaveWorkspace: jest.fn(),
  };

  const notificationService = {
    createTx: jest.fn<() => Promise<any>>(),
    notifyUsersTx: jest.fn<() => Promise<any>>(),
  };

  const currentUser = {
    id: 'user-1',
    email: 'john@example.com',
    role: 'USER',
    status: 'ACTIVE',
  };

  const membership = {
    id: 'membership-1',
    userId: 'user-1',
    workspaceId: 'workspace-1',
    role: WorkspaceRole.ADMIN,
    joinedAt: new Date(),
  };

  const workspace = {
    name: 'Flow Forge',
  };

  const user = {
    id: 'user-2',
    email: 'jane@example.com',
    status: 'ACTIVE',
    isEmailVerified: true,
  };

  const member = {
    id: 'member-1',
    userId: 'user-2',
    workspaceId: 'workspace-1',
    role: WorkspaceRole.MEMBER,
    joinedAt: new Date(),
  };

  const ownerMember = {
    id: 'member-owner',
    userId: 'user-2',
    workspaceId: 'workspace-1',
    role: WorkspaceRole.OWNER,
    joinedAt: new Date(),
  };

  const memberResponse = {
    id: 'member-1',
    userId: 'user-2',
    workspaceId: 'workspace-1',
    role: WorkspaceRole.MEMBER,
    joinedAt: member.joinedAt,
    user: {
      id: 'user-2',
      email: 'jane@example.com',
      status: 'ACTIVE',
      isEmailVerified: true,
      profile: {
        id: 'profile-2',
        firstName: 'Jane',
        lastName: 'Doe',
        displayName: 'Jane Doe',
        avatarUrl: null,
        jobTitle: 'Developer',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    prismaService.workspaceMember.findUnique.mockReset();
    prismaService.workspaceMember.findFirst.mockReset();
    prismaService.workspaceMember.findMany.mockReset();
    prismaService.workspaceMember.create.mockReset();
    prismaService.workspaceMember.update.mockReset();
    prismaService.workspaceMember.delete.mockReset();

    prismaService.user.findUnique.mockReset();
    prismaService.workspace.findUnique.mockReset();

    prismaService.$transaction.mockReset();

    authorizationService.canViewWorkspaceMembers.mockReset();
    authorizationService.canManageWorkspaceMembers.mockReset();
    authorizationService.canLeaveWorkspace.mockReset();

    notificationService.createTx.mockReset();
    notificationService.notifyUsersTx.mockReset();

    service = new WorkspaceMemberService(
      prismaService as any,
      authorizationService as any,
      notificationService as any,
    );
  });
  const setupTransaction = (txOverrides: any = {}) => {
    const tx = {
      workspaceMember: {
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        ...txOverrides.workspaceMember,
      },
    };

    prismaService.$transaction.mockImplementation(
      async (callback: (tx: any) => Promise<any>) => {
        return callback(tx);
      },
    );

    return tx;
  };

  describe('findAll', () => {
    beforeEach(() => {
      prismaService.workspaceMember.findUnique.mockResolvedValue(
        membership,
      );

      authorizationService.canViewWorkspaceMembers.mockImplementation(
        () => undefined,
      );

      prismaService.workspaceMember.findMany.mockResolvedValue([
        memberResponse,
      ]);
    });

    it('should return all workspace members', async () => {
      const result = await service.findAll(
        'workspace-1',
        currentUser as any,
      );

      expect(result).toEqual([memberResponse]);

      expect(
        prismaService.workspaceMember.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          userId_workspaceId: {
            userId: currentUser.id,
            workspaceId: 'workspace-1',
          },
        },
      });

      expect(
        authorizationService.canViewWorkspaceMembers,
      ).toHaveBeenCalledWith(
        currentUser,
        membership.role,
      );

      expect(
        prismaService.workspaceMember.findMany,
      ).toHaveBeenCalledWith({
        where: {
          workspaceId: 'workspace-1',
        },
        select: expect.any(Object),
        orderBy: {
          joinedAt: 'asc',
        },
      });
    });

    it('should throw ForbiddenException when current user is not a workspace member', async () => {
      prismaService.workspaceMember.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.findAll(
          'workspace-1',
          currentUser as any,
        ),
      ).rejects.toThrow(
        new ForbiddenException(
          'You are not a member of this workspace',
        ),
      );

      expect(
        authorizationService.canViewWorkspaceMembers,
      ).not.toHaveBeenCalled();

      expect(
        prismaService.workspaceMember.findMany,
      ).not.toHaveBeenCalled();
    });

    it('should propagate authorization errors', async () => {
      authorizationService.canViewWorkspaceMembers.mockImplementation(
        () => {
          throw new Error('Forbidden');
        },
      );

      await expect(
        service.findAll(
          'workspace-1',
          currentUser as any,
        ),
      ).rejects.toThrow('Forbidden');

      expect(
        prismaService.workspaceMember.findMany,
      ).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    beforeEach(() => {
      prismaService.workspaceMember.findUnique.mockResolvedValue(
        membership,
      );

      authorizationService.canViewWorkspaceMembers.mockImplementation(
        () => undefined,
      );

      prismaService.workspaceMember.findFirst.mockResolvedValue(
        memberResponse,
      );
    });

    it('should return a workspace member', async () => {
      const result = await service.findOne(
        'workspace-1',
        'member-1',
        currentUser as any,
      );

      expect(result).toEqual(memberResponse);

      expect(
        authorizationService.canViewWorkspaceMembers,
      ).toHaveBeenCalledWith(
        currentUser,
        membership.role,
      );

      expect(
        prismaService.workspaceMember.findFirst,
      ).toHaveBeenCalledWith({
        where: {
          id: 'member-1',
          workspaceId: 'workspace-1',
        },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when workspace member does not exist', async () => {
      prismaService.workspaceMember.findFirst.mockResolvedValue(
        null,
      );

      await expect(
        service.findOne(
          'workspace-1',
          'member-1',
          currentUser as any,
        ),
      ).rejects.toThrow(
        new NotFoundException(
          'Workspace member not found',
        ),
      );
    });

    it('should throw ForbiddenException when current user is not a workspace member', async () => {
      prismaService.workspaceMember.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.findOne(
          'workspace-1',
          'member-1',
          currentUser as any,
        ),
      ).rejects.toThrow(
        new ForbiddenException(
          'You are not a member of this workspace',
        ),
      );

      expect(
        prismaService.workspaceMember.findFirst,
      ).not.toHaveBeenCalled();
    });

    it('should propagate authorization errors', async () => {
      authorizationService.canViewWorkspaceMembers.mockImplementation(
        () => {
          throw new Error('Forbidden');
        },
      );

      await expect(
        service.findOne(
          'workspace-1',
          'member-1',
          currentUser as any,
        ),
      ).rejects.toThrow('Forbidden');

      expect(
        prismaService.workspaceMember.findFirst,
      ).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    const dto = {
      userId: 'user-2',
    };

    beforeEach(() => {
      prismaService.workspaceMember.findUnique
        .mockResolvedValueOnce(membership)
        .mockResolvedValueOnce(null);

      authorizationService.canManageWorkspaceMembers.mockImplementation(
        () => undefined,
      );

      prismaService.user.findUnique.mockResolvedValue(user);

      prismaService.workspace.findUnique.mockResolvedValue(
        workspace,
      );
    });

    it('should create a workspace member', async () => {
      const existingMembers: Array<{ userId: string }> = [
        { userId: 'user-1' },
        { userId: 'user-3' },
      ];

      const tx = setupTransaction({
        workspaceMember: {
          findMany: jest
            .fn<() => Promise<any[]>>()
            .mockResolvedValue(existingMembers as any),
          create: jest
            .fn<() => Promise<any>>()
            .mockResolvedValue(memberResponse),
        },
      });

      notificationService.createTx.mockResolvedValue(undefined);
      notificationService.notifyUsersTx.mockResolvedValue(undefined);

      const result = await service.create(
        'workspace-1',
        dto as any,
        currentUser as any,
      );

      expect(result).toEqual(memberResponse);

      expect(
        authorizationService.canManageWorkspaceMembers,
      ).toHaveBeenCalledWith(
        currentUser,
        membership.role,
      );

      expect(
        prismaService.user.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          id: dto.userId,
        },
      });

      expect(
        prismaService.workspace.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          id: 'workspace-1',
        },
        select: {
          name: true,
        },
      });

      expect(
        tx.workspaceMember.findMany,
      ).toHaveBeenCalledWith({
        where: {
          workspaceId: 'workspace-1',
        },
        select: {
          userId: true,
        },
      });

      expect(
        tx.workspaceMember.create,
      ).toHaveBeenCalledWith({
        data: {
          userId: dto.userId,
          workspaceId: 'workspace-1',
          role: WorkspaceRole.MEMBER,
        },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when current user is not a workspace member', async () => {
      prismaService.workspaceMember.findUnique.mockReset();
      prismaService.workspaceMember.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.create(
          'workspace-1',
          dto as any,
          currentUser as any,
        ),
      ).rejects.toThrow(
        new ForbiddenException(
          'You are not a member of this workspace',
        ),
      );

      expect(
        prismaService.user.findUnique,
      ).not.toHaveBeenCalled();
    });

    it('should propagate authorization errors', async () => {
      authorizationService.canManageWorkspaceMembers.mockImplementation(
        () => {
          throw new Error('Forbidden');
        },
      );

      await expect(
        service.create(
          'workspace-1',
          dto as any,
          currentUser as any,
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
          'workspace-1',
          dto as any,
          currentUser as any,
        ),
      ).rejects.toThrow(
        new NotFoundException('User not found'),
      );

      expect(
        prismaService.workspace.findUnique,
      ).not.toHaveBeenCalled();

      expect(
        prismaService.$transaction,
      ).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when workspace does not exist', async () => {
      prismaService.workspace.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.create(
          'workspace-1',
          dto as any,
          currentUser as any,
        ),
      ).rejects.toThrow(
        new NotFoundException('Workspace not found'),
      );

      expect(
        prismaService.$transaction,
      ).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when user is already a member', async () => {
      prismaService.workspaceMember.findUnique
        .mockReset();

      prismaService.workspaceMember.findUnique
        .mockResolvedValueOnce(membership)
        .mockResolvedValueOnce(member);

      await expect(
        service.create(
          'workspace-1',
          dto as any,
          currentUser as any,
        ),
      ).rejects.toThrow(
        new ConflictException(
          'User is already a member of this workspace',
        ),
      );

      expect(
        prismaService.$transaction,
      ).not.toHaveBeenCalled();
    });

    it('should notify the newly added member', async () => {
      const tx = setupTransaction({
        workspaceMember: {
          findMany: jest
            .fn<() => Promise<any[]>>()
            .mockResolvedValue([]),
          create: jest
            .fn<() => Promise<any>>()
            .mockResolvedValue(memberResponse),
        },
      });

      await service.create(
        'workspace-1',
        dto as any,
        currentUser as any,
      );

      expect(
        notificationService.createTx,
      ).toHaveBeenCalledWith(
        tx,
        {
          userId: 'user-2',
          type: NotificationType.WORKSPACE_MEMBER_ADDED,
          title: 'Added to workspace',
          message: 'You were added to workspace "Flow Forge"',
        },
      );
    });

    it('should notify existing workspace members except the current user', async () => {
      const tx = setupTransaction({
        workspaceMember: {
          findMany: jest.fn<() => Promise<Array<{ userId: string }>>>().mockResolvedValue([
            { userId: 'user-1' },
            { userId: 'user-3' },
            { userId: 'user-4' },
          ]),
          create: jest.fn<() => Promise<any>>().mockResolvedValue(memberResponse),
        },
      });

      await service.create(
        'workspace-1',
        dto as any,
        currentUser as any,
      );

      expect(
        notificationService.notifyUsersTx,
      ).toHaveBeenCalledWith(
        tx,
        ['user-3', 'user-4'],
        NotificationType.WORKSPACE_MEMBER_ADDED,
        'New workspace member',
        'jane@example.com was added to the workspace "Flow Forge"',
      );
    });

    it('should not notify the current user about the new member', async () => {
      const tx = setupTransaction({
        workspaceMember: {
          findMany: jest.fn<() => Promise<Array<{ userId: string }>>>().mockResolvedValue([
            { userId: 'user-1' },
          ]),
          create: jest.fn<() => Promise<any>>().mockResolvedValue(memberResponse),
        },
      });

      await service.create(
        'workspace-1',
        dto as any,
        currentUser as any,
      );

      expect(
        notificationService.notifyUsersTx,
      ).toHaveBeenCalledWith(
        tx,
        [],
        NotificationType.WORKSPACE_MEMBER_ADDED,
        'New workspace member',
        'jane@example.com was added to the workspace "Flow Forge"',
      );
    });
  });

  describe('update', () => {
    const dto = {
      role: WorkspaceRole.ADMIN,
    };

    beforeEach(() => {
      prismaService.workspaceMember.findUnique.mockResolvedValue(
        membership,
      );

      authorizationService.canManageWorkspaceMembers.mockImplementation(
        () => undefined,
      );

      prismaService.workspaceMember.findFirst.mockResolvedValue(
        member,
      );

      prismaService.workspace.findUnique.mockResolvedValue(
        workspace,
      );
    });

    it('should update a workspace member role', async () => {
      const updatedMember = {
        ...memberResponse,
        role: WorkspaceRole.ADMIN,
      };

      const tx = setupTransaction({
        workspaceMember: {
          update: jest
            .fn<() => Promise<any>>()
            .mockResolvedValue(updatedMember),
        },
      });

      await service.update(
        'workspace-1',
        'member-1',
        dto as any,
        currentUser as any,
      );

      expect(
        authorizationService.canManageWorkspaceMembers,
      ).toHaveBeenCalledWith(
        currentUser,
        membership.role,
      );

      expect(
        tx.workspaceMember.update,
      ).toHaveBeenCalledWith({
        where: {
          id: member.id,
        },
        data: {
          role: dto.role,
        },
        select: expect.any(Object),
      });

      expect(
        notificationService.createTx,
      ).toHaveBeenCalledWith(
        tx,
        {
          userId: member.userId,
          type: NotificationType.WORKSPACE_MEMBER_ROLE_CHANGED,
          title: 'Workspace role changed',
          message:
            'Your role in workspace "Flow Forge" was changed from MEMBER to ADMIN',
        },
      );
    });

    it('should return the updated member', async () => {
      const updatedMember = {
        ...memberResponse,
        role: WorkspaceRole.ADMIN,
      };

      setupTransaction({
        workspaceMember: {
          update: jest
            .fn<() => Promise<any>>()
            .mockResolvedValue(updatedMember),
        },
      });

      const result = await service.update(
        'workspace-1',
        'member-1',
        dto as any,
        currentUser as any,
      );

      expect(result).toEqual(updatedMember);
    });

    it('should throw NotFoundException when member does not exist', async () => {
      prismaService.workspaceMember.findFirst.mockResolvedValue(
        null,
      );

      await expect(
        service.update(
          'workspace-1',
          'member-1',
          dto as any,
          currentUser as any,
        ),
      ).rejects.toThrow(
        new NotFoundException(
          'Workspace member not found',
        ),
      );

      expect(
        prismaService.$transaction,
      ).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when trying to change owner role', async () => {
      prismaService.workspaceMember.findFirst.mockResolvedValue(
        ownerMember,
      );

      await expect(
        service.update(
          'workspace-1',
          'member-owner',
          dto as any,
          currentUser as any,
        ),
      ).rejects.toThrow(
        new ForbiddenException(
          'Workspace owner role cannot be changed',
        ),
      );

      expect(
        prismaService.workspace.findUnique,
      ).not.toHaveBeenCalled();

      expect(
        prismaService.$transaction,
      ).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when trying to assign OWNER role', async () => {
      const ownerDto = {
        role: WorkspaceRole.OWNER,
      };

      await expect(
        service.update(
          'workspace-1',
          'member-1',
          ownerDto as any,
          currentUser as any,
        ),
      ).rejects.toThrow(
        new ForbiddenException(
          'Workspace ownership cannot be changed through this endpoint',
        ),
      );

      expect(
        prismaService.$transaction,
      ).not.toHaveBeenCalled();
    });

    it('should propagate authorization errors', async () => {
      authorizationService.canManageWorkspaceMembers.mockImplementation(
        () => {
          throw new Error('Forbidden');
        },
      );

      await expect(
        service.update(
          'workspace-1',
          'member-1',
          dto as any,
          currentUser as any,
        ),
      ).rejects.toThrow('Forbidden');

      expect(
        prismaService.workspaceMember.findFirst,
      ).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when workspace does not exist', async () => {
      prismaService.workspace.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.update(
          'workspace-1',
          'member-1',
          dto as any,
          currentUser as any,
        ),
      ).rejects.toThrow(
        new NotFoundException('Workspace not found'),
      );

      expect(
        prismaService.$transaction,
      ).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      prismaService.workspaceMember.findUnique.mockResolvedValue(
        membership,
      );

      authorizationService.canManageWorkspaceMembers.mockImplementation(
        () => undefined,
      );

      prismaService.workspaceMember.findFirst.mockResolvedValue(
        member,
      );

      prismaService.workspace.findUnique.mockResolvedValue(
        workspace,
      );
    });

    it('should remove a workspace member', async () => {
      const tx = setupTransaction();

      await service.remove(
        'workspace-1',
        'member-1',
        currentUser as any,
      );

      expect(
        tx.workspaceMember.delete,
      ).toHaveBeenCalledWith({
        where: {
          id: member.id,
        },
      });

      expect(
        notificationService.createTx,
      ).toHaveBeenCalledWith(
        tx,
        {
          userId: member.userId,
          type: NotificationType.WORKSPACE_MEMBER_REMOVED,
          title: 'Removed from workspace',
          message:
            'You were removed from workspace "Flow Forge"',
        },
      );
    });

    it('should throw NotFoundException when member does not exist', async () => {
      prismaService.workspaceMember.findFirst.mockResolvedValue(
        null,
      );

      await expect(
        service.remove(
          'workspace-1',
          'member-1',
          currentUser as any,
        ),
      ).rejects.toThrow(
        new NotFoundException(
          'Workspace member not found',
        ),
      );

      expect(
        prismaService.$transaction,
      ).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when trying to remove workspace owner', async () => {
      prismaService.workspaceMember.findFirst.mockResolvedValue(
        ownerMember,
      );

      await expect(
        service.remove(
          'workspace-1',
          'member-owner',
          currentUser as any,
        ),
      ).rejects.toThrow(
        new ForbiddenException(
          'Workspace owner cannot be removed',
        ),
      );

      expect(
        prismaService.workspace.findUnique,
      ).not.toHaveBeenCalled();

      expect(
        prismaService.$transaction,
      ).not.toHaveBeenCalled();
    });

    it('should propagate authorization errors', async () => {
      authorizationService.canManageWorkspaceMembers.mockImplementation(
        () => {
          throw new Error('Forbidden');
        },
      );

      await expect(
        service.remove(
          'workspace-1',
          'member-1',
          currentUser as any,
        ),
      ).rejects.toThrow('Forbidden');

      expect(
        prismaService.workspaceMember.findFirst,
      ).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when workspace does not exist', async () => {
      prismaService.workspace.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.remove(
          'workspace-1',
          'member-1',
          currentUser as any,
        ),
      ).rejects.toThrow(
        new NotFoundException('Workspace not found'),
      );

      expect(
        prismaService.$transaction,
      ).not.toHaveBeenCalled();
    });
  });

  describe('leave', () => {
    beforeEach(() => {
      prismaService.workspaceMember.findUnique.mockResolvedValue(
        membership,
      );

      authorizationService.canLeaveWorkspace.mockImplementation(
        () => undefined,
      );

      prismaService.workspace.findUnique.mockResolvedValue(
        workspace,
      );
    });

    it('should allow the current user to leave the workspace', async () => {
      const tx = setupTransaction({
        workspaceMember: {
          findMany: jest
            .fn<() => Promise<Array<{ userId: string }>>>()
            .mockResolvedValue([
              { userId: 'user-2' },
              { userId: 'user-3' },
            ]),
        },
      });

      await service.leave(
        'workspace-1',
        currentUser as any,
      );

      expect(
        authorizationService.canLeaveWorkspace,
      ).toHaveBeenCalledWith(
        currentUser,
        membership.role,
      );

      expect(
        tx.workspaceMember.findMany,
      ).toHaveBeenCalledWith({
        where: {
          workspaceId: 'workspace-1',
          userId: {
            not: currentUser.id,
          },
        },
        select: {
          userId: true,
        },
      });

      expect(
        tx.workspaceMember.delete,
      ).toHaveBeenCalledWith({
        where: {
          id: membership.id,
        },
      });
    });

    it('should notify remaining workspace members', async () => {
      const tx = setupTransaction({
        workspaceMember: {
          findMany: jest.fn<() => Promise<Array<{ userId: string }>>>().mockResolvedValue([
            { userId: 'user-2' },
            { userId: 'user-3' },
          ]),
        },
      });

      await service.leave(
        'workspace-1',
        currentUser as any,
      );

      expect(
        notificationService.notifyUsersTx,
      ).toHaveBeenCalledWith(
        tx,
        ['user-2', 'user-3'],
        NotificationType.WORKSPACE_MEMBER_LEFT,
        'Workspace member left',
        'john@example.com left workspace "Flow Forge"',
      );
    });

    it('should not notify the current user', async () => {
      const tx = setupTransaction({
        workspaceMember: {
          findMany: jest
            .fn<() => Promise<Array<{ userId: string }>>>()
            .mockResolvedValue([
              { userId: 'user-2' },
            ]),
        },
      });

      await service.leave(
        'workspace-1',
        currentUser as any,
      );

      expect(
        notificationService.notifyUsersTx,
      ).toHaveBeenCalledWith(
        tx,
        ['user-2'],
        NotificationType.WORKSPACE_MEMBER_LEFT,
        'Workspace member left',
        'john@example.com left workspace "Flow Forge"',
      );
    });

    it('should allow leaving when there are no remaining members', async () => {
      const tx = setupTransaction({
        workspaceMember: {
          findMany: jest
            .fn<() => Promise<any[]>>()
            .mockResolvedValue([]),
        },
      });

      await service.leave(
        'workspace-1',
        currentUser as any,
      );

      expect(
        notificationService.notifyUsersTx,
      ).toHaveBeenCalledWith(
        tx,
        [],
        NotificationType.WORKSPACE_MEMBER_LEFT,
        'Workspace member left',
        'john@example.com left workspace "Flow Forge"',
      );

      expect(
        tx.workspaceMember.delete,
      ).toHaveBeenCalledWith({
        where: {
          id: membership.id,
        },
      });
    });

    it('should throw ForbiddenException when current user is not a workspace member', async () => {
      prismaService.workspaceMember.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.leave(
          'workspace-1',
          currentUser as any,
        ),
      ).rejects.toThrow(
        new ForbiddenException(
          'You are not a member of this workspace',
        ),
      );

      expect(
        authorizationService.canLeaveWorkspace,
      ).not.toHaveBeenCalled();

      expect(
        prismaService.$transaction,
      ).not.toHaveBeenCalled();
    });

    it('should propagate authorization errors', async () => {
      authorizationService.canLeaveWorkspace.mockImplementation(
        () => {
          throw new Error('Forbidden');
        },
      );

      await expect(
        service.leave(
          'workspace-1',
          currentUser as any,
        ),
      ).rejects.toThrow('Forbidden');

      expect(
        prismaService.workspace.findUnique,
      ).not.toHaveBeenCalled();

      expect(
        prismaService.$transaction,
      ).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when workspace does not exist', async () => {
      prismaService.workspace.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.leave(
          'workspace-1',
          currentUser as any,
        ),
      ).rejects.toThrow(
        new NotFoundException('Workspace not found'),
      );

      expect(
        prismaService.$transaction,
      ).not.toHaveBeenCalled();
    });
  });
});