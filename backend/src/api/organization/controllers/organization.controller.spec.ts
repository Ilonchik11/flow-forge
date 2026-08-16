import {
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';

import { OrganizationController } from './organization.controller';
import { OrganizationService } from '../services/organization.service';

describe('OrganizationController', () => {
  let controller: OrganizationController;

  const organizationService = {
    create: jest.fn<() => Promise<any>>(),
    findAll: jest.fn<() => Promise<any[]>>(),
    findOne: jest.fn<() => Promise<any>>(),
    update: jest.fn<() => Promise<any>>(),
    remove: jest.fn<() => Promise<any>>(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationController],
      providers: [
        {
          provide: OrganizationService,
          useValue: organizationService,
        },
      ],
    }).compile();

    controller = module.get<OrganizationController>(
      OrganizationController,
    );

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an organization', async () => {
      const currentUser = {
        id: 'user-1',
        email: 'john@example.com',
        role: 'USER',
      } as any;

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

      organizationService.create.mockResolvedValue(
        organization,
      );

      const result = await controller.create(
        dto as any,
        currentUser,
      );

      expect(result).toEqual(organization);

      expect(
        organizationService.create,
      ).toHaveBeenCalledWith(
        dto,
        currentUser,
      );
    });
  });

  describe('findAll', () => {
    it('should return organizations for the current user', async () => {
      const currentUser = {
        id: 'user-1',
        email: 'john@example.com',
        role: 'USER',
      } as any;

      const organizations = [
        {
          id: 'org-1',
          name: 'Flow Forge',
          slug: 'flow-forge',
          ownerId: 'user-1',
        },
        {
          id: 'org-2',
          name: 'Another Organization',
          slug: 'another-organization',
          ownerId: 'user-1',
        },
      ];

      organizationService.findAll.mockResolvedValue(
        organizations,
      );

      const result = await controller.findAll(
        currentUser,
      );

      expect(result).toEqual(organizations);

      expect(
        organizationService.findAll,
      ).toHaveBeenCalledWith(currentUser);
    });
  });

  describe('findOne', () => {
    it('should return an organization', async () => {
      const currentUser = {
        id: 'user-1',
        email: 'john@example.com',
        role: 'USER',
      } as any;

      const organization = {
        id: 'org-1',
        name: 'Flow Forge',
        slug: 'flow-forge',
        ownerId: 'user-1',
      };

      organizationService.findOne.mockResolvedValue(
        organization,
      );

      const result = await controller.findOne(
        'org-1',
        currentUser,
      );

      expect(result).toEqual(organization);

      expect(
        organizationService.findOne,
      ).toHaveBeenCalledWith(
        'org-1',
        currentUser,
      );
    });
  });

  describe('update', () => {
    it('should update an organization', async () => {
      const currentUser = {
        id: 'user-1',
        email: 'john@example.com',
        role: 'USER',
      } as any;

      const dto = {
        name: 'Updated Flow Forge',
        description: 'Updated description',
      };

      const updatedOrganization = {
        id: 'org-1',
        name: 'Updated Flow Forge',
        slug: 'flow-forge',
        description: 'Updated description',
        ownerId: 'user-1',
      };

      organizationService.update.mockResolvedValue(
        updatedOrganization,
      );

      const result = await controller.update(
        'org-1',
        dto as any,
        currentUser,
      );

      expect(result).toEqual(updatedOrganization);

      expect(
        organizationService.update,
      ).toHaveBeenCalledWith(
        'org-1',
        dto,
        currentUser,
      );
    });
  });

  describe('remove', () => {
    it('should remove an organization', async () => {
      const currentUser = {
        id: 'user-1',
        email: 'john@example.com',
        role: 'USER',
      } as any;

      organizationService.remove.mockResolvedValue(
        undefined,
      );

      const result = await controller.remove(
        'org-1',
        currentUser,
      );

      expect(result).toBeUndefined();

      expect(
        organizationService.remove,
      ).toHaveBeenCalledWith(
        'org-1',
        currentUser,
      );
    });
  });
});