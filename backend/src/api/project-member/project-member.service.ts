import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthenticatedUser } from 'src/common/interfaces';
import { AuthorizationService } from 'src/common/services';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { CreateProjectMemberDto, UpdateProjectMemberDto } from './dto';
import { ProjectRole } from '@prisma/client';

@Injectable()
export class ProjectMemberService {

  constructor(
    private readonly prismaService: PrismaService,
    private readonly authorizationService: AuthorizationService,
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

    return this.prismaService.projectMember.create({
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

    return this.prismaService.projectMember.update({
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

    await this.prismaService.projectMember.delete({
      where: {
        id: member.id,
      },
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

    await this.prismaService.projectMember.delete({
      where: {
        id: member.id,
      },
    });
  }

  private async getProject(projectId) {
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
