import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { AuthenticatedUser } from 'src/common/interfaces';
import { AuthorizationService } from 'src/common/services';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { NotificationService } from '../notification/services/notification.service';
import { CreateCommentDto, UpdateCommentDto } from './dto';

@Injectable()
export class CommentService {
  private readonly commentSelect = {
    id: true,
    issueId: true,
    authorId: true,
    content: true,
    createdAt: true,
    updatedAt: true,

    author: {
      select: {
        id: true,
        email: true,
        status: true,
        isEmailVerified: true,

        profile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            avatarUrl: true,
            jobTitle: true,
          },
        },
      },
    },
  };

  constructor(
    private readonly prismaService: PrismaService,
    private readonly authorizationService: AuthorizationService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(
    dto: CreateCommentDto,
    currentUser: AuthenticatedUser,
  ) {
    const issue = await this.getIssue(dto.issueId);

    this.authorizationService.canCreateComment(
      currentUser,
      issue.project,
    );

    const notificationUserIds = [
      issue.reporterId,
      issue.assigneeId,
    ]
      .filter(
        (userId): userId is string => 
          !!userId && userId !== currentUser.id,
      );

    const uniqueNotificationUserIds = [
      ...new Set(notificationUserIds),
    ];

    return this.prismaService.$transaction(async (tx) => {
      const comment = await tx.comment.create({
        data: {
          issueId: issue.id,
          authorId: currentUser.id,
          content: dto.content,
        },
        select: this.commentSelect,
      });

      await this.notificationService.notifyUsersTx(
        tx,
        uniqueNotificationUserIds,
        NotificationType.COMMENT_ADDED,
        'New comment',
        `${currentUser.email} commented on issue #${issue.key}: "${issue.title}"`,
      );

      return comment;
    });
  }

  async findAll(
    issueId: string,
    currentUser: AuthenticatedUser,
  ) {
    const issue = await this.getIssue(issueId);

    this.authorizationService.canViewComment(
      currentUser,
      issue.project,
    );

    return this.prismaService.comment.findMany({
      where: {
        issueId: issue.id,
      },
      select: this.commentSelect,
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findOne(
    id: string,
    currentUser: AuthenticatedUser,
  ) {
    const comment = await this.getComment(id);

    this.authorizationService.canViewComment(
      currentUser,
      comment.issue.project,
    );

    return this.prismaService.comment.findUnique({
      where: {
        id: comment.id,
      },
      select: this.commentSelect,
    });
  }

  async update(
    id: string, 
    dto: UpdateCommentDto,
    currentUser: AuthenticatedUser,
  ) {
    const comment = await this.getComment(id);

    this.authorizationService.canUpdateComment(
      currentUser,
      comment,
    );

    return this.prismaService.comment.update({
      where: {
        id: comment.id,
      },
      data: {
        content: dto.content,
      },
      select: this.commentSelect,
    });
  }

  async remove(
    id: string,
    currentUser: AuthenticatedUser,
  ) {
    const comment = await this.getComment(id);

    this.authorizationService.canDeleteComment(
      currentUser,
      comment.issue.project,
      comment,
    );

    await this.prismaService.comment.delete({
      where: {
        id: comment.id,
      },
    });
  }

  private async getIssue(issueId: string) {
    const issue = await this.prismaService.issue.findUnique({
      where: {
        id: issueId,
      },
      select: {
        id: true,
        key: true,
        title: true,
        reporterId: true,
        assigneeId: true,

        project: {
          select: {
            id: true,
            ownerId: true,

            members: {
              select: {
                userId: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if(!issue) {
      throw new NotFoundException('Issue not found');
    }

    return issue;
  }

  private async getComment(commentId: string) {
    const comment = await this.prismaService.comment.findUnique({
      where: {
        id: commentId,
      },
      select: {
        id: true,
        content: true,
        authorId: true,
        issueId: true,
        createdAt: true,
        updatedAt: true,

        issue: {
          select: {
            id: true,
            projectId: true,

            project: {
              select: {
                id: true,
                ownerId: true,

                members: {
                  select: {
                    userId: true,
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }
}
