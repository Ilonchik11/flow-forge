import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthenticatedUser } from 'src/common/interfaces';
import { AuthorizationService } from 'src/common/services';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from './dto';
import { WorkspaceRole } from '@prisma/client';

@Injectable()
export class WorkspaceService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async create(
    dto: CreateWorkspaceDto,
    currentUser: AuthenticatedUser,
  ) {
    const organization =
      await this.prismaService.organization.findUnique({
        where: {
          id: dto.organizationId,
        },
      });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    this.authorizationService.canUpdateOrganization(
      currentUser,
      organization,
    );

    const existingWorkspace =
      await this.prismaService.workspace.findUnique({
        where: {
          organizationId_slug: {
            organizationId: dto.organizationId,
            slug: dto.slug,
          },
        },
      });

    if (existingWorkspace) {
      throw new ConflictException('Workspace with this slug already exists in this organization');
    }

    return this.prismaService.workspace.create({
      data: {
        organizationId: dto.organizationId,
        ownerId: currentUser.id,
        name: dto.name,
        slug: dto.slug,
        description: dto.description,

        members: {
          create: {
            userId: currentUser.id,
            role:  WorkspaceRole.OWNER,
          },
        },
      },
      include: {
        members: true,
      },
    });
  }

  async findAll(currentUser: AuthenticatedUser) {
    return this.prismaService.workspace.findMany({
      where: {
        ownerId: currentUser.id,
      },
      // where: {
      //   OR: [
      //     { ownerId: currentUser.id },
      //     {
      //       members: {
      //         some: {
      //           userId: currentUser.id,
      //         },
      //       },
      //     },
      //   ],
      // },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(
    id: string,
    currentUser: AuthenticatedUser,
  ) {
    const workspace = await this.prismaService.workspace.findUnique({
      where: {
        id,
      },
    });

    if(!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    this.authorizationService.canViewWorkspace(
      currentUser, 
      workspace
    );

    return workspace;
  }

  async update(
    id: string, 
    dto: UpdateWorkspaceDto,
    currentUser: AuthenticatedUser,
  ) {
    const workspace = await this.prismaService.workspace.findUnique({
      where: {
        id,
      },
    });

    if(!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    this.authorizationService.canUpdateWorkspace(
      currentUser, 
      workspace
    );

    if (
      dto.slug !== undefined &&
      dto.slug !== workspace.slug
    ) {
      const slugTaken =
        await this.prismaService.workspace.findUnique({
          where: {
            organizationId_slug: {
              organizationId: workspace.organizationId,
              slug: dto.slug,
            },
          },
        });

      if (slugTaken) {
        throw new ConflictException('Workspace with this slug already exists in this organization');
      }
    }

    return this.prismaService.workspace.update({
      where: {
        id: workspace.id,
      },
      data: {
        ...(dto.name !== undefined && {
          name: dto.name,
        }),

        ...(dto.slug !== undefined && {
          slug: dto.slug,
        }),

        ...(dto.description !== undefined && {
          description: dto.description,
        }),
      },
    });
  }

  async remove(
    id: string,
    currentUser: AuthenticatedUser,
  ) {
    const workspace = await this.prismaService.workspace.findUnique({
      where: {
        id,
      },
    });

    if(!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    this.authorizationService.canDeleteWorkspace(
      currentUser, 
      workspace
    );

    await this.prismaService.workspace.delete({
      where: {
        id: workspace.id,
      },
    });

    return true;
  }
}
