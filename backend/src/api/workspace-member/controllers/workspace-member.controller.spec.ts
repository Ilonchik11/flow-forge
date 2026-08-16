import {
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals';
import { AuthenticatedUser } from 'src/common/interfaces';
import {
  CreateWorkspaceMemberDto,
  UpdateWorkspaceMemberDto,
} from '../dto';
import { WorkspaceMemberService } from '../services/workspace-member.service';
import { WorkspaceMemberController } from './workspace-member.controller';

describe('WorkspaceMemberController', () => {
  let controller: WorkspaceMemberController;

  const workspaceMemberService = {
    findAll: jest.fn<() => Promise<any[]>>(),
    findOne: jest.fn<() => Promise<any>>(),
    create: jest.fn<() => Promise<any>>(),
    update: jest.fn<() => Promise<any>>(),
    remove: jest.fn<() => Promise<any>>(),
    leave: jest.fn<() => Promise<any>>(),
  };

  const currentUser: AuthenticatedUser = {
    id: 'user-1',
    email: 'john@example.com',
    role: 'USER',
    status: 'ACTIVE',
  };

  const workspaceMember = {
    id: 'member-1',
    userId: 'user-2',
    workspaceId: 'workspace-1',
    role: 'MEMBER',
    joinedAt: new Date(),
    user: {
      id: 'user-2',
      email: 'jane@example.com',
      status: 'ACTIVE',
      isEmailVerified: true,
      profile: {
        id: 'profile-2',
        firstName: 'Jane',
        lastName: 'Doe',
        displayName: 'Jane Doe',
        avatarUrl: null,
        jobTitle: 'Developer',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    controller = new WorkspaceMemberController(
      workspaceMemberService as unknown as WorkspaceMemberService,
    );
  });

  describe('findAll', () => {
    it('should return all workspace members', async () => {
      const members = [workspaceMember];

      workspaceMemberService.findAll.mockResolvedValue(members);

      const result = await controller.findAll(
        'workspace-1',
        currentUser,
      );

      expect(result).toEqual(members);

      expect(
        workspaceMemberService.findAll,
      ).toHaveBeenCalledWith(
        'workspace-1',
        currentUser,
      );
    });
  });

  describe('findOne', () => {
    it('should return a workspace member', async () => {
      workspaceMemberService.findOne.mockResolvedValue(
        workspaceMember,
      );

      const result = await controller.findOne(
        'workspace-1',
        'member-1',
        currentUser,
      );

      expect(result).toEqual(workspaceMember);

      expect(
        workspaceMemberService.findOne,
      ).toHaveBeenCalledWith(
        'workspace-1',
        'member-1',
        currentUser,
      );
    });
  });

  describe('create', () => {
    const dto: CreateWorkspaceMemberDto = {
      userId: 'user-2',
    };

    it('should create a workspace member', async () => {
      workspaceMemberService.create.mockResolvedValue(
        workspaceMember,
      );

      const result = await controller.create(
        'workspace-1',
        dto,
        currentUser,
      );

      expect(result).toEqual(workspaceMember);

      expect(
        workspaceMemberService.create,
      ).toHaveBeenCalledWith(
        'workspace-1',
        dto,
        currentUser,
      );
    });
  });

  describe('leave', () => {
    it('should allow the current user to leave the workspace', async () => {
      workspaceMemberService.leave.mockResolvedValue(undefined);

      const result = await controller.leave(
        'workspace-1',
        currentUser,
      );

      expect(result).toBeUndefined();

      expect(
        workspaceMemberService.leave,
      ).toHaveBeenCalledWith(
        'workspace-1',
        currentUser,
      );
    });
  });

  describe('update', () => {
    const dto: UpdateWorkspaceMemberDto = {
      role: 'ADMIN',
    };

    it('should update a workspace member', async () => {
      const updatedMember = {
        ...workspaceMember,
        role: 'ADMIN',
      };

      workspaceMemberService.update.mockResolvedValue(
        updatedMember,
      );

      const result = await controller.update(
        'workspace-1',
        'member-1',
        dto,
        currentUser,
      );

      expect(result).toEqual(updatedMember);

      expect(
        workspaceMemberService.update,
      ).toHaveBeenCalledWith(
        'workspace-1',
        'member-1',
        dto,
        currentUser,
      );
    });
  });

  describe('delete', () => {
    it('should remove a workspace member', async () => {
      workspaceMemberService.remove.mockResolvedValue(undefined);

      const result = await controller.delete(
        'workspace-1',
        'member-1',
        currentUser,
      );

      expect(result).toBeUndefined();

      expect(
        workspaceMemberService.remove,
      ).toHaveBeenCalledWith(
        'workspace-1',
        'member-1',
        currentUser,
      );
    });
  });
});