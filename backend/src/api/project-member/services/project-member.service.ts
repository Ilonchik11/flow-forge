import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, ProjectRole } from '@prisma/client';
import { NotificationService } from 'src/api/notification/services/notification.service';
import { AuthenticatedUser } from 'src/common/interfaces';
import { AuthorizationService } from 'src/common/services';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { CreateProjectMemberDto, UpdateProjectMemberDto } from '../dto';

@Injectable()
export class ProjectMemberService {

  constructor(
    private readonly prismaService: PrismaService,
    private readonly authorizationService: AuthorizationService,
    private readonly notificationService: NotificationService,
  ) {}

  async findAll(
    projectId: string,
    currentUser: AuthenticatedUser,
  ) {
    const project = await this.getProject(projectId);

    this.authorizationService.canViewProjectMembers(
      currentUser,
      project,
    );

    return this.prismaService.projectMember.findMany({
      where: {
        projectId: project.id,
      },
      select: {
        id: true,
        projectId: true,
        userId: true,
        role: true,
        joinedAt: true,

        user: {
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
      },
      orderBy: {
        joinedAt: 'asc',
      },
    });
  }

  async findOne(
    projectId: string,
    memberId: string,
    currentUser: AuthenticatedUser,
  ) {
    const project = await this.getProject(projectId);

    this.authorizationService.canViewProjectMembers(
      currentUser,
      project,
    );

    const member = await this.prismaService.projectMember.findFirst({
      where: {
        id: memberId,
        projectId,
      },
      select: {
        id: true,
        projectId: true,
        userId: true,
        role: true,
        joinedAt: true,

        user: {
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
      },
    });

    if(!member) {
      throw new NotFoundException('Project member not found');
    }

    return member;
  }
  
  async create(
    projectId: string,
    dto: CreateProjectMemberDto,
    currentUser: AuthenticatedUser,
  ) {
    const project = await this.getProject(projectId);

    this.authorizationService.canManageProjectMembers(
      currentUser,
      project
    );

    const user = await this.prismaService.user.findUnique({
      where: {
        id: dto.userId,
      },
    });

    if(!user) {
      throw new NotFoundException('User not found');
    }

    const existingMember = await this.prismaService.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId: dto.userId,
        },
      },
    });

    if(existingMember) {
      throw new ConflictException('User is already a member of this project');
    }

    return this.prismaService.$transaction(async (tx) => {
      const existingMembers = await tx.projectMember.findMany({
        where: {
          projectId: project.id,
        },
        select: {
          userId: true,
        },
      });

      const member = await tx.projectMember.create({
        data:{
          projectId: project.id,
          userId: dto.userId,
          role: ProjectRole.MEMBER,
        },
        select: {
          id: true,
          projectId: true,
          userId: true,
          role: true,
          joinedAt: true,

          user: {
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
        },
      });

      await this.notificationService.createTx(
        tx,
        {
          userId: dto.userId,
          type: NotificationType.PROJECT_MEMBER_ADDED,
          title: 'Added to project',
          message: `You were added to project "${project.name}"`,
        }
      );

      await this.notificationService.notifyUsersTx(
        tx,
        existingMembers
          .filter((member) => member.userId !== currentUser.id)
          .map((member) => member.userId),
        NotificationType.PROJECT_MEMBER_ADDED,
        'New project member',
        `${user.email} was added to project "${project.name}"`,
      );

      return member;
    });
  }

  async update(
    projectId: string, 
    memberId: string,
    dto: UpdateProjectMemberDto,
    currentUser: AuthenticatedUser,
  ) {
    const project = await this.getProject(projectId);

    this.authorizationService.canManageProjectMembers(
      currentUser,
      project
    );

    const member = await this.getProjectMember(memberId, project.id);

    if(member.userId === project.ownerId) {
      throw new ForbiddenException('Project owner role cannot be changed');
    }

    return this.prismaService.$transaction(async (tx) => {
      const updatedMember = await tx.projectMember.update({
        where: {
          id: member.id,
        },
        data: {
          role: dto.role,
        },
        select: {
          id: true,
          projectId: true,
          userId: true,
          role: true,
          joinedAt: true,

          user: {
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
        },
      });

      await this.notificationService.createTx(
        tx,
        {
          userId: member.userId,
          type: NotificationType.PROJECT_MEMBER_ROLE_CHANGED,
          title: 'Project role changed',
          message: `Your role in project "${project.name}" was changed from ${member.role} to ${dto.role}`,
        }
      );

      return updatedMember;
    });
  }

  async remove(
    projectId: string,
    memberId: string,
    currentUser: AuthenticatedUser,
  ) {
    const project = await this.getProject(projectId);

    this.authorizationService.canManageProjectMembers(
      currentUser,
      project,
    );

    const member = await this.getProjectMember(memberId, project.id);

    if(member.userId === project.ownerId) {
      throw new ForbiddenException('Project owner cannot be removed');
    }

    return this.prismaService.$transaction(async (tx) => {
      await tx.projectMember.delete({
        where: {
          id: member.id,
        },
      });

      await this.notificationService.createTx(
        tx,
        {
          userId: member.userId,
          type: NotificationType.PROJECT_MEMBER_REMOVED,
          title: 'Removed from project',
          message: `You were removed from project "${project.name}"`,
        }
      );
    });
  }

  async leave(
    projectId: string,
    currentUser: AuthenticatedUser,
  ) {
    const project = await this.getProject(projectId);

    this.authorizationService.canLeaveProject(
      currentUser,
      project,
    );

    const member = await this.prismaService.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId: currentUser.id,
        },
      },
    });

    if(!member) {
      throw new NotFoundException('You are not a member of this project');
    }

    return this.prismaService.$transaction(async (tx) => {
      const remainingMembers = await tx.projectMember.findMany({
        where: {
          projectId: project.id,
          userId: {
            not: currentUser.id,
          },
        },
        select: {
          userId: true,
        },
      });

      await tx.projectMember.delete({
        where: {
          id: member.id,
        },
      });

      await this.notificationService.notifyUsersTx(
        tx,
        remainingMembers.map((member) => member.userId),
        NotificationType.PROJECT_MEMBER_LEFT,
        'Project member left',
        `${currentUser.email} left project "${project.name}"`,
      );
    });
  }
 
  private async getProject(projectId: string) {
    const project = await this.prismaService.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        members: {
          select: {
            userId: true,
            role: true,
          },
        },
      },
    });

    if(!project){
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  private async getProjectMember(
    memberId: string,
    projectId: string,
  ) {
    const member = await this.prismaService.projectMember.findFirst({
      where: {
        id: memberId,
        projectId: projectId,
      },
    });

    if(!member) {
      throw new NotFoundException('Project member not found');
    }

    return member;
  }
}
