import { ForbiddenException, Injectable } from "@nestjs/common";
import { UserRole, WorkspaceRole } from "@prisma/client";
import { AuthenticatedUser } from "../interfaces";

@Injectable()
export class AuthorizationService {
  
  canViewUser(
    currentUser: AuthenticatedUser,
    targetUserId: string,
  ): void {
    this.requirePermission(
      this.isAdmin(currentUser) ||
        currentUser.id === targetUserId,
      'You are not allowed to view this user',
    );
  }

  canUpdateUser(
    currentUser: AuthenticatedUser,
    targetUserId: string,
  ): void {
    this.requirePermission(
      this.isAdmin(currentUser) ||
        currentUser.id === targetUserId,
      'You are not allowed to update this user',
    );
  }

  canDeleteUser(
    currentUser: AuthenticatedUser,
    targetUserId: string,
  ): void {
    this.requirePermission(
      this.isAdmin(currentUser) ||
        currentUser.id === targetUserId,
      'You are not allowed to delete this user',
    );
  }

  canViewOrganization(
    user: AuthenticatedUser,
    organization: { ownerId: string },
  ): void {
    this.requirePermission(
      this.isAdmin(user) ||
        this.isOwner(user, organization.ownerId),
      'You do not have permission to access this organization',
    );
  }

  canUpdateOrganization(
    user: AuthenticatedUser,
    organization: { ownerId: string },
  ): void {
    this.requirePermission(
      this.isAdmin(user) ||
        this.isOwner(user, organization.ownerId),
      'You do not have permission to modify this organization',
    );
  }

  canDeleteOrganization(
    user: AuthenticatedUser,
    organization: { ownerId: string },
  ): void {
    this.requirePermission(
      this.isAdmin(user) ||
        this.isOwner(user, organization.ownerId),
      'You do not have permission to delete this organization',
    );
  }

  canViewWorkspace(
    user: AuthenticatedUser,
    workspace: { ownerId: string },
    memberRole?: WorkspaceRole,
  ): void {
    if (this.isAdmin(user)) {
      return;
    }

    if (workspace.ownerId === user.id) {
      return;
    }

    if (
      memberRole === WorkspaceRole.ADMIN ||
      memberRole === WorkspaceRole.MEMBER ||
      memberRole === WorkspaceRole.GUEST
    ) {
      return;
    }

    throw new ForbiddenException(
      'You do not have permission to access this workspace',
    );
  }

  canUpdateWorkspace(
    user: AuthenticatedUser,
    workspace: { ownerId: string },
  ): void {
    this.requirePermission(
      this.isAdmin(user) || this.isOwner(user, workspace.ownerId),
      'You do not have permission to modify this workspace',
    );
  }

  canDeleteWorkspace(
    user: AuthenticatedUser,
    workspace: { ownerId: string },
  ): void {
    this.requirePermission(
      this.isAdmin(user) || this.isOwner(user, workspace.ownerId),
      'You do not have permission to delete this workspace',
    );
  }

  canManageWorkspaceMembers(
    user: AuthenticatedUser,
    role: WorkspaceRole,
  ): void {
    if (this.isAdmin(user)) {
      return;
    }

    this.requirePermission(
      this.isWorkspaceAdmin(role),
      'You do not have permission to manage workspace members',
    );
  }

  canViewWorkspaceMembers(
    user: AuthenticatedUser,
    role: WorkspaceRole,
  ): void {
    if (this.isAdmin(user)) {
      return;
    }

    this.requirePermission(
      [
        WorkspaceRole.OWNER,
        WorkspaceRole.ADMIN,
        WorkspaceRole.MEMBER,
        WorkspaceRole.GUEST,
      ].includes(role),
      'You do not have permission to view workspace members',
    );
  }

  canTransferWorkspaceOwnership(
    user: AuthenticatedUser,
    role: WorkspaceRole,
  ): void {
    if (this.isAdmin(user)) {
      return;
    }

    this.requirePermission(
      role === WorkspaceRole.OWNER,
      'Only the workspace owner can transfer ownership',
    );
  }

  canLeaveWorkspace(
    user: AuthenticatedUser,
    role: WorkspaceRole,
  ): void {
    if (role === WorkspaceRole.OWNER) {
      throw new ForbiddenException(
        'Workspace owner cannot leave the workspace. Transfer ownership first',
      );
    }
  }

  private isAdmin(user: AuthenticatedUser): boolean {
    return user.role === UserRole.ADMIN;
  }

  private isOwner(
    user: AuthenticatedUser,
    ownerId: string,
  ): boolean {
    return user.id === ownerId;
  }

  private requirePermission(
    condition: boolean,
    message: string,
  ): void {
    if (!condition) {
      throw new ForbiddenException(message);
    }
  }

  isSystemAdmin(user: AuthenticatedUser): boolean {
    return this.isAdmin(user);
  }

  isWorkspaceAdmin(role: WorkspaceRole): boolean {
    return (
      role === WorkspaceRole.OWNER ||
      role === WorkspaceRole.ADMIN
    );
  }
}