import { ForbiddenException, Injectable } from "@nestjs/common";
import { ProjectRole, UserRole, WorkspaceRole } from "@prisma/client";
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

  canCreateProject(
    user: AuthenticatedUser,
    workspace: { ownerId: string },
    membership: { role: WorkspaceRole } | null,
  ): void {
    if (this.isAdmin(user)) {
      return;
    }

    if (this.isOwner(user, workspace.ownerId)) {
      return;
    }

    this.requirePermission(
      membership !== null &&
        this.isWorkspaceAdmin(membership.role),
      'You do not have permission to create projects in this workspace',
    );
  }

  canViewProject(
    user: AuthenticatedUser,
    project: { ownerId: string },
    membership: { role: WorkspaceRole } | null,
  ): void {
    if (this.isAdmin(user)) {
      return;
    }

    if (this.isOwner(user, project.ownerId)) {
      return;
    }

    this.requirePermission(
      membership !== null,
      'You do not have permission to view this project',
    );
  }

  canUpdateProject(
    user: AuthenticatedUser,
    project: { ownerId: string },
    membership: { role: WorkspaceRole } | null,
  ): void {
    if (this.isAdmin(user)) {
      return;
    }

    if (this.isOwner(user, project.ownerId)) {
      return;
    }

    this.requirePermission(
      membership !== null &&
        this.isWorkspaceAdmin(membership.role),
      'You do not have permission to modify this project',
    );
  }

  canDeleteProject(
    user: AuthenticatedUser,
    project: { ownerId: string },
    membership: { role: WorkspaceRole } | null,
  ): void {
    if (this.isAdmin(user)) {
      return;
    }

    if (this.isOwner(user, project.ownerId)) {
      return;
    }

    this.requirePermission(
      membership !== null &&
        membership.role === WorkspaceRole.OWNER,
      'Only the workspace owner can delete this project',
    );
  }

  canViewProjectMembers(
    user: AuthenticatedUser,
    project: {
      ownerId: string;
      members: {
        userId: string;
      }[];
    },
  ): void {
    const isProjectMember = project.members.some(
      member => member.userId === user.id,
    );

    this.requirePermission(
      this.isAdmin(user) ||
        project.ownerId === user.id ||
        isProjectMember,
      'You do not have permission to view project members',
    );
  }

  canManageProjectMembers(
    user: AuthenticatedUser,
    project: {
      ownerId: string;
      members: {
        userId: string;
        role: ProjectRole;
      }[];
    },
  ): void {
    const membership = project.members.find(
      member => member.userId === user.id,
    );

    const isProjectAdmin =
      membership?.role === ProjectRole.ADMIN;

    this.requirePermission(
      this.isAdmin(user) ||
        project.ownerId === user.id ||
        isProjectAdmin,
      'You do not have permission to manage project members',
    );
  }

  canLeaveProject(
    user: AuthenticatedUser,
    project: {
      ownerId: string;
    },
  ): void {
    this.requirePermission(
      this.isAdmin(user) ||
        project.ownerId !== user.id,
      'Project owner cannot leave the project',
    );
  }

  canViewIssue(
    user: AuthenticatedUser,
    project: {
      ownerId: string;
      members: {
        userId: string;
        role: ProjectRole;
      }[];
    },
  ): void {
    const isProjectMember = project.members.some(
      member => member.userId === user.id,
    );

    this.requirePermission(
      this.isAdmin(user) ||
        project.ownerId === user.id ||
        isProjectMember,
      'You do not have permission to view issues in this project',
    );
  }

  canCreateIssue(
    user: AuthenticatedUser,
    project: {
      ownerId: string;
      members: {
        userId: string;
        role: ProjectRole;
      }[];
    },
  ): void {
    const membership = project.members.find(
      member => member.userId === user.id,
    );

    this.requirePermission(
      this.isAdmin(user) ||
        project.ownerId === user.id ||
        membership !== undefined,
      'You do not have permission to create issues in this project',
    );
  }

  canUpdateIssue(
    user: AuthenticatedUser,
    project: {
      ownerId: string;
      members: {
        userId: string;
        role: ProjectRole;
      }[];
    },
    issue: {
      reporterId: string;
      assigneeId: string | null;
    },
  ): void {
    const membership = project.members.find(
      member => member.userId === user.id,
    );

    this.requirePermission(
      this.isAdmin(user) ||
        project.ownerId === user.id ||
        membership?.role === ProjectRole.ADMIN ||
        issue.reporterId === user.id ||
        issue.assigneeId === user.id,
      'You do not have permission to update this issue',
    );
  }

  canDeleteIssue(
    user: AuthenticatedUser,
    project: {
      ownerId: string;
      members: {
        userId: string;
        role: ProjectRole;
      }[];
    },
    issue: {
      reporterId: string;
    },
  ): void {
    const membership = project.members.find(
      member => member.userId === user.id,
    );

    this.requirePermission(
      this.isAdmin(user) ||
        project.ownerId === user.id ||
        membership?.role === ProjectRole.ADMIN ||
        issue.reporterId === user.id,
      'You do not have permission to delete this issue',
    );
  }

  canViewComment(
    user: AuthenticatedUser,
    project: {
      ownerId: string;
      members: {
        userId: string;
      }[];
    },
  ): void {
    const isProjectMember = project.members.some(
      (member) => member.userId === user.id,
    );

    this.requirePermission(
      this.isAdmin(user) ||
        this.isOwner(user, project.ownerId) ||
        isProjectMember,
      'You do not have permission to view this comment',
    );
  }

  canCreateComment(
    user: AuthenticatedUser,
    project: {
      ownerId: string;
      members: {
        userId: string;
      }[];
    },
  ): void {
    const isProjectMember = project.members.some(
      (member) => member.userId === user.id,
    );

    this.requirePermission(
      this.isAdmin(user) ||
        this.isOwner(user, project.ownerId) ||
        isProjectMember,
      'You do not have permission to create a comment',
    );
  }

  canUpdateComment(
    user: AuthenticatedUser,
    comment: {
      authorId: string;
    },
  ): void {
    this.requirePermission(
      comment.authorId === user.id,
      'Only the comment author can update this comment',
    );
  }

  canDeleteComment(
    user: AuthenticatedUser,
    project: {
      ownerId: string;
      members: {
        userId: string;
        role: ProjectRole;
      }[];
    },
    comment: {
      authorId: string;
    },
  ): void {
    const membership = project.members.find(
      (member) => member.userId === user.id,
    );

    const canManage =
      membership?.role === ProjectRole.ADMIN;

    this.requirePermission(
      this.isAdmin(user) ||
        this.isOwner(user, project.ownerId) ||
        comment.authorId === user.id ||
        canManage,
      'You do not have permission to delete this comment',
    );
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