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
  IssueStatus,
  NotificationType,
} from '@prisma/client';

import { AuthorizationService } from 'src/common/services';
import { PrismaService } from 'src/infra/prisma/prisma.service';

import { NotificationService } from '../../notification/services/notification.service';
import { IssueService } from './issue.service';

describe('IssueService', () => {
  let service: IssueService;

  type TxMock = {
    issue: {
      create: jest.Mock<() => Promise<any>>;
      update: jest.Mock<() => Promise<any>>;
      delete: jest.Mock<() => Promise<any>>;
    };
  };

  const tx: TxMock = {
    issue: {
      create: jest.fn<() => Promise<any>>(),
      update: jest.fn<() => Promise<any>>(),
      delete: jest.fn<() => Promise<any>>(),
    },
  };

  const prismaService = {
    project: {
      findUnique: jest.fn<() => Promise<any>>(),
    },

    issue: {
      findFirst: jest.fn<() => Promise<any>>(),
      findMany: jest.fn<() => Promise<any[]>>(),
      findUnique: jest.fn<() => Promise<any>>(),
    },

    projectMember: {
      findUnique: jest.fn<() => Promise<any>>(),
    },

    $transaction: jest.fn(
      async (callback: (tx: TxMock) => Promise<any>) => {
        return callback(tx);
      },
    ),
  };

  const authorizationService = {
    canCreateIssue: jest.fn(),
    canViewIssue: jest.fn(),
    canUpdateIssue: jest.fn(),
    canDeleteIssue: jest.fn(),
  };

  const notificationService = {
    createTx: jest.fn<() => Promise<any>>(),
    notifyUsersTx: jest.fn<() => Promise<any>>(),
  };

  const currentUser = {
    id: 'user-1',
    email: 'john@example.com',
    role: 'USER',
  } as any;

  const project = {
    id: 'project-1',
    ownerId: 'user-1',
    name: 'Flow Forge',
    members: [
      {
        userId: 'user-1',
        role: 'ADMIN',
      },
      {
        userId: 'user-2',
        role: 'MEMBER',
      },
      {
        userId: 'user-3',
        role: 'MEMBER',
      },
    ],
  };

  const issue = {
    id: 'issue-1',
    projectId: 'project-1',
    key: 1,
    title: 'Fix login bug',
    description: 'Login does not work',
    type: 'BUG',
    status: IssueStatus.TODO,
    priority: 'HIGH',
    reporterId: 'user-1',
    assigneeId: 'user-2',
    createdAt: new Date(),
    updatedAt: new Date(),

    project: {
      id: 'project-1',
      ownerId: 'user-1',
      members: [
        {
          userId: 'user-1',
          role: 'ADMIN',
        },
        {
          userId: 'user-2',
          role: 'MEMBER',
        },
      ],
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IssueService,
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

    service = module.get<IssueService>(IssueService);

    jest.clearAllMocks();

    authorizationService.canCreateIssue.mockReset();
    authorizationService.canViewIssue.mockReset();
    authorizationService.canUpdateIssue.mockReset();
    authorizationService.canDeleteIssue.mockReset();

    prismaService.project.findUnique.mockReset();
    prismaService.issue.findFirst.mockReset();
    prismaService.issue.findMany.mockReset();
    prismaService.issue.findUnique.mockReset();
    prismaService.projectMember.findUnique.mockReset();

    notificationService.createTx.mockReset();
    notificationService.notifyUsersTx.mockReset();

    tx.issue.create.mockReset();
    tx.issue.update.mockReset();
    tx.issue.delete.mockReset();

    prismaService.$transaction.mockImplementation(
      async (callback: (tx: TxMock) => Promise<any>) => {
        return callback(tx);
      },
    );
  });

  describe('create', () => {
    const dto = {
      projectId: 'project-1',
      title: 'Fix login bug',
      description: 'Login does not work',
      type: 'BUG',
      priority: 'HIGH',
    } as any;

    it('should create an issue', async () => {
      prismaService.project.findUnique.mockResolvedValue(project);

      prismaService.issue.findFirst.mockResolvedValue({
        key: 5,
      });

      tx.issue.create.mockResolvedValue({
        ...issue,
        key: 6,
        assigneeId: undefined,
      });

      const result = await service.create(
        dto,
        currentUser,
      );

      expect(result).toEqual({
        ...issue,
        key: 6,
        assigneeId: undefined,
      });

      expect(
        authorizationService.canCreateIssue,
      ).toHaveBeenCalledWith(
        currentUser,
        project,
      );

      expect(
        prismaService.issue.findFirst,
      ).toHaveBeenCalledWith({
        where: {
          projectId: 'project-1',
        },
        orderBy: {
          key: 'desc',
        },
        select: {
          key: true,
        },
      });

      expect(tx.issue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            projectId: 'project-1',
            key: 6,
            title: 'Fix login bug',
            description: 'Login does not work',
            status: IssueStatus.TODO,
            reporterId: 'user-1',
          }),
        }),
      );
    });

    it('should create the first issue with key 1', async () => {
      prismaService.project.findUnique.mockResolvedValue(project);

      prismaService.issue.findFirst.mockResolvedValue(null);

      tx.issue.create.mockResolvedValue({
        ...issue,
        key: 1,
      });

      await service.create(dto, currentUser);

      expect(tx.issue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            key: 1,
          }),
        }),
      );
    });

    it('should throw NotFoundException when project does not exist', async () => {
      prismaService.project.findUnique.mockResolvedValue(null);

      await expect(
        service.create(dto, currentUser),
      ).rejects.toThrow(
        new NotFoundException('Project not found'),
      );

      expect(
        authorizationService.canCreateIssue,
      ).not.toHaveBeenCalled();
    });

    it('should propagate issue creation authorization errors', async () => {
      prismaService.project.findUnique.mockResolvedValue(project);

      authorizationService.canCreateIssue.mockImplementation(
        () => {
          throw new Error('Forbidden');
        },
      );

      await expect(
        service.create(dto, currentUser),
      ).rejects.toThrow('Forbidden');

      expect(
        prismaService.issue.findFirst,
      ).not.toHaveBeenCalled();

      expect(tx.issue.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when assignee is not a project member', async () => {
      prismaService.project.findUnique.mockResolvedValue(project);

      prismaService.projectMember.findUnique.mockResolvedValue(null);

      const dtoWithAssignee = {
        ...dto,
        assigneeId: 'user-99',
      };

      await expect(
        service.create(dtoWithAssignee, currentUser),
      ).rejects.toThrow(
        new ConflictException(
          'Assignee must be a member of this project',
        ),
      );

      expect(
        prismaService.projectMember.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          projectId_userId: {
            projectId: 'project-1',
            userId: 'user-99',
          },
        },
      });

      expect(tx.issue.create).not.toHaveBeenCalled();
    });

    it('should create an issue and notify the assignee', async () => {
      prismaService.project.findUnique.mockResolvedValue(project);

      prismaService.projectMember.findUnique.mockResolvedValue({
        projectId: 'project-1',
        userId: 'user-2',
      });

      prismaService.issue.findFirst.mockResolvedValue({
        key: 3,
      });

      const assignedIssue = {
        ...issue,
        key: 4,
        assigneeId: 'user-2',
      };

      tx.issue.create.mockResolvedValue(assignedIssue);

      await service.create(
        {
          ...dto,
          assigneeId: 'user-2',
        },
        currentUser,
      );

      expect(
        notificationService.createTx,
      ).toHaveBeenCalledWith(
        tx,
        {
          userId: 'user-2',
          type: NotificationType.ISSUE_ASSIGNED,
          title: 'New issue assigned',
          message:
            'You were assigned issue #4: "Fix login bug" in project "Flow Forge"',
        },
      );
    });

    it('should not notify when issue is assigned to the current user', async () => {
      prismaService.project.findUnique.mockResolvedValue(project);

      prismaService.projectMember.findUnique.mockResolvedValue({
        projectId: 'project-1',
        userId: 'user-1',
      });

      prismaService.issue.findFirst.mockResolvedValue({
        key: 1,
      });

      tx.issue.create.mockResolvedValue({
        ...issue,
        key: 2,
        assigneeId: 'user-1',
      });

      await service.create(
        {
          ...dto,
          assigneeId: 'user-1',
        },
        currentUser,
      );

      expect(
        notificationService.createTx,
      ).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all issues for a project', async () => {
      prismaService.project.findUnique.mockResolvedValue(project);

      const issues = [
        {
          ...issue,
        },
      ];

      prismaService.issue.findMany.mockResolvedValue(issues);

      const result = await service.findAll(
        'project-1',
        currentUser,
      );

      expect(result).toEqual(issues);

      expect(
        authorizationService.canViewIssue,
      ).toHaveBeenCalledWith(
        currentUser,
        project,
      );

      expect(
        prismaService.issue.findMany,
      ).toHaveBeenCalledWith({
        where: {
          projectId: 'project-1',
        },
        select: expect.any(Object),
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should throw NotFoundException when project does not exist', async () => {
      prismaService.project.findUnique.mockResolvedValue(null);

      await expect(
        service.findAll('project-1', currentUser),
      ).rejects.toThrow(
        new NotFoundException('Project not found'),
      );

      expect(
        prismaService.issue.findMany,
      ).not.toHaveBeenCalled();
    });

    it('should propagate authorization errors', async () => {
      prismaService.project.findUnique.mockResolvedValue(project);

      authorizationService.canViewIssue.mockImplementation(
        () => {
          throw new Error('Forbidden');
        },
      );

      await expect(
        service.findAll('project-1', currentUser),
      ).rejects.toThrow('Forbidden');

      expect(
        prismaService.issue.findMany,
      ).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return an issue', async () => {
      prismaService.issue.findUnique.mockResolvedValue(issue);

      const result = await service.findOne(
        'issue-1',
        currentUser,
      );

      expect(result).toEqual(issue);

      expect(
        authorizationService.canViewIssue,
      ).toHaveBeenCalledWith(
        currentUser,
        issue.project,
      );
    });

    it('should throw NotFoundException when issue does not exist', async () => {
      prismaService.issue.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('issue-1', currentUser),
      ).rejects.toThrow(
        new NotFoundException('Issue not found'),
      );

      expect(
        authorizationService.canViewIssue,
      ).not.toHaveBeenCalled();
    });

    it('should propagate authorization errors', async () => {
      prismaService.issue.findUnique.mockResolvedValue(issue);

      authorizationService.canViewIssue.mockImplementation(
        () => {
          throw new Error('Forbidden');
        },
      );

      await expect(
        service.findOne('issue-1', currentUser),
      ).rejects.toThrow('Forbidden');
    });
  });

  describe('update', () => {
    const dto = {
      title: 'Updated title',
      priority: 'CRITICAL',
    } as any;

    it('should update an issue', async () => {
      prismaService.issue.findUnique.mockResolvedValue(issue);

      const updatedIssue = {
        ...issue,
        title: 'Updated title',
        priority: 'CRITICAL',
      };

      tx.issue.update.mockResolvedValue(updatedIssue);

      const result = await service.update(
        'issue-1',
        dto,
        currentUser,
      );

      expect(result).toEqual(updatedIssue);

      expect(
        authorizationService.canUpdateIssue,
      ).toHaveBeenCalledWith(
        currentUser,
        issue.project,
        issue,
      );

      expect(tx.issue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'issue-1',
          },
          data: {
            title: 'Updated title',
            priority: 'CRITICAL',
          },
        }),
      );
    });

    it('should throw NotFoundException when issue does not exist', async () => {
      prismaService.issue.findUnique.mockResolvedValue(null);

      await expect(
        service.update(
          'issue-1',
          dto,
          currentUser,
        ),
      ).rejects.toThrow(
        new NotFoundException('Issue not found'),
      );

      expect(
        authorizationService.canUpdateIssue,
      ).not.toHaveBeenCalled();
    });

    it('should propagate authorization errors', async () => {
      prismaService.issue.findUnique.mockResolvedValue(issue);

      authorizationService.canUpdateIssue.mockImplementation(
        () => {
          throw new Error('Forbidden');
        },
      );

      await expect(
        service.update(
          'issue-1',
          dto,
          currentUser,
        ),
      ).rejects.toThrow('Forbidden');

      expect(tx.issue.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when new assignee is not a project member', async () => {
      prismaService.issue.findUnique.mockResolvedValue(issue);

      prismaService.projectMember.findUnique.mockResolvedValue(null);

      await expect(
        service.update(
          'issue-1',
          {
            assigneeId: 'user-99',
          } as any,
          currentUser,
        ),
      ).rejects.toThrow(
        new ConflictException(
          'Assignee must be a member of this project',
        ),
      );

      expect(tx.issue.update).not.toHaveBeenCalled();
    });

    it('should update assignee and notify the new assignee', async () => {
      prismaService.issue.findUnique.mockResolvedValue(issue);

      prismaService.projectMember.findUnique.mockResolvedValue({
        projectId: 'project-1',
        userId: 'user-3',
      });

      const updatedIssue = {
        ...issue,
        assigneeId: 'user-3',
      };

      tx.issue.update.mockResolvedValue(updatedIssue);

      await service.update(
        'issue-1',
        {
          assigneeId: 'user-3',
        } as any,
        currentUser,
      );

      expect(
        notificationService.createTx,
      ).toHaveBeenCalledWith(
        tx,
        {
          userId: 'user-3',
          type: NotificationType.ISSUE_ASSIGNED,
          title: 'Issue assigned to you',
          message:
            'You were assigned issue #1: "Fix login bug"',
        },
      );
    });

    it('should not notify when assignee has not changed', async () => {
      prismaService.issue.findUnique.mockResolvedValue(issue);

      prismaService.projectMember.findUnique.mockResolvedValue({
        projectId: 'project-1',
        userId: 'user-2',
      });

      tx.issue.update.mockResolvedValue({
        ...issue,
      });

      await service.update(
        'issue-1',
        {
          assigneeId: 'user-2',
        } as any,
        currentUser,
      );

      expect(
        notificationService.createTx,
      ).not.toHaveBeenCalled();
    });

    it('should notify users when issue status changes', async () => {
      prismaService.issue.findUnique.mockResolvedValue(issue);

      const updatedIssue = {
        ...issue,
        status: IssueStatus.IN_PROGRESS,
      };

      tx.issue.update.mockResolvedValue(updatedIssue);

      await service.update(
        'issue-1',
        {
          status: IssueStatus.IN_PROGRESS,
        } as any,
        currentUser,
      );

      expect(
        notificationService.notifyUsersTx,
      ).toHaveBeenCalledWith(
        tx,
        ['user-2'],
        NotificationType.ISSUE_STATUS_CHANGED,
        'Issue status changed',
        'Issue #1: "Fix login bug" is now IN_PROGRESS',
      );
    });

    it('should notify reporter and assignee when status changes', async () => {
      const issueWithDifferentReporter = {
        ...issue,
        reporterId: 'user-3',
        assigneeId: 'user-2',
      };

      prismaService.issue.findUnique.mockResolvedValue(
        issueWithDifferentReporter,
      );

      const updatedIssue = {
        ...issueWithDifferentReporter,
        status: IssueStatus.DONE,
      };

      tx.issue.update.mockResolvedValue(updatedIssue);

      await service.update(
        'issue-1',
        {
          status: IssueStatus.DONE,
        } as any,
        currentUser,
      );

      expect(
        notificationService.notifyUsersTx,
      ).toHaveBeenCalledWith(
        tx,
        ['user-3', 'user-2'],
        NotificationType.ISSUE_STATUS_CHANGED,
        'Issue status changed',
        'Issue #1: "Fix login bug" is now DONE',
      );
    });

    it('should not notify when status has not changed', async () => {
      prismaService.issue.findUnique.mockResolvedValue(issue);

      tx.issue.update.mockResolvedValue(issue);

      await service.update(
        'issue-1',
        {
          title: 'Another title',
        } as any,
        currentUser,
      );

      expect(
        notificationService.notifyUsersTx,
      ).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete an issue and notify other users', async () => {
      prismaService.issue.findUnique.mockResolvedValue(issue);

      await service.remove(
        'issue-1',
        currentUser,
      );

      expect(
        authorizationService.canDeleteIssue,
      ).toHaveBeenCalledWith(
        currentUser,
        issue.project,
        issue,
      );

      expect(tx.issue.delete).toHaveBeenCalledWith({
        where: {
          id: 'issue-1',
        },
      });

      expect(
        notificationService.notifyUsersTx,
      ).toHaveBeenCalledWith(
        tx,
        ['user-2'],
        NotificationType.ISSUE_DELETED,
        'Issue deleted',
        'Issue #1: "Fix login bug" was deleted',
      );
    });

    it('should throw NotFoundException when issue does not exist', async () => {
      prismaService.issue.findUnique.mockResolvedValue(null);

      await expect(
        service.remove(
          'issue-1',
          currentUser,
        ),
      ).rejects.toThrow(
        new NotFoundException('Issue not found'),
      );

      expect(
        authorizationService.canDeleteIssue,
      ).not.toHaveBeenCalled();

      expect(tx.issue.delete).not.toHaveBeenCalled();
    });

    it('should propagate authorization errors', async () => {
      prismaService.issue.findUnique.mockResolvedValue(issue);

      authorizationService.canDeleteIssue.mockImplementation(
        () => {
          throw new Error('Forbidden');
        },
      );

      await expect(
        service.remove(
          'issue-1',
          currentUser,
        ),
      ).rejects.toThrow('Forbidden');

      expect(tx.issue.delete).not.toHaveBeenCalled();
    });

    it('should notify reporter and assignee without duplicates', async () => {
      const issueWithSameReporterAndAssignee = {
        ...issue,
        reporterId: 'user-2',
        assigneeId: 'user-2',
      };

      prismaService.issue.findUnique.mockResolvedValue(
        issueWithSameReporterAndAssignee,
      );

      await service.remove(
        'issue-1',
        currentUser,
      );

      expect(
        notificationService.notifyUsersTx,
      ).toHaveBeenCalledWith(
        tx,
        ['user-2'],
        NotificationType.ISSUE_DELETED,
        'Issue deleted',
        'Issue #1: "Fix login bug" was deleted',
      );
    });

    it('should not notify the current user when deleting an issue', async () => {
      const issueOwnedByCurrentUser = {
        ...issue,
        reporterId: 'user-1',
        assigneeId: 'user-1',
      };

      prismaService.issue.findUnique.mockResolvedValue(
        issueOwnedByCurrentUser,
      );

      await service.remove(
        'issue-1',
        currentUser,
      );

      expect(
        notificationService.notifyUsersTx,
      ).toHaveBeenCalledWith(
        tx,
        [],
        NotificationType.ISSUE_DELETED,
        'Issue deleted',
        'Issue #1: "Fix login bug" was deleted',
      );
    });
  });
});