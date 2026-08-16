import {
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from '../services/workspace.service';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
} from '../dto';
import { AuthenticatedUser } from 'src/common/interfaces';

describe('WorkspaceController', () => {
  let controller: WorkspaceController;

  const workspaceService = {
    create: jest.fn<() => Promise<any>>(),
    findAll: jest.fn<() => Promise<any[]>>(),
    findOne: jest.fn<() => Promise<any>>(),
    update: jest.fn<() => Promise<any>>(),
    remove: jest.fn<() => Promise<any>>(),
  };

  const currentUser: AuthenticatedUser = {
    id: 'user-1',
    email: 'john@example.com',
    role: 'USER',
    status: 'ACTIVE',
  };

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [WorkspaceController],
        providers: [
          {
            provide: WorkspaceService,
            useValue: workspaceService,
          },
        ],
      }).compile();

    controller =
      module.get<WorkspaceController>(WorkspaceController);

    jest.resetAllMocks();
  });

  describe('create', () => {
    it('should create a workspace', async () => {
      const dto: CreateWorkspaceDto = {
        organizationId: 'org-1',
        name: 'Development',
        slug: 'development',
        description: 'Development workspace',
      };

      const createdWorkspace = {
        id: 'workspace-1',
        ...dto,
        ownerId: currentUser.id,
      };

      workspaceService.create.mockResolvedValue(
        createdWorkspace,
      );

      const result = await controller.create(
        dto,
        currentUser,
      );

      expect(result).toEqual(createdWorkspace);

      expect(workspaceService.create).toHaveBeenCalledWith(
        dto,
        currentUser,
      );
    });
  });

  describe('findAll', () => {
    it('should return workspaces for the current user', async () => {
      const workspaces = [
        {
          id: 'workspace-1',
          name: 'Development',
          slug: 'development',
          ownerId: currentUser.id,
        },
        {
          id: 'workspace-2',
          name: 'Marketing',
          slug: 'marketing',
          ownerId: currentUser.id,
        },
      ];

      workspaceService.findAll.mockResolvedValue(
        workspaces,
      );

      const result = await controller.findAll(
        currentUser,
      );

      expect(result).toEqual(workspaces);

      expect(workspaceService.findAll).toHaveBeenCalledWith(
        currentUser,
      );
    });
  });

  describe('findOne', () => {
    it('should return a workspace', async () => {
      const workspace = {
        id: 'workspace-1',
        organizationId: 'org-1',
        name: 'Development',
        slug: 'development',
        ownerId: currentUser.id,
      };

      workspaceService.findOne.mockResolvedValue(
        workspace,
      );

      const result = await controller.findOne(
        'workspace-1',
        currentUser,
      );

      expect(result).toEqual(workspace);

      expect(workspaceService.findOne).toHaveBeenCalledWith(
        'workspace-1',
        currentUser,
      );
    });
  });

  describe('update', () => {
    it('should update a workspace', async () => {
      const dto: UpdateWorkspaceDto = {
        name: 'Updated Development',
        description: 'Updated description',
      };

      const updatedWorkspace = {
        id: 'workspace-1',
        organizationId: 'org-1',
        name: 'Updated Development',
        slug: 'development',
        description: 'Updated description',
        ownerId: currentUser.id,
      };

      workspaceService.update.mockResolvedValue(
        updatedWorkspace,
      );

      const result = await controller.update(
        'workspace-1',
        dto,
        currentUser,
      );

      expect(result).toEqual(updatedWorkspace);

      expect(workspaceService.update).toHaveBeenCalledWith(
        'workspace-1',
        dto,
        currentUser,
      );
    });
  });

  describe('remove', () => {
    it('should remove a workspace', async () => {
      workspaceService.remove.mockResolvedValue(
        undefined,
      );

      const result = await controller.remove(
        'workspace-1',
        currentUser,
      );

      expect(result).toBeUndefined();

      expect(workspaceService.remove).toHaveBeenCalledWith(
        'workspace-1',
        currentUser,
      );
    });
  });
});