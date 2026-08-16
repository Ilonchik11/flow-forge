import {
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationType } from '@prisma/client';

import { AuthenticatedUser } from 'src/common/interfaces';
import { AuthorizationService } from 'src/common/services';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { CommentService } from './comment.service';

import { NotificationService } from 'src/api/notification/services/notification.service';
import {
  CreateCommentDto,
  UpdateCommentDto,
} from '../dto';

describe('CommentService', () => {
  let service: CommentService;

  type TxMock = {
    comment: {
      create: jest.Mock<() => Promise<any>>;
    };
  };

  const tx: TxMock = {
    comment: {
      create: jest.fn<() => Promise<any>>(),
    },
  };

  const prismaService = {
    issue: {
      findUnique: jest.fn<() => Promise<any>>(),
    },

    comment: {
      findUnique: jest.fn<() => Promise<any>>(),
      findMany: jest.fn<() => Promise<any[]>>(),
      update: jest.fn<() => Promise<any>>(),
      delete: jest.fn<() => Promise<any>>(),
    },

    $transaction: jest.fn(
      async (callback: (tx: TxMock) => Promise<any>) => {
        return callback(tx);
      },
    ),
  };

  const authorizationService = {
    canCreateComment: jest.fn(),
    canViewComment: jest.fn(),
    canUpdateComment: jest.fn(),
    canDeleteComment: jest.fn(),
  };

  const notificationService = {
    notifyUsersTx: jest.fn<() => Promise<any>>(),
  };

  const currentUser: AuthenticatedUser = {
    id: 'user-1',
    email: 'john@example.com',
    role: 'USER',
    status: 'ACTIVE',
  };

  const issue = {
    id: 'issue-1',
    key: 15,
    title: 'Fix login bug',
    reporterId: 'user-2',
    assigneeId: 'user-3',

    project: {
      id: 'project-1',
      ownerId: 'user-2',

      members: [
        {
          userId: 'user-1',
          role: 'MEMBER',
        },
        {
          userId: 'user-2',
          role: 'ADMIN',
        },
        {
          userId: 'user-3',
          role: 'MEMBER',
        },
      ],
    },
  };

  const comment = {
    id: 'comment-1',
    content: 'This needs to be fixed.',
    authorId: 'user-1',
    issueId: 'issue-1',
    createdAt: new Date(),
    updatedAt: new Date(),

    issue: {
      id: 'issue-1',
      projectId: 'project-1',

      project: {
        id: 'project-1',
        ownerId: 'user-2',

        members: [
          {
            userId: 'user-1',
            role: 'MEMBER',
          },
          {
            userId: 'user-2',
            role: 'ADMIN',
          },
          {
            userId: 'user-3',
            role: 'MEMBER',
          },
        ],
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          CommentService,
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

    service = module.get<CommentService>(CommentService);

    jest.clearAllMocks();

    prismaService.comment.findUnique.mockReset();
    prismaService.comment.update.mockReset();
    prismaService.comment.delete.mockReset();

    authorizationService.canCreateComment.mockReset();
    authorizationService.canViewComment.mockReset();
    authorizationService.canUpdateComment.mockReset();
    authorizationService.canDeleteComment.mockReset();

    notificationService.notifyUsersTx.mockReset();

    tx.comment.create.mockReset();

    prismaService.$transaction.mockImplementation(
      async (callback: (tx: TxMock) => Promise<any>) => {
        return callback(tx);
      },
    );
  });

  describe('create', () => {
    const dto: CreateCommentDto = {
      issueId: 'issue-1',
      content: 'This needs to be fixed.',
    };

    const createdComment = {
      id: 'comment-1',
      issueId: 'issue-1',
      authorId: 'user-1',
      content: 'This needs to be fixed.',
    };

    beforeEach(() => {
      prismaService.issue.findUnique.mockResolvedValue(issue);
      authorizationService.canCreateComment.mockImplementation(
        () => undefined,
      );

      tx.comment.create.mockResolvedValue(createdComment);
    });

    it('should create a comment', async () => {
      const result = await service.create(
        dto,
        currentUser,
      );

      expect(result).toEqual(createdComment);

      expect(prismaService.issue.findUnique).toHaveBeenCalledWith({
        where: {
          id: dto.issueId,
        },
        select: expect.any(Object),
      });

      expect(authorizationService.canCreateComment).toHaveBeenCalledWith(
        currentUser,
        issue.project,
      );

      expect(tx.comment.create).toHaveBeenCalledWith({
        data: {
          issueId: issue.id,
          authorId: currentUser.id,
          content: dto.content,
        },
        select: expect.any(Object),
      });
    });

    it('should notify the reporter and assignee', async () => {
      await service.create(dto, currentUser);

      expect(
        notificationService.notifyUsersTx,
      ).toHaveBeenCalledWith(
        tx,
        ['user-2', 'user-3'],
        NotificationType.COMMENT_ADDED,
        'New comment',
        'john@example.com commented on issue #15: "Fix login bug"',
      );
    });

    it('should not notify the current user', async () => {
      const issueWithCurrentUserAsReporter = {
        ...issue,
        reporterId: currentUser.id,
        assigneeId: 'user-3',
      };

      prismaService.issue.findUnique.mockResolvedValue(
        issueWithCurrentUserAsReporter,
      );

      await service.create(dto, currentUser);

      expect(
        notificationService.notifyUsersTx,
      ).toHaveBeenCalledWith(
        tx,
        ['user-3'],
        NotificationType.COMMENT_ADDED,
        'New comment',
        'john@example.com commented on issue #15: "Fix login bug"',
      );
    });

    it('should not notify the same user twice', async () => {
      const issueWithSameReporterAndAssignee = {
        ...issue,
        reporterId: 'user-2',
        assigneeId: 'user-2',
      };

      prismaService.issue.findUnique.mockResolvedValue(
        issueWithSameReporterAndAssignee,
      );

      await service.create(dto, currentUser);

      expect(
        notificationService.notifyUsersTx,
      ).toHaveBeenCalledWith(
        tx,
        ['user-2'],
        NotificationType.COMMENT_ADDED,
        'New comment',
        'john@example.com commented on issue #15: "Fix login bug"',
      );
    });

    it('should propagate authorization errors', async () => {
      authorizationService.canCreateComment.mockImplementation(
        () => {
          throw new Error('Forbidden');
        },
      );

      await expect(
        service.create(dto, currentUser),
      ).rejects.toThrow('Forbidden');

      expect(tx.comment.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when issue does not exist', async () => {
      prismaService.issue.findUnique.mockResolvedValue(null);

      await expect(
        service.create(dto, currentUser),
      ).rejects.toThrow(
        new NotFoundException('Issue not found'),
      );

      expect(
        authorizationService.canCreateComment,
      ).not.toHaveBeenCalled();

      expect(tx.comment.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const comments = [
      {
        id: 'comment-1',
        issueId: 'issue-1',
        authorId: 'user-1',
        content: 'First comment',
      },
      {
        id: 'comment-2',
        issueId: 'issue-1',
        authorId: 'user-2',
        content: 'Second comment',
      },
    ];

    beforeEach(() => {
      prismaService.issue.findUnique.mockResolvedValue(issue);

      authorizationService.canViewComment.mockImplementation(
        () => undefined,
      );

      prismaService.comment.findMany.mockResolvedValue(
        comments,
      );
    });

    it('should return all comments for an issue', async () => {
      const result = await service.findAll(
        'issue-1',
        currentUser,
      );

      expect(result).toEqual(comments);

      expect(
        authorizationService.canViewComment,
      ).toHaveBeenCalledWith(
        currentUser,
        issue.project,
      );

      expect(
        prismaService.comment.findMany,
      ).toHaveBeenCalledWith({
        where: {
          issueId: issue.id,
        },
        select: expect.any(Object),
        orderBy: {
          createdAt: 'asc',
        },
      });
    });

    it('should throw NotFoundException when issue does not exist', async () => {
      prismaService.issue.findUnique.mockResolvedValue(null);

      await expect(
        service.findAll('issue-1', currentUser),
      ).rejects.toThrow(
        new NotFoundException('Issue not found'),
      );

      expect(
        prismaService.comment.findMany,
      ).not.toHaveBeenCalled();
    });

    it('should propagate authorization errors', async () => {
      authorizationService.canViewComment.mockImplementation(
        () => {
          throw new Error('Forbidden');
        },
      );

      await expect(
        service.findAll('issue-1', currentUser),
      ).rejects.toThrow('Forbidden');

      expect(
        prismaService.comment.findMany,
      ).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    const returnedComment = {
      id: 'comment-1',
      issueId: 'issue-1',
      authorId: 'user-1',
      content: 'This needs to be fixed.',
    };

    beforeEach(() => {
      prismaService.comment.findUnique
        .mockResolvedValueOnce(comment)
        .mockResolvedValueOnce(returnedComment);

      authorizationService.canViewComment.mockImplementation(
        () => undefined,
      );
    });

    it('should return a comment', async () => {
      const result = await service.findOne(
        'comment-1',
        currentUser,
      );

      expect(result).toEqual(returnedComment);

      expect(
        authorizationService.canViewComment,
      ).toHaveBeenCalledWith(
        currentUser,
        comment.issue.project,
      );

      expect(
        prismaService.comment.findUnique,
      ).toHaveBeenCalledTimes(2);

      expect(
        prismaService.comment.findUnique,
      ).toHaveBeenLastCalledWith({
        where: {
          id: comment.id,
        },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when comment does not exist', async () => {
      prismaService.comment.findUnique.mockReset();
      prismaService.comment.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('comment-1', currentUser),
      ).rejects.toThrow(
        new NotFoundException('Comment not found'),
      );

      expect(
        authorizationService.canViewComment,
      ).not.toHaveBeenCalled();
    });

    it('should propagate authorization errors', async () => {
      authorizationService.canViewComment.mockImplementation(
        () => {
          throw new Error('Forbidden');
        },
      );

      await expect(
        service.findOne('comment-1', currentUser),
      ).rejects.toThrow('Forbidden');

      expect(
        prismaService.comment.findUnique,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    const dto: UpdateCommentDto = {
      content: 'Updated comment content.',
    };

    const updatedComment = {
      id: 'comment-1',
      issueId: 'issue-1',
      authorId: 'user-1',
      content: 'Updated comment content.',
    };

    beforeEach(() => {
      jest.clearAllMocks();

      prismaService.comment.findUnique.mockResolvedValue(comment);

      authorizationService.canUpdateComment.mockImplementation(
        () => undefined,
      );

      prismaService.comment.update.mockResolvedValue(
        updatedComment,
      );
    });

    it('should update a comment', async () => {
      const result = await service.update(
        'comment-1',
        dto,
        currentUser,
      );

      expect(result).toEqual(updatedComment);

      expect(
        authorizationService.canUpdateComment,
      ).toHaveBeenCalledTimes(1);

      expect(
        authorizationService.canUpdateComment,
      ).toHaveBeenCalledWith(
        currentUser,
        comment,
      );

      expect(
        prismaService.comment.update,
      ).toHaveBeenCalledWith({
        where: {
          id: comment.id,
        },
        data: {
          content: dto.content,
        },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException when comment does not exist', async () => {
      prismaService.comment.findUnique.mockResolvedValue(null);

      await expect(
        service.update(
          'comment-1',
          dto,
          currentUser,
        ),
      ).rejects.toThrow(
        new NotFoundException('Comment not found'),
      );

      expect(
        prismaService.comment.update,
      ).not.toHaveBeenCalled();
    });

    it('should propagate authorization errors', async () => {
      authorizationService.canUpdateComment.mockImplementation(
        () => {
          throw new Error('Forbidden');
        },
      );

      await expect(
        service.update(
          'comment-1',
          dto,
          currentUser,
        ),
      ).rejects.toThrow('Forbidden');

      expect(
        prismaService.comment.update,
      ).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      prismaService.comment.findUnique.mockResolvedValue(
        comment,
      );

      authorizationService.canDeleteComment.mockImplementation(
        () => undefined,
      );

      prismaService.comment.delete.mockResolvedValue(
        comment,
      );
    });

    it('should delete a comment', async () => {
      const result = await service.remove(
        'comment-1',
        currentUser,
      );

      expect(result).toBeUndefined();

      expect(
        authorizationService.canDeleteComment,
      ).toHaveBeenCalledWith(
        currentUser,
        comment.issue.project,
        comment,
      );

      expect(
        prismaService.comment.delete,
      ).toHaveBeenCalledWith({
        where: {
          id: comment.id,
        },
      });
    });

    it('should throw NotFoundException when comment does not exist', async () => {
      prismaService.comment.findUnique.mockResolvedValue(null);

      await expect(
        service.remove('comment-1', currentUser),
      ).rejects.toThrow(
        new NotFoundException('Comment not found'),
      );

      expect(
        prismaService.comment.delete,
      ).not.toHaveBeenCalled();
    });

    it('should propagate authorization errors', async () => {
      authorizationService.canDeleteComment.mockImplementation(
        () => {
          throw new Error('Forbidden');
        },
      );

      await expect(
        service.remove('comment-1', currentUser),
      ).rejects.toThrow('Forbidden');

      expect(
        prismaService.comment.delete,
      ).not.toHaveBeenCalled();
    });
  });
});