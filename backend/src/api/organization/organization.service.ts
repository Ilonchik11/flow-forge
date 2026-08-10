import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthenticatedUser } from 'src/common/interfaces';
import { AuthorizationService } from 'src/common/services';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async create(
    dto: CreateOrganizationDto,
    currentUser: AuthenticatedUser,
  ) {
    const existingOrganization = await this.prismaService.organization.findUnique({
      where: {
        slug: dto.slug,
      },
    });

    if(existingOrganization) {
      throw new ConflictException('Organization with this slug already exists');
    }

    return this.prismaService.organization.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        website: dto.website ?? '',
        ownerId: currentUser.id,
      },
    });
  }

  async findAll(currentUser: AuthenticatedUser) {
    return this.prismaService.organization.findMany({
      where:
        currentUser.role === UserRole.ADMIN
          ? undefined
          : {
              ownerId: currentUser.id,
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
    const organization = await this.prismaService.organization.findUnique({
      where: { 
        id, 
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    this.authorizationService.canViewOrganization(
      currentUser,
      organization,
    );

    return organization;
  }

  async update(
    id: string, 
    dto: UpdateOrganizationDto,
    currentUser: AuthenticatedUser,
  ) {
    const organization = await this.prismaService.organization.findUnique({
      where: { 
        id, 
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    this.authorizationService.canUpdateOrganization(
      currentUser,
      organization,
    );

    if(
      dto.slug !== undefined &&
      dto.slug !== organization.slug
    ) {
      const slugTaken = await this.prismaService.organization.findUnique({
        where: {
          slug: dto.slug,
        },
      });

      if(slugTaken) {
        throw new ConflictException('Organization with this slug already exists');
      }
    }

    return this.prismaService.organization.update({
      where: {
        id: organization.id,
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

        ...(dto.website !== undefined && {
          website: dto.website,
        }),
      },
    });
  }

  async remove(
    id: string,
    currentUser: AuthenticatedUser,
  ) {
    const organization = await this.prismaService.organization.findUnique({
      where: { 
        id, 
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    this.authorizationService.canDeleteOrganization(
      currentUser,
      organization,
    );

    await this.prismaService.organization.delete({
      where: {
        id: organization.id,
      },
    });

    return true;
  }
}
