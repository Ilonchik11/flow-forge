import {
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';

import { IssueService } from '../services/issue.service';
import { IssueController } from './issue.controller';

import {
  CreateIssueDto,
  UpdateIssueDto,
} from '../dto';

import { AuthenticatedUser } from 'src/common/interfaces';

describe('IssueController', () => {
  let controller: IssueController;

  const issueService = {
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
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IssueController],
      providers: [
        {
          provide: IssueService,
          useValue: issueService,
        },
      ],
    }).compile();

    controller = module.get<IssueController>(IssueController);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an issue', async () => {
      const dto: CreateIssueDto = {
        projectId: 'project-1',
        title: 'Fix login bug',
        description: 'Login fails with invalid token',
        type: 'BUG',
        priority: 'HIGH',
      };

      const createdIssue = {
        id: 'issue-1',
        projectId: 'project-1',
        key: 1,
        title: 'Fix login bug',
      };

      issueService.create.mockResolvedValue(createdIssue);

      const result = await controller.create(
        dto,
        currentUser,
      );

      expect(result).toEqual(createdIssue);

      expect(issueService.create).toHaveBeenCalledWith(
        dto,
        currentUser,
      );
    });
  });

  describe('findAll', () => {
    it('should return all issues for a project', async () => {
      const projectId = 'project-1';

      const issues = [
        {
          id: 'issue-1',
          projectId,
          key: 1,
          title: 'Fix login bug',
        },
        {
          id: 'issue-2',
          projectId,
          key: 2,
          title: 'Add logout button',
        },
      ];

      issueService.findAll.mockResolvedValue(issues);

      const result = await controller.findAll(
        projectId,
        currentUser,
      );

      expect(result).toEqual(issues);

      expect(issueService.findAll).toHaveBeenCalledWith(
        projectId,
        currentUser,
      );
    });
  });

  describe('findOne', () => {
    it('should return an issue', async () => {
      const issueId = 'issue-1';

      const issue = {
        id: issueId,
        projectId: 'project-1',
        key: 1,
        title: 'Fix login bug',
      };

      issueService.findOne.mockResolvedValue(issue);

      const result = await controller.findOne(
        issueId,
        currentUser,
      );

      expect(result).toEqual(issue);

      expect(issueService.findOne).toHaveBeenCalledWith(
        issueId,
        currentUser,
      );
    });
  });

  describe('update', () => {
    it('should update an issue', async () => {
      const issueId = 'issue-1';

      const dto: UpdateIssueDto = {
        title: 'Updated login bug',
        priority: 'HIGH',
      };

      const updatedIssue = {
        id: issueId,
        projectId: 'project-1',
        key: 1,
        title: 'Updated login bug',
        priority: 'HIGH',
      };

      issueService.update.mockResolvedValue(updatedIssue);

      const result = await controller.update(
        issueId,
        dto,
        currentUser,
      );

      expect(result).toEqual(updatedIssue);

      expect(issueService.update).toHaveBeenCalledWith(
        issueId,
        dto,
        currentUser,
      );
    });
  });

  describe('remove', () => {
    it('should remove an issue', async () => {
      const issueId = 'issue-1';

      issueService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(
        issueId,
        currentUser,
      );

      expect(result).toBeUndefined();

      expect(issueService.remove).toHaveBeenCalledWith(
        issueId,
        currentUser,
      );
    });
  });
});