import {
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';

import { ProjectMemberService } from '../services/project-member.service';
import { ProjectMemberController } from './project-member.controller';

import { AuthenticatedUser } from 'src/common/interfaces';

import {
  CreateProjectMemberDto,
  UpdateProjectMemberDto,
} from '../dto';

import { ProjectRole } from '@prisma/client';

describe('ProjectMemberController', () => {
  let controller: ProjectMemberController;

  const projectMemberService = {
    findAll: jest.fn<() => Promise<any[]>>(),
    findOne: jest.fn<() => Promise<any>>(),
    create: jest.fn<() => Promise<any>>(),
    update: jest.fn<() => Promise<any>>(),
    remove: jest.fn<() => Promise<any>>(),
    leave: jest.fn<() => Promise<any>>(),
  };

  const currentUser: AuthenticatedUser = {
    id: 'user-1',
    email: 'john@example.com',
    role: 'USER',
    status: 'ACTIVE',
  };

  const projectMemberResponse = {
    id: 'member-1',
    projectId: 'project-1',
    userId: 'user-2',
    role: ProjectRole.MEMBER,
    joinedAt: new Date(),
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

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectMemberController],
      providers: [
        {
          provide: ProjectMemberService,
          useValue: projectMemberService,
        },
      ],
    }).compile();

    controller = module.get<ProjectMemberController>(
      ProjectMemberController,
    );
  });

  describe('findAll', () => {
    it('should return all project members', async () => {
      const result = [projectMemberResponse];

      projectMemberService.findAll.mockResolvedValue(result);

      const response = await controller.findAll(
        'project-1',
        currentUser,
      );

      expect(response).toEqual(result);

      expect(
        projectMemberService.findAll,
      ).toHaveBeenCalledWith(
        'project-1',
        currentUser,
      );
    });
  });

  describe('findOne', () => {
    it('should return a project member', async () => {
      projectMemberService.findOne.mockResolvedValue(
        projectMemberResponse,
      );

      const response = await controller.findOne(
        'project-1',
        'member-1',
        currentUser,
      );

      expect(response).toEqual(projectMemberResponse);

      expect(
        projectMemberService.findOne,
      ).toHaveBeenCalledWith(
        'project-1',
        'member-1',
        currentUser,
      );
    });
  });

  describe('create', () => {
    const dto: CreateProjectMemberDto = {
      userId: 'user-2',
    };

    it('should create a project member', async () => {
      projectMemberService.create.mockResolvedValue(
        projectMemberResponse,
      );

      const response = await controller.create(
        'project-1',
        dto,
        currentUser,
      );

      expect(response).toEqual(projectMemberResponse);

      expect(
        projectMemberService.create,
      ).toHaveBeenCalledWith(
        'project-1',
        dto,
        currentUser,
      );
    });
  });

  describe('update', () => {
    const dto: UpdateProjectMemberDto = {
      role: ProjectRole.ADMIN,
    };

    const updatedMember = {
      ...projectMemberResponse,
      role: ProjectRole.ADMIN,
    };

    it('should update a project member', async () => {
      projectMemberService.update.mockResolvedValue(
        updatedMember,
      );

      const response = await controller.update(
        'project-1',
        'member-1',
        dto,
        currentUser,
      );

      expect(response).toEqual(updatedMember);

      expect(
        projectMemberService.update,
      ).toHaveBeenCalledWith(
        'project-1',
        'member-1',
        dto,
        currentUser,
      );
    });
  });

  describe('remove', () => {
    it('should remove a project member', async () => {
      projectMemberService.remove.mockResolvedValue(
        undefined,
      );

      const response = await controller.remove(
        'project-1',
        'member-1',
        currentUser,
      );

      expect(response).toBeUndefined();

      expect(
        projectMemberService.remove,
      ).toHaveBeenCalledWith(
        'project-1',
        'member-1',
        currentUser,
      );
    });
  });

  describe('leave', () => {
    it('should allow the current user to leave the project', async () => {
      projectMemberService.leave.mockResolvedValue(
        undefined,
      );

      const response = await controller.leave(
        'project-1',
        currentUser,
      );

      expect(response).toBeUndefined();

      expect(
        projectMemberService.leave,
      ).toHaveBeenCalledWith(
        'project-1',
        currentUser,
      );
    });
  });
});