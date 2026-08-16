import {
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticatedUser } from 'src/common/interfaces';
import {
  CreateProjectDto,
  UpdateProjectDto,
} from '../dto';
import { ProjectService } from '../services/project.service';
import { ProjectController } from './project.controller';

describe('ProjectController', () => {
  let controller: ProjectController;

  const projectService = {
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

  const project = {
    id: 'project-1',
    workspaceId: 'workspace-1',
    ownerId: 'user-1',
    name: 'Flow Forge',
    key: 'FLOW',
    description: 'Project description',
    avatarUrl: null,
  };

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [ProjectController],
        providers: [
          {
            provide: ProjectService,
            useValue: projectService,
          },
        ],
      }).compile();

    controller =
      module.get<ProjectController>(ProjectController);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a project', async () => {
      const dto: CreateProjectDto = {
        workspaceId: 'workspace-1',
        name: 'Flow Forge',
        key: 'FLOW',
        description: 'Project description',
        avatarUrl: 'https://example.com/avatar.png',
      };

      projectService.create.mockResolvedValue(project);

      const result = await controller.create(
        dto,
        currentUser,
      );

      expect(result).toEqual(project);

      expect(projectService.create).toHaveBeenCalledWith(
        dto,
        currentUser,
      );
    });
  });

  describe('findAll', () => {
    it('should return all accessible projects', async () => {
      const projects = [
        project,
        {
          ...project,
          id: 'project-2',
          name: 'Another Project',
          key: 'ANOTHER',
        },
      ];

      projectService.findAll.mockResolvedValue(projects);

      const result = await controller.findAll(
        currentUser,
      );

      expect(result).toEqual(projects);

      expect(projectService.findAll).toHaveBeenCalledWith(
        currentUser,
      );
    });
  });

  describe('findOne', () => {
    it('should return a project', async () => {
      projectService.findOne.mockResolvedValue(project);

      const result = await controller.findOne(
        'project-1',
        currentUser,
      );

      expect(result).toEqual(project);

      expect(projectService.findOne).toHaveBeenCalledWith(
        'project-1',
        currentUser,
      );
    });
  });

  describe('update', () => {
    it('should update a project', async () => {
      const dto: UpdateProjectDto = {
        name: 'Updated Flow Forge',
        description: 'Updated description',
      };

      const updatedProject = {
        ...project,
        name: 'Updated Flow Forge',
        description: 'Updated description',
      };

      projectService.update.mockResolvedValue(
        updatedProject,
      );

      const result = await controller.update(
        'project-1',
        dto,
        currentUser,
      );

      expect(result).toEqual(updatedProject);

      expect(projectService.update).toHaveBeenCalledWith(
        'project-1',
        dto,
        currentUser,
      );
    });
  });

  describe('remove', () => {
    it('should remove a project', async () => {
      projectService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(
        'project-1',
        currentUser,
      );

      expect(result).toBeUndefined();

      expect(projectService.remove).toHaveBeenCalledWith(
        'project-1',
        currentUser,
      );
    });
  });
});