import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IssueStatus } from '@prisma/client';

import { AuthenticatedUser } from 'src/common/interfaces';
import { AuthorizationService } from 'src/common/services';
import { PrismaService } from 'src/infra/prisma/prisma.service';

import {
  CreateIssueDto,
  UpdateIssueDto,
} from './dto';

@Injectable()
export class IssueService {

  private readonly issueSelect = {
    id: true,
    projectId: true,
    key: true,
    title: true,
    description: true,
    type: true,
    status: true,
    priority: true,
    reporterId: true,
    assigneeId: true,
    createdAt: true,
    updatedAt: true,

    reporter: {
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    },

    assignee: {
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    },
  };

  constructor(
    private readonly prismaService: PrismaService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async create(
    dto: CreateIssueDto,
    currentUser: AuthenticatedUser,
  ) {
    const project = await this.getProject(dto.projectId);

    this.authorizationService.canCreateIssue(
      currentUser,
      project,
    );

    if(dto.assigneeId) {
      await this.validateAssignee(
        project.id,
        dto.assigneeId,
      );
    }

    const lastIssue = await this.prismaService.issue.findFirst({
    where: {
      projectId: project.id,
    },
    orderBy: {
      key: 'desc',
    },
    select: {
      key: true,
    },
  });

  const nextKey = (lastIssue?.key ?? 0) + 1;

    return this.prismaService.issue.create({
      data: {
        projectId: project.id,
        key: nextKey, 
        title: dto.title,
        description: dto.description,
        type: dto.type,
        status: IssueStatus.TODO,
        priority: dto.priority,
        reporterId: currentUser.id,
        assigneeId: dto.assigneeId,
      },
      select: this.issueSelect,
    });
  }

  async findAll(
    projectId: string,
    currentUser: AuthenticatedUser,
  ) {
    const project = await this.getProject(projectId);

    this.authorizationService.canViewIssue(
      currentUser,
      project,
    );

    return this.prismaService.issue.findMany({
      where: {
        projectId: project.id,
      },
      select: this.issueSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(
    id: string,
    currentUser: AuthenticatedUser,
  ) {
    const issue = await this.getIssue(id);

    this.authorizationService.canViewIssue(
      currentUser,
      issue.project,
    );

    return issue;
  }

  async update(
    id: string, 
    dto: UpdateIssueDto,
    currentUser: AuthenticatedUser,
  ) {
    const issue = await this.getIssue(id);

    this.authorizationService.canUpdateIssue(
      currentUser,
      issue.project,
      issue,
    );

    if(dto.assigneeId !== undefined && dto.assigneeId !== null) {
      await this.validateAssignee(
        issue.projectId,
        dto.assigneeId,
      );
    }

    return this.prismaService.issue.update({
      where: {
        id: issue.id,
      },
      data: {
        ...(dto.title !== undefined && {
          title: dto.title,
        }),
        ...(dto.description !== undefined && {
          description: dto.description,
        }),
        ...(dto.type !== undefined && {
          type: dto.type,
        }),
        ...(dto.status !== undefined && {
          status: dto.status,
        }),
        ...(dto.priority !== undefined && {
          priority: dto.priority,
        }),
        ...(dto.assigneeId !== undefined && {
          assigneeId: dto.assigneeId,
        }),
      },
      select: this.issueSelect,
    });
  }

  async remove(
    id: string,
    currentUser: AuthenticatedUser,
  ) {
    const issue = await this.getIssue(id);

    this.authorizationService.canDeleteIssue(
      currentUser,
      issue.project,
      issue,
    );

    await this.prismaService.issue.delete({
      where: {
        id: issue.id,
      },
    });
  }

  private async getProject(
    projectId: string,
  ) {
    const project = await this.prismaService.project.findUnique({
      where: {
        id: projectId,
      },
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
    });

    if(!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  private async getIssue(
    id: string,
  ) {
    const issue = await this.prismaService.issue.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        projectId: true,
        key: true,
        title: true,
        description: true,
        type: true,
        status: true,
        priority: true,
        reporterId: true,
        assigneeId: true,
        createdAt: true,
        updatedAt: true,

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

  private async validateAssignee(
    projectId: string,
    userId: string,
  ) {
    const member = await this.prismaService.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if(!member) {
      throw new ConflictException('Assignee must be a member of this project');
    }
  }
}
