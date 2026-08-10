import { ForbiddenException, Injectable } from "@nestjs/common";
import { UserRole } from "@prisma/client";
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
}