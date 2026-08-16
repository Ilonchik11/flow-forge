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
import { UserRole } from '@prisma/client';

import { OrganizationService } from './organization.service';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { AuthorizationService } from 'src/common/services';

describe('OrganizationService', () => {
  let service: OrganizationService;

  const prismaService = {
    organization: {
      findUnique: jest.fn<() => Promise<any>>(),
      findMany: jest.fn<() => Promise<any[]>>(),
      create: jest.fn<() => Promise<any>>(),
      update: jest.fn<() => Promise<any>>(),
      delete: jest.fn<() => Promise<any>>(),
    },
  };

  const authorizationService = {
    canViewOrganization: jest.fn(),
    canUpdateOrganization: jest.fn(),
    canDeleteOrganization: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: AuthorizationService,
          useValue: authorizationService,
        },
      ],
    }).compile();

    service = module.get<OrganizationService>(OrganizationService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const currentUser = {
      id: 'user-1',
      email: 'john@example.com',
      role: UserRole.USER,
    } as any;

    it('should create an organization', async () => {
      const dto = {
        name: 'Flow Forge',
        slug: 'flow-forge',
        description: 'Project management platform',
        website: 'https://flowforge.com',
      };

      const organization = {
        id: 'org-1',
        name: 'Flow Forge',
        slug: 'flow-forge',
        description: 'Project management platform',
        website: 'https://flowforge.com',
        ownerId: 'user-1',
      };

      prismaService.organization.findUnique.mockResolvedValue(null);
      prismaService.organization.create.mockResolvedValue(
        organization,
      );

      const result = await service.create(dto as any, currentUser);

      expect(result).toEqual(organization);

      expect(
        prismaService.organization.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          slug: 'flow-forge',
        },
      });

      expect(
        prismaService.organization.create,
      ).toHaveBeenCalledWith({
        data: {
          name: 'Flow Forge',
          slug: 'flow-forge',
          description: 'Project management platform',
          website: 'https://flowforge.com',
          ownerId: 'user-1',
        },
      });
    });

    it('should use an empty string when website is not provided', async () => {
      const dto = {
        name: 'Flow Forge',
        slug: 'flow-forge',
      };

      const organization = {
        id: 'org-1',
        name: 'Flow Forge',
        slug: 'flow-forge',
        website: '',
        ownerId: 'user-1',
      };

      prismaService.organization.findUnique.mockResolvedValue(null);
      prismaService.organization.create.mockResolvedValue(
        organization,
      );

      const result = await service.create(dto as any, currentUser);

      expect(result).toEqual(organization);

      expect(
        prismaService.organization.create,
      ).toHaveBeenCalledWith({
        data: {
          name: 'Flow Forge',
          slug: 'flow-forge',
          description: undefined,
          website: '',
          ownerId: 'user-1',
        },
      });
    });

    it('should throw ConflictException when slug already exists', async () => {
      const existingOrganization = {
        id: 'org-1',
        slug: 'flow-forge',
      };

      prismaService.organization.findUnique.mockResolvedValue(
        existingOrganization,
      );

      await expect(
        service.create(
          {
            name: 'Another Organization',
            slug: 'flow-forge',
          } as any,
          currentUser,
        ),
      ).rejects.toThrow(
        new ConflictException(
          'Organization with this slug already exists',
        ),
      );

      expect(
        prismaService.organization.create,
      ).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all organizations for an admin', async () => {
      const currentUser = {
        id: 'admin-1',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      } as any;

      const organizations = [
        {
          id: 'org-1',
          name: 'Organization One',
          slug: 'organization-one',
          ownerId: 'user-1',
        },
        {
          id: 'org-2',
          name: 'Organization Two',
          slug: 'organization-two',
          ownerId: 'user-2',
        },
      ];

      prismaService.organization.findMany.mockResolvedValue(
        organizations,
      );

      const result = await service.findAll(currentUser);

      expect(result).toEqual(organizations);

      expect(
        prismaService.organization.findMany,
      ).toHaveBeenCalledWith({
        where: undefined,
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should return only organizations owned by the current user', async () => {
      const currentUser = {
        id: 'user-1',
        email: 'john@example.com',
        role: UserRole.USER,
      } as any;

      const organizations = [
        {
          id: 'org-1',
          name: 'My Organization',
          slug: 'my-organization',
          ownerId: 'user-1',
        },
      ];

      prismaService.organization.findMany.mockResolvedValue(
        organizations,
      );

      const result = await service.findAll(currentUser);

      expect(result).toEqual(organizations);

      expect(
        prismaService.organization.findMany,
      ).toHaveBeenCalledWith({
        where: {
          ownerId: 'user-1',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });

  describe('findOne', () => {
    const currentUser = {
      id: 'user-1',
      email: 'john@example.com',
      role: UserRole.USER,
    } as any;

    const organization = {
      id: 'org-1',
      name: 'Flow Forge',
      slug: 'flow-forge',
      ownerId: 'user-1',
    };

    it('should return an organization', async () => {
      prismaService.organization.findUnique.mockResolvedValue(
        organization,
      );

      const result = await service.findOne(
        'org-1',
        currentUser,
      );

      expect(result).toEqual(organization);

      expect(
        prismaService.organization.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          id: 'org-1',
        },
      });

      expect(
        authorizationService.canViewOrganization,
      ).toHaveBeenCalledWith(
        currentUser,
        organization,
      );
    });

    it('should throw NotFoundException when organization does not exist', async () => {
      prismaService.organization.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('org-1', currentUser),
      ).rejects.toThrow(
        new NotFoundException('Organization not found'),
      );

      expect(
        authorizationService.canViewOrganization,
      ).not.toHaveBeenCalled();
    });

    it('should propagate authorization errors', async () => {
      prismaService.organization.findUnique.mockResolvedValue(
        organization,
      );

      authorizationService.canViewOrganization.mockImplementation(
        () => {
          throw new Error('Forbidden');
        },
      );

      await expect(
        service.findOne('org-1', currentUser),
      ).rejects.toThrow('Forbidden');
    });
  });

  describe('update', () => {
    const currentUser = {
      id: 'user-1',
      email: 'john@example.com',
      role: UserRole.USER,
    } as any;

    const organization = {
      id: 'org-1',
      name: 'Flow Forge',
      slug: 'flow-forge',
      description: 'Old description',
      website: 'https://old.com',
      ownerId: 'user-1',
    };

    it('should update an organization', async () => {
      const dto = {
        name: 'Updated Flow Forge',
        description: 'Updated description',
        website: 'https://new.com',
      };

      const updatedOrganization = {
        ...organization,
        name: 'Updated Flow Forge',
        description: 'Updated description',
        website: 'https://new.com',
      };

      prismaService.organization.findUnique.mockResolvedValue(
        organization,
      );

      prismaService.organization.update.mockResolvedValue(
        updatedOrganization,
      );

      const result = await service.update(
        'org-1',
        dto as any,
        currentUser,
      );

      expect(result).toEqual(updatedOrganization);

      expect(
        authorizationService.canUpdateOrganization,
      ).toHaveBeenCalledWith(
        currentUser,
        organization,
      );

      expect(
        prismaService.organization.update,
      ).toHaveBeenCalledWith({
        where: {
          id: 'org-1',
        },
        data: {
          name: 'Updated Flow Forge',
          description: 'Updated description',
          website: 'https://new.com',
        },
      });
    });

    it('should throw NotFoundException when organization does not exist', async () => {
      prismaService.organization.findUnique.mockResolvedValue(null);

      await expect(
        service.update(
          'org-1',
          {
            name: 'Updated',
          } as any,
          currentUser,
        ),
      ).rejects.toThrow(
        new NotFoundException('Organization not found'),
      );

      expect(
        authorizationService.canUpdateOrganization,
      ).not.toHaveBeenCalled();

      expect(
        prismaService.organization.update,
      ).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when new slug is already taken', async () => {
      const slugTakenOrganization = {
        id: 'org-2',
        slug: 'new-slug',
      };

      prismaService.organization.findUnique
        .mockResolvedValueOnce(organization)
        .mockResolvedValueOnce(slugTakenOrganization);

      await expect(
        service.update(
          'org-1',
          {
            slug: 'new-slug',
          } as any,
          currentUser,
        ),
      ).rejects.toThrow(
        new ConflictException(
          'Organization with this slug already exists',
        ),
      );

      expect(
        authorizationService.canUpdateOrganization,
      ).toHaveBeenCalledWith(
        currentUser,
        organization,
      );

      expect(
        prismaService.organization.update,
      ).not.toHaveBeenCalled();
    });

    it('should update slug when the new slug is available', async () => {
      const updatedOrganization = {
        ...organization,
        slug: 'new-slug',
      };

      prismaService.organization.findUnique
        .mockResolvedValueOnce(organization)
        .mockResolvedValueOnce(null);

      prismaService.organization.update.mockResolvedValue(
        updatedOrganization,
      );

      const result = await service.update(
        'org-1',
        {
          slug: 'new-slug',
        } as any,
        currentUser,
      );

      expect(result).toEqual(updatedOrganization);

      expect(
        prismaService.organization.update,
      ).toHaveBeenCalledWith({
        where: {
          id: 'org-1',
        },
        data: {
          slug: 'new-slug',
        },
      });
    });
  });

  describe('remove', () => {
    const currentUser = {
      id: 'user-1',
      email: 'john@example.com',
      role: UserRole.USER,
    } as any;

    const organization = {
      id: 'org-1',
      name: 'Flow Forge',
      slug: 'flow-forge',
      ownerId: 'user-1',
    };

    it('should delete an organization', async () => {
      prismaService.organization.findUnique.mockResolvedValue(
        organization,
      );

      prismaService.organization.delete.mockResolvedValue(
        organization,
      );

      const result = await service.remove(
        'org-1',
        currentUser,
      );

      expect(result).toBeUndefined();

      expect(
        authorizationService.canDeleteOrganization,
      ).toHaveBeenCalledWith(
        currentUser,
        organization,
      );

      expect(
        prismaService.organization.delete,
      ).toHaveBeenCalledWith({
        where: {
          id: 'org-1',
        },
      });
    });

    it('should throw NotFoundException when organization does not exist', async () => {
      prismaService.organization.findUnique.mockResolvedValue(null);

      await expect(
        service.remove('org-1', currentUser),
      ).rejects.toThrow(
        new NotFoundException('Organization not found'),
      );

      expect(
        authorizationService.canDeleteOrganization,
      ).not.toHaveBeenCalled();

      expect(
        prismaService.organization.delete,
      ).not.toHaveBeenCalled();
    });

    it('should propagate authorization errors', async () => {
      prismaService.organization.findUnique.mockResolvedValue(
        organization,
      );

      authorizationService.canDeleteOrganization.mockImplementation(
        () => {
          throw new Error('Forbidden');
        },
      );

      await expect(
        service.remove('org-1', currentUser),
      ).rejects.toThrow('Forbidden');

      expect(
        prismaService.organization.delete,
      ).not.toHaveBeenCalled();
    });
  });
});