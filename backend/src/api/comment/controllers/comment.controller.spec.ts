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
  CommentResponseDto,
  CreateCommentDto,
  UpdateCommentDto,
} from '../dto';

import { CommentController } from './comment.controller';
import { CommentService } from '../services/comment.service';

describe('CommentController', () => {
  let controller: CommentController;

  const commentService = {
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

  const createDto: CreateCommentDto = {
    issueId: 'issue-1',
    content: 'This needs to be fixed.',
  };

  const updateDto: UpdateCommentDto = {
    content: 'Updated comment content.',
  };

  const comment: CommentResponseDto = {
    id: 'comment-1',
    issueId: 'issue-1',
    authorId: 'user-1',
    content: 'This needs to be fixed.',
    createdAt: new Date(),
    updatedAt: new Date(),
    author: {
      id: 'user-1',
      email: 'john@example.com',
      status: 'ACTIVE',
      isEmailVerified: true,
      profile: {
        id: 'profile-1',
        firstName: 'John',
        lastName: 'Doe',
        displayName: 'John Doe',
        avatarUrl: null,
        jobTitle: 'Developer',
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentController],
      providers: [
        {
          provide: CommentService,
          useValue: commentService,
        },
      ],
    }).compile();

    controller = module.get<CommentController>(
      CommentController,
    );

    jest.clearAllMocks();

    commentService.create.mockReset();
    commentService.findAll.mockReset();
    commentService.findOne.mockReset();
    commentService.update.mockReset();
    commentService.remove.mockReset();
  });

  describe('create', () => {
    beforeEach(() => {
      commentService.create.mockResolvedValue(comment);
    });

    it('should create a comment', async () => {
      const result = await controller.create(
        createDto,
        currentUser,
      );

      expect(result).toEqual(comment);

      expect(
        commentService.create,
      ).toHaveBeenCalledWith(
        createDto,
        currentUser,
      );
    });
  });

  describe('findAll', () => {
    const comments = [comment];

    beforeEach(() => {
      commentService.findAll.mockResolvedValue(comments);
    });

    it('should return all comments for an issue', async () => {
      const result = await controller.findAll(
        'issue-1',
        currentUser,
      );

      expect(result).toEqual(comments);

      expect(
        commentService.findAll,
      ).toHaveBeenCalledWith(
        'issue-1',
        currentUser,
      );
    });
  });

  describe('findOne', () => {
    beforeEach(() => {
      commentService.findOne.mockResolvedValue(comment);
    });

    it('should return a comment', async () => {
      const result = await controller.findOne(
        'comment-1',
        currentUser,
      );

      expect(result).toEqual(comment);

      expect(
        commentService.findOne,
      ).toHaveBeenCalledWith(
        'comment-1',
        currentUser,
      );
    });
  });

  describe('update', () => {
    const updatedComment: CommentResponseDto = {
      ...comment,
      content: 'Updated comment content.',
    };

    beforeEach(() => {
      commentService.update.mockResolvedValue(
        updatedComment,
      );
    });

    it('should update a comment', async () => {
      const result = await controller.update(
        'comment-1',
        updateDto,
        currentUser,
      );

      expect(result).toEqual(updatedComment);

      expect(
        commentService.update,
      ).toHaveBeenCalledWith(
        'comment-1',
        updateDto,
        currentUser,
      );
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      commentService.remove.mockResolvedValue(undefined);
    });

    it('should remove a comment', async () => {
      const result = await controller.remove(
        'comment-1',
        currentUser,
      );

      expect(result).toBeUndefined();

      expect(
        commentService.remove,
      ).toHaveBeenCalledWith(
        'comment-1',
        currentUser,
      );
    });
  });
});