import {
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  NotificationType,
  ProjectRole,
  UserRole,
} from '@prisma/client';

import { AuthenticatedUser } from 'src/common/interfaces';
import { AuthorizationService } from 'src/common/services';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { NotificationService } from '../../notification/services/notification.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
} from '../dto';
import { ProjectService } from './project.service';

describe('ProjectService', () => {
  let service: ProjectService;

  type TxMock = {
    project: {
      update: jest.Mock<() => Promise<any>>;
      delete: jest.Mock<() => Promise<any>>;
    };
  };

  const tx: TxMock = {
    project: {
      update: jest.fn<() => Promise<any>>(),
      delete: jest.fn<() => Promise<any>>(),
    },
  };

  const prismaService = {
    workspace: {
      findUnique: jest.fn<() => Promise<any>>(),
    },

    workspaceMember: {
      findUnique: jest.fn<() => Promise<any>>(),
    },

    project: {
      findUnique: jest.fn<() => Promise<any>>(),
      findMany: jest.fn<() => Promise<any[]>>(),
      create: jest.fn<() => Promise<any>>(),
    },

    $transaction: jest.fn(
      async (callback: (tx: TxMock) => Promise<any>) => {
        return callback(tx);
      },
    ),
  };

  const authorizationService = {
    canCreateProject: jest.fn(),
    canViewProject: jest.fn(),
    canUpdateProject: jest.fn(),
    canDeleteProject: jest.fn(),
  };

  const notificationService = {
    notifyUsersTx: jest.fn<() => Promise<any>>(),
  };

  const currentUser: AuthenticatedUser = {
    id: 'user-1',
    email: 'john@example.com',
    role: UserRole.USER,
    status: 'ACTIVE',
  };

  const adminUser: AuthenticatedUser = {
    id: 'admin-1',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    status: 'ACTIVE',
  };

  const workspace = {
    id: 'workspace-1',
    organizationId: 'organization-1',
    ownerId: 'user-1',
    name: 'Development',
    slug: 'development',
  };

  const membership = {
    id: 'membership-1',
    userId: currentUser.id,
    workspaceId: workspace.id,
    role: 'MEMBER',
  };

  const project = {
    id: 'project-1',
    workspaceId: workspace.id,
    ownerId: currentUser.id,
    name: 'Flow Forge',
    key: 'FLOW',
    description: 'Flow Forge project',
    avatarUrl: null,
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

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          ProjectService,
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

    service = module.get<ProjectService>(ProjectService);

    jest.resetAllMocks();

    prismaService.$transaction.mockImplementation(
      async (callback: (tx: TxMock) => Promise<any>) => {
        return callback(tx);
      },
    );
  });

  describe('create', () => {
    const dto: CreateProjectDto = {
      workspaceId: 'workspace-1',
      name: 'Flow Forge',
      key: 'FLOW',
      description: 'Flow Forge project',
      avatarUrl: 'https://example.com/avatar.png',
    };

    it('should create a project', async () => {
      const createdProject = {
        id: 'project-1',
        workspaceId: workspace.id,
        ownerId: currentUser.id,
        name: dto.name,
        key: dto.key,
        description: dto.description,
        avatarUrl: dto.avatarUrl,
      };

      prismaService.workspace.findUnique.mockResolvedValue(
        workspace,
      );

      prismaService.workspaceMember.findUnique.mockResolvedValue(
        membership,
      );

      prismaService.project.findUnique.mockResolvedValue(null);

      prismaService.project.create.mockResolvedValue(
        createdProject,
      );

      const result = await service.create(
        dto,
        currentUser,
      );

      expect(result).toEqual(createdProject);

      expect(
        prismaService.workspace.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          id: dto.workspaceId,
        },
      });

      expect(
        prismaService.workspaceMember.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          userId_workspaceId: {
            userId: currentUser.id,
            workspaceId: workspace.id,
          },
        },
      });

      expect(
        authorizationService.canCreateProject,
      ).toHaveBeenCalledWith(
        currentUser,
        workspace,
        membership,
      );

      expect(
        prismaService.project.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          workspaceId_key: {
            workspaceId: dto.workspaceId,
            key: dto.key,
          },
        },
      });

      expect(
        prismaService.project.create,
      ).toHaveBeenCalledWith({
        data: {
          workspaceId: dto.workspaceId,
          ownerId: currentUser.id,
          name: dto.name,
          key: dto.key,
          description: dto.description,
          avatarUrl: dto.avatarUrl,
          members: {
            create: {
              userId: currentUser.id,
              role: ProjectRole.ADMIN,
            },
          },
        },
      });
    });

    it('should throw NotFoundException when workspace does not exist', async () => {
      prismaService.workspace.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.create(dto, currentUser),
      ).rejects.toThrow(
        new NotFoundException('Workspace not found'),
      );

      expect(
        prismaService.workspaceMember.findUnique,
      ).not.toHaveBeenCalled();

      expect(
        authorizationService.canCreateProject,
      ).not.toHaveBeenCalled();

      expect(
        prismaService.project.create,
      ).not.toHaveBeenCalled();
    });

    it('should propagate project authorization errors', async () => {
      prismaService.workspace.findUnique.mockResolvedValue(
        workspace,
      );

      prismaService.workspaceMember.findUnique.mockResolvedValue(
        membership,
      );

      authorizationService.canCreateProject.mockImplementation(
        () => {
          throw new Error('Forbidden');
        },
      );

      await expect(
        service.create(dto, currentUser),
      ).rejects.toThrow('Forbidden');

      expect(
        prismaService.project.findUnique,
      ).not.toHaveBeenCalled();

      expect(
        prismaService.project.create,
      ).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when project key already exists', async () => {
      const existingProject = {
        id: 'existing-project',
        key: dto.key,
      };

      prismaService.workspace.findUnique.mockResolvedValue(
        workspace,
      );

      prismaService.workspaceMember.findUnique.mockResolvedValue(
        membership,
      );

      prismaService.project.findUnique.mockResolvedValue(
        existingProject,
      );

      await expect(
        service.create(dto, currentUser),
      ).rejects.toThrow(
        new ConflictException(
          'Project with this key already exists in this workspace',
        ),
      );

      expect(
        prismaService.project.create,
      ).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all projects for an admin', async () => {
      const projects = [
        project,
        {
          ...project,
          id: 'project-2',
          key: 'TEST',
        },
      ];

      prismaService.project.findMany.mockResolvedValue(
        projects,
      );

      const result = await service.findAll(adminUser);

      expect(result).toEqual(projects);

      expect(
        prismaService.project.findMany,
      ).toHaveBeenCalledWith({
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should return only projects accessible to the current user', async () => {
      const projects = [project];

      prismaService.project.findMany.mockResolvedValue(
        projects,
      );

      const result = await service.findAll(currentUser);

      expect(result).toEqual(projects);

      expect(
        prismaService.project.findMany,
      ).toHaveBeenCalledWith({
        where: {
          workspace: {
            members: {
              some: {
                userId: currentUser.id,
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a project', async () => {
      prismaService.project.findUnique.mockResolvedValue(
        project,
      );

      prismaService.workspaceMember.findUnique.mockResolvedValue(
        membership,
      );

      const result = await service.findOne(
        project.id,
        currentUser,
      );

      expect(result).toEqual(project);

      expect(
        prismaService.project.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          id: project.id,
        },
      });

      expect(
        prismaService.workspaceMember.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          userId_workspaceId: {
            userId: currentUser.id,
            workspaceId: project.workspaceId,
          },
        },
      });

      expect(
        authorizationService.canViewProject,
      ).toHaveBeenCalledWith(
        currentUser,
        project,
        membership,
      );
    });

    it('should throw NotFoundException when project does not exist', async () => {
      prismaService.project.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.findOne('project-1', currentUser),
      ).rejects.toThrow(
        new NotFoundException('Project not found'),
      );

      expect(
        prismaService.workspaceMember.findUnique,
      ).not.toHaveBeenCalled();

      expect(
        authorizationService.canViewProject,
      ).not.toHaveBeenCalled();
    });

    it('should propagate authorization errors', async () => {
      prismaService.project.findUnique.mockResolvedValue(
        project,
      );

      prismaService.workspaceMember.findUnique.mockResolvedValue(
        membership,
      );

      authorizationService.canViewProject.mockImplementation(
        () => {
          throw new Error('Forbidden');
        },
      );

      await expect(
        service.findOne(project.id, currentUser),
      ).rejects.toThrow('Forbidden');
    });
  });

  describe('update', () => {
    const dto: UpdateProjectDto = {
      name: 'Updated Flow Forge',
      description: 'Updated description',
    };

    it('should update a project and notify other members', async () => {
      const updatedProject = {
        ...project,
        name: dto.name,
        description: dto.description,
      };

      prismaService.project.findUnique.mockResolvedValue(
        project,
      );

      prismaService.workspaceMember.findUnique.mockResolvedValue(
        membership,
      );

      tx.project.update.mockResolvedValue(
        updatedProject,
      );

      const result = await service.update(
        project.id,
        dto,
        currentUser,
      );

      expect(result).toEqual(updatedProject);

      expect(
        authorizationService.canUpdateProject,
      ).toHaveBeenCalledWith(
        currentUser,
        project,
        membership,
      );

      expect(
        prismaService.$transaction,
      ).toHaveBeenCalled();

      expect(tx.project.update).toHaveBeenCalledWith({
        where: {
          id: project.id,
        },
        data: {
          name: dto.name,
          description: dto.description,
        },
      });

      expect(
        notificationService.notifyUsersTx,
      ).toHaveBeenCalledWith(
        tx,
        ['user-2', 'user-3'],
        NotificationType.PROJECT_UPDATED,
        'Project updated',
        `Project "${updatedProject.name}" was updated`,
      );
    });

    it('should throw NotFoundException when project does not exist', async () => {
      prismaService.project.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.update(
          project.id,
          dto,
          currentUser,
        ),
      ).rejects.toThrow(
        new NotFoundException('Project not found'),
      );

      expect(
        prismaService.workspaceMember.findUnique,
      ).not.toHaveBeenCalled();

      expect(
        authorizationService.canUpdateProject,
      ).not.toHaveBeenCalled();

      expect(
        prismaService.$transaction,
      ).not.toHaveBeenCalled();
    });

    it('should propagate authorization errors', async () => {
      prismaService.project.findUnique.mockResolvedValue(
        project,
      );

      prismaService.workspaceMember.findUnique.mockResolvedValue(
        membership,
      );

      authorizationService.canUpdateProject.mockImplementation(
        () => {
          throw new Error('Forbidden');
        },
      );

      await expect(
        service.update(
          project.id,
          dto,
          currentUser,
        ),
      ).rejects.toThrow('Forbidden');

      expect(
        prismaService.$transaction,
      ).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when new project key is already taken', async () => {
      const dtoWithNewKey: UpdateProjectDto = {
        key: 'NEWKEY',
      };

      const existingProject = {
        id: 'project-2',
        workspaceId: workspace.id,
        key: 'NEWKEY',
      };

      prismaService.project.findUnique
        .mockResolvedValueOnce(project)
        .mockResolvedValueOnce(existingProject);

      prismaService.workspaceMember.findUnique.mockResolvedValue(
        membership,
      );

      await expect(
        service.update(
          project.id,
          dtoWithNewKey,
          currentUser,
        ),
      ).rejects.toThrow(
        new ConflictException(
          'Project with this key already exists in this workspace',
        ),
      );

      expect(
        prismaService.project.findUnique,
      ).toHaveBeenNthCalledWith(1, {
        where: {
          id: project.id,
        },
        include: {
          members: {
            select: {
              userId: true,
            },
          },
        },
      });

      expect(
        prismaService.project.findUnique,
      ).toHaveBeenNthCalledWith(2, {
        where: {
          workspaceId_key: {
            workspaceId: project.workspaceId,
            key: dtoWithNewKey.key,
          },
        },
      });

      expect(
        prismaService.$transaction,
      ).not.toHaveBeenCalled();
    });

    it('should update project key when the new key is available', async () => {
      const dtoWithNewKey: UpdateProjectDto = {
        key: 'NEWKEY',
      };

      const updatedProject = {
        ...project,
        key: dtoWithNewKey.key,
      };

      prismaService.project.findUnique
        .mockResolvedValueOnce(project)
        .mockResolvedValueOnce(null);

      prismaService.workspaceMember.findUnique.mockResolvedValue(
        membership,
      );

      tx.project.update.mockResolvedValue(
        updatedProject,
      );

      const result = await service.update(
        project.id,
        dtoWithNewKey,
        currentUser,
      );

      expect(result).toEqual(updatedProject);

      expect(tx.project.update).toHaveBeenCalledWith({
        where: {
          id: project.id,
        },
        data: {
          key: dtoWithNewKey.key,
        },
      });

      expect(
        notificationService.notifyUsersTx,
      ).toHaveBeenCalledWith(
        tx,
        ['user-2', 'user-3'],
        NotificationType.PROJECT_UPDATED,
        'Project updated',
        `Project "${updatedProject.name}" was updated`,
      );
    });
  });

  describe('remove', () => {
    it('should delete a project and notify other members', async () => {
      prismaService.project.findUnique.mockResolvedValue(
        project,
      );

      prismaService.workspaceMember.findUnique.mockResolvedValue(
        membership,
      );

      tx.project.delete.mockResolvedValue(project);

      const result = await service.remove(
        project.id,
        currentUser,
      );

      expect(result).toBeUndefined();

      expect(
        authorizationService.canDeleteProject,
      ).toHaveBeenCalledWith(
        currentUser,
        project,
        membership,
      );

      expect(
        prismaService.$transaction,
      ).toHaveBeenCalled();

      expect(tx.project.delete).toHaveBeenCalledWith({
        where: {
          id: project.id,
        },
      });

      expect(
        notificationService.notifyUsersTx,
      ).toHaveBeenCalledWith(
        tx,
        ['user-2', 'user-3'],
        NotificationType.PROJECT_DELETED,
        'Project deleted',
        `Project "${project.name}" was deleted`,
      );
    });

    it('should throw NotFoundException when project does not exist', async () => {
      prismaService.project.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.remove(project.id, currentUser),
      ).rejects.toThrow(
        new NotFoundException('Project not found'),
      );

      expect(
        prismaService.workspaceMember.findUnique,
      ).not.toHaveBeenCalled();

      expect(
        authorizationService.canDeleteProject,
      ).not.toHaveBeenCalled();

      expect(
        prismaService.$transaction,
      ).not.toHaveBeenCalled();
    });

    it('should propagate authorization errors', async () => {
      prismaService.project.findUnique.mockResolvedValue(
        project,
      );

      prismaService.workspaceMember.findUnique.mockResolvedValue(
        membership,
      );

      authorizationService.canDeleteProject.mockImplementation(
        () => {
          throw new Error('Forbidden');
        },
      );

      await expect(
        service.remove(project.id, currentUser),
      ).rejects.toThrow('Forbidden');

      expect(
        prismaService.$transaction,
      ).not.toHaveBeenCalled();
    });
  });
});