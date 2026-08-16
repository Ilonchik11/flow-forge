import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, ProjectRole, UserRole } from '@prisma/client';
import { AuthenticatedUser } from 'src/common/interfaces';
import { AuthorizationService } from 'src/common/services';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { NotificationService } from '../notification/services/notification.service';
import { CreateProjectDto, UpdateProjectDto } from './dto';

@Injectable()
export class ProjectService {

  constructor(
    private readonly prismaService: PrismaService,
    private readonly authorizationService: AuthorizationService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(
    dto: CreateProjectDto,
    currentUser: AuthenticatedUser,
  ) {
    const workspace = await this.prismaService.workspace.findUnique({
      where:  {
        id: dto.workspaceId,
      },
    });

    if(!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const membership = await this.getWorkspaceMembership(
      workspace.id,
      currentUser.id,
    );

    this.authorizationService.canCreateProject(
      currentUser,
      workspace,
      membership,
    );

    const existingProject = await this.prismaService.project.findUnique({
      where: {
        workspaceId_key: {
          workspaceId: dto.workspaceId,
          key: dto.key,
        },
      },
    });

    if(existingProject) {
      throw new ConflictException('Project with this key already exists in this workspace');
    }

    return this.prismaService.project.create({
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
  }

  async findAll(
    currentUser: AuthenticatedUser,
  ) {
    if(currentUser.role === UserRole.ADMIN) {
      return this.prismaService.project.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    return this.prismaService.project.findMany({
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
  }

  async findOne(
    id: string,
    currentUser: AuthenticatedUser,
  ) {
    const project = await this.prismaService.project.findUnique({
      where: {
        id,
      },
    });

    if(!project) {
      throw new NotFoundException('Project not found');
    }

    const membership = await this.getWorkspaceMembership(
      project.workspaceId,
      currentUser.id,
    );

    this.authorizationService.canViewProject(
      currentUser,
      project,
      membership,
    );

    return project;
  }

  async update(
    id: string, 
    dto: UpdateProjectDto,
    currentUser: AuthenticatedUser,
  ) {
    const project = await this.prismaService.project.findUnique({
      where: {
        id,
      },
      include: {
        members: {
          select: {
            userId: true,
          },
        },
      },
    });

    if(!project) {
      throw new NotFoundException('Project not found');
    }

    const membership = await this.getWorkspaceMembership(
      project.workspaceId,
      currentUser.id,
    );

    this.authorizationService.canUpdateProject(
      currentUser,
      project,
      membership,
    );

    if(
      dto.key !== undefined &&
      dto.key !== project.key
    ) {
      const existing = await this.prismaService.project.findUnique({
        where: {
          workspaceId_key: {
            workspaceId: project.workspaceId,
            key: dto.key,
          },
        },
      });

      if(existing) {
        throw new ConflictException('Project with this key already exists in this workspace');
      }
    }

    return this.prismaService.$transaction(async (tx) => {
      const updatedProject = await tx.project.update({
        where: {
          id,
        },
        data: {
          ...(dto.name !== undefined && {
            name: dto.name,
          }),

          ...(dto.key !== undefined && {
            key: dto.key,
          }),

          ...(dto.description !== undefined && {
            description: dto.description,
          }),

          ...(dto.avatarUrl !== undefined && {
            avatarUrl: dto.avatarUrl,
          }),
        },
      });

      const memberIds = project.members
        .map((member) => member.userId)
        .filter((userId) => userId !== currentUser.id);

      await this.notificationService.notifyUsersTx(
        tx,
        memberIds,
        NotificationType.PROJECT_UPDATED,
        'Project updated',
        `Project "${updatedProject.name}" was updated`,
      );

      return updatedProject;
    });
  }

  async remove(
    id: string,
    currentUser: AuthenticatedUser,
  ) {
    const project = await this.prismaService.project.findUnique({
      where: {
        id,
      },
      include: {
        members: {
          select: {
            userId: true,
          },
        },
      },
    });

    if(!project) {
      throw new NotFoundException('Project not found');
    }

    const membership = await this.getWorkspaceMembership(
      project.workspaceId,
      currentUser.id,
    );

    this.authorizationService.canDeleteProject(
      currentUser,
      project,
      membership,
    );

    return this.prismaService.$transaction(async (tx) => {
      const memberIds = project.members
        .map((member) => member.userId)
        .filter((userId) => userId !== currentUser.id);

      await tx.project.delete({
        where: {
          id: project.id,
        },
      });

      await this.notificationService.notifyUsersTx(
        tx,
        memberIds,
        NotificationType.PROJECT_DELETED,
        'Project deleted',
        `Project "${project.name}" was deleted`,
      );
    });
  }

  private async getWorkspaceMembership(
    workspaceId: string,
    userId: string,
  ) {
    return this.prismaService.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });
  }
}
