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
import {
  NotificationType,
  WorkspaceRole,
} from '@prisma/client';

import { NotificationService } from 'src/api/notification/services/notification.service';
import { AuthorizationService } from 'src/common/services';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { WorkspaceService } from './workspace.service';

describe('WorkspaceService', () => {
  let service: WorkspaceService;

  type TxMock = {
    workspace: {
      update: jest.Mock<() => Promise<any>>;
      delete: jest.Mock<() => Promise<any>>;
    };
  };

  const tx: TxMock = {
    workspace: {
      update: jest.fn<() => Promise<any>>(),
      delete: jest.fn<() => Promise<any>>(),
    },
  };

  const prismaService = {
    organization: {
      findUnique: jest.fn<() => Promise<any>>(),
    },
    workspace: {
      findUnique: jest.fn<() => Promise<any>>(),
      findMany: jest.fn<() => Promise<any[]>>(),
      create: jest.fn<() => Promise<any>>(),
    },
    $transaction: jest.fn(async (callback: (tx: TxMock) => Promise<any>) => {
      return callback(tx);
    }),
  };

  const authorizationService = {
    canUpdateOrganization: jest.fn(),
    canViewWorkspace: jest.fn(),
    canUpdateWorkspace: jest.fn(),
    canDeleteWorkspace: jest.fn(),
  };

  const notificationService = {
    notifyUsersTx: jest.fn<() => Promise<any>>(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: AuthorizationService,
          useValue: authorizationService,
        },
        {
          provide: NotificationService,
          useValue: notificationService,
        },
      ],
    }).compile();

    service = module.get<WorkspaceService>(WorkspaceService);

    jest.resetAllMocks();

    prismaService.$transaction.mockImplementation(
      async (callback: (tx: TxMock) => Promise<any>) => {
        return callback(tx);
      },
    );
  });

  describe('create', () => {
    const currentUser = {
      id: 'user-1',
      email: 'john@example.com',
      role: 'USER',
    } as any;

    const organization = {
      id: 'org-1',
      name: 'Flow Forge',
      slug: 'flow-forge',
      ownerId: 'user-1',
    };

    it('should create a workspace', async () => {
      const dto = {
        organizationId: 'org-1',
        name: 'Development',
        slug: 'development',
        description: 'Development workspace',
      };

      const workspace = {
        id: 'workspace-1',
        organizationId: 'org-1',
        ownerId: 'user-1',
        name: 'Development',
        slug: 'development',
        description: 'Development workspace',
        members: [
          {
            userId: 'user-1',
            role: WorkspaceRole.OWNER,
          },
        ],
      };

      prismaService.organization.findUnique.mockResolvedValue(
        organization,
      );

      prismaService.workspace.findUnique.mockResolvedValue(null);

      prismaService.workspace.create.mockResolvedValue(
        workspace,
      );

      const result = await service.create(
        dto as any,
        currentUser,
      );

      expect(result).toEqual(workspace);

      expect(
        prismaService.organization.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          id: 'org-1',
        },
      });

      expect(
        authorizationService.canUpdateOrganization,
      ).toHaveBeenCalledWith(
        currentUser,
        organization,
      );

      expect(
        prismaService.workspace.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          organizationId_slug: {
            organizationId: 'org-1',
            slug: 'development',
          },
        },
      });

      expect(
        prismaService.workspace.create,
      ).toHaveBeenCalledWith({
        data: {
          organizationId: 'org-1',
          ownerId: 'user-1',
          name: 'Development',
          slug: 'development',
          description: 'Development workspace',
          members: {
            create: {
              userId: 'user-1',
              role: WorkspaceRole.OWNER,
            },
          },
        },
        include: {
          members: true,
        },
      });
    });

    it('should throw NotFoundException when organization does not exist', async () => {
      prismaService.organization.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          {
            organizationId: 'org-1',
            name: 'Development',
            slug: 'development',
          } as any,
          currentUser,
        ),
      ).rejects.toThrow(
        new NotFoundException('Organization not found'),
      );

      expect(
        authorizationService.canUpdateOrganization,
      ).not.toHaveBeenCalled();

      expect(
        prismaService.workspace.create,
      ).not.toHaveBeenCalled();
    });

    it('should propagate organization authorization errors', async () => {
      prismaService.organization.findUnique.mockResolvedValue(
        organization,
      );

      authorizationService.canUpdateOrganization.mockImplementation(
        () => {
          throw new Error('Forbidden');
        },
      );

      await expect(
        service.create(
          {
            organizationId: 'org-1',
            name: 'Development',
            slug: 'development',
          } as any,
          currentUser,
        ),
      ).rejects.toThrow('Forbidden');

      expect(
        prismaService.workspace.findUnique,
      ).not.toHaveBeenCalled();

      expect(
        prismaService.workspace.create,
      ).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when workspace slug already exists', async () => {
      const existingWorkspace = {
        id: 'workspace-1',
        organizationId: 'org-1',
        slug: 'development',
      };

      prismaService.organization.findUnique.mockResolvedValue(
        organization,
      );

      prismaService.workspace.findUnique.mockResolvedValue(
        existingWorkspace,
      );

      await expect(
        service.create(
          {
            organizationId: 'org-1',
            name: 'Development',
            slug: 'development',
          } as any,
          currentUser,
        ),
      ).rejects.toThrow(
        new ConflictException(
          'Workspace with this slug already exists in this organization',
        ),
      );

      expect(
        prismaService.workspace.create,
      ).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return workspaces owned by the current user', async () => {
      const currentUser = {
        id: 'user-1',
        email: 'john@example.com',
        role: 'USER',
      } as any;

      const workspaces = [
        {
          id: 'workspace-1',
          name: 'Development',
          slug: 'development',
          ownerId: 'user-1',
        },
        {
          id: 'workspace-2',
          name: 'Marketing',
          slug: 'marketing',
          ownerId: 'user-1',
        },
      ];

      prismaService.workspace.findMany.mockResolvedValue(
        workspaces,
      );

      const result = await service.findAll(currentUser);

      expect(result).toEqual(workspaces);

      expect(
        prismaService.workspace.findMany,
      ).toHaveBeenCalledWith({
        where: {
          ownerId: 'user-1',
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

    const workspace = {
      id: 'workspace-1',
      organizationId: 'org-1',
      ownerId: 'user-1',
      name: 'Development',
      slug: 'development',
    };

    it('should return a workspace', async () => {
      prismaService.workspace.findUnique.mockResolvedValue(
        workspace,
      );

      const result = await service.findOne(
        'workspace-1',
        currentUser,
      );

      expect(result).toEqual(workspace);

      expect(
        prismaService.workspace.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          id: 'workspace-1',
        },
      });

      expect(
        authorizationService.canViewWorkspace,
      ).toHaveBeenCalledWith(
        currentUser,
        workspace,
      );
    });

    it('should throw NotFoundException when workspace does not exist', async () => {
      prismaService.workspace.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne(
          'workspace-1',
          currentUser,
        ),
      ).rejects.toThrow(
        new NotFoundException('Workspace not found'),
      );

      expect(
        authorizationService.canViewWorkspace,
      ).not.toHaveBeenCalled();
    });

    it('should propagate authorization errors', async () => {
      prismaService.workspace.findUnique.mockResolvedValue(
        workspace,
      );

      authorizationService.canViewWorkspace.mockImplementation(
        () => {
          throw new Error('Forbidden');
        },
      );

      await expect(
        service.findOne(
          'workspace-1',
          currentUser,
        ),
      ).rejects.toThrow('Forbidden');
    });
  });

  describe('update', () => {
    const currentUser = {
      id: 'user-1',
      email: 'john@example.com',
      role: 'USER',
    } as any;

    const workspace = {
      id: 'workspace-1',
      organizationId: 'org-1',
      ownerId: 'user-1',
      name: 'Development',
      slug: 'development',
      description: 'Old description',
      members: [
        {
          userId: 'user-1',
        },
        {
          userId: 'user-2',
        },
        {
          userId: 'user-3',
        },
      ],
    };

    it('should update a workspace and notify other members', async () => {
      const dto = {
        name: 'Updated Development',
        description: 'Updated description',
      };

      const updatedWorkspace = {
        id: 'workspace-1',
        organizationId: 'org-1',
        ownerId: 'user-1',
        name: 'Updated Development',
        slug: 'development',
        description: 'Updated description',
      };

      prismaService.workspace.findUnique.mockResolvedValue(
        workspace,
      );

      tx.workspace.update.mockResolvedValue(
        updatedWorkspace,
      );

      const result = await service.update(
        'workspace-1',
        dto as any,
        currentUser,
      );

      expect(result).toEqual(updatedWorkspace);

      expect(
        authorizationService.canUpdateWorkspace,
      ).toHaveBeenCalledWith(
        currentUser,
        workspace,
      );

      expect(
        prismaService.$transaction,
      ).toHaveBeenCalled();

      expect(
        tx.workspace.update,
      ).toHaveBeenCalledWith({
        where: {
          id: 'workspace-1',
        },
        data: {
          name: 'Updated Development',
          description: 'Updated description',
        },
      });

      expect(
        notificationService.notifyUsersTx,
      ).toHaveBeenCalledWith(
        tx,
        ['user-2', 'user-3'],
        NotificationType.WORKSPACE_UPDATED,
        'Workspace updated',
        'Workspace "Updated Development" was updated',
      );
    });

    it('should throw NotFoundException when workspace does not exist', async () => {
      prismaService.workspace.findUnique.mockResolvedValue(null);

      await expect(
        service.update(
          'workspace-1',
          {
            name: 'Updated',
          } as any,
          currentUser,
        ),
      ).rejects.toThrow(
        new NotFoundException('Workspace not found'),
      );

      expect(
        authorizationService.canUpdateWorkspace,
      ).not.toHaveBeenCalled();

      expect(
        prismaService.$transaction,
      ).not.toHaveBeenCalled();
    });

    it('should propagate authorization errors', async () => {
      prismaService.workspace.findUnique.mockResolvedValue(
        workspace,
      );

      authorizationService.canUpdateWorkspace.mockImplementation(
        () => {
          throw new Error('Forbidden');
        },
      );

      await expect(
        service.update(
          'workspace-1',
          {
            name: 'Updated',
          } as any,
          currentUser,
        ),
      ).rejects.toThrow('Forbidden');

      expect(
        prismaService.$transaction,
      ).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when new slug is already taken', async () => {
      const slugTakenWorkspace = {
        id: 'workspace-2',
        organizationId: 'org-1',
        slug: 'new-slug',
      };

      prismaService.workspace.findUnique
        .mockResolvedValueOnce(workspace)
        .mockResolvedValueOnce(slugTakenWorkspace);

      await expect(
        service.update(
          'workspace-1',
          {
            slug: 'new-slug',
          } as any,
          currentUser,
        ),
      ).rejects.toThrow(
        new ConflictException(
          'Workspace with this slug already exists in this organization',
        ),
      );

      expect(
        authorizationService.canUpdateWorkspace,
      ).toHaveBeenCalledWith(
        currentUser,
        workspace,
      );

      expect(
        prismaService.$transaction,
      ).not.toHaveBeenCalled();
    });

    it('should update slug when the new slug is available', async () => {
      const updatedWorkspace = {
        ...workspace,
        slug: 'new-slug',
      };

      prismaService.workspace.findUnique
        .mockResolvedValueOnce(workspace)
        .mockResolvedValueOnce(null);

      tx.workspace.update.mockResolvedValue(
        updatedWorkspace,
      );

      const result = await service.update(
        'workspace-1',
        {
          slug: 'new-slug',
        } as any,
        currentUser,
      );

      expect(result).toEqual(updatedWorkspace);

      expect(
        tx.workspace.update,
      ).toHaveBeenCalledWith({
        where: {
          id: 'workspace-1',
        },
        data: {
          slug: 'new-slug',
        },
      });

      expect(
        notificationService.notifyUsersTx,
      ).toHaveBeenCalledWith(
        tx,
        ['user-2', 'user-3'],
        NotificationType.WORKSPACE_UPDATED,
        'Workspace updated',
        'Workspace "Development" was updated',
      );
    });
  });

  describe('remove', () => {
    const currentUser = {
      id: 'user-1',
      email: 'john@example.com',
      role: 'USER',
    } as any;

    const workspace = {
      id: 'workspace-1',
      organizationId: 'org-1',
      ownerId: 'user-1',
      name: 'Development',
      slug: 'development',
      members: [
        {
          userId: 'user-1',
        },
        {
          userId: 'user-2',
        },
        {
          userId: 'user-3',
        },
      ],
    };

    it('should delete a workspace and notify other members', async () => {
      prismaService.workspace.findUnique.mockResolvedValue(
        workspace,
      );

      tx.workspace.delete.mockResolvedValue(
        workspace,
      );

      const result = await service.remove(
        'workspace-1',
        currentUser,
      );

      expect(result).toBeUndefined();

      expect(
        authorizationService.canDeleteWorkspace,
      ).toHaveBeenCalledWith(
        currentUser,
        workspace,
      );

      expect(
        prismaService.$transaction,
      ).toHaveBeenCalled();

      expect(
        tx.workspace.delete,
      ).toHaveBeenCalledWith({
          where: {
            id: 'workspace-1',
          },
        });

      expect(
        notificationService.notifyUsersTx,
      ).toHaveBeenCalledWith(
        tx,
        ['user-2', 'user-3'],
        NotificationType.WORKSPACE_DELETED,
        'Workspace deleted',
        'Workspace "Development" was deleted',
      );
    });

    it('should throw NotFoundException when workspace does not exist', async () => {
      prismaService.workspace.findUnique.mockResolvedValue(null);

      await expect(
        service.remove(
          'workspace-1',
          currentUser,
        ),
      ).rejects.toThrow(
        new NotFoundException('Workspace not found'),
      );

      expect(
        authorizationService.canDeleteWorkspace,
      ).not.toHaveBeenCalled();

      expect(
        prismaService.$transaction,
      ).not.toHaveBeenCalled();
    });

    it('should propagate authorization errors', async () => {
      prismaService.workspace.findUnique.mockResolvedValue(
        workspace,
      );

      authorizationService.canDeleteWorkspace.mockImplementation(
        () => {
          throw new Error('Forbidden');
        },
      );

      await expect(
        service.remove(
          'workspace-1',
          currentUser,
        ),
      ).rejects.toThrow('Forbidden');

      expect(
        prismaService.$transaction,
      ).not.toHaveBeenCalled();

      expect(
        tx.workspace.delete,
      ).not.toHaveBeenCalled();
    });
  });
});