import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, WorkspaceRole } from '@prisma/client';
import { AuthenticatedUser } from 'src/common/interfaces';
import { AuthorizationService } from 'src/common/services';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { NotificationService } from '../../notification/services/notification.service';
import { CreateWorkspaceMemberDto, UpdateWorkspaceMemberDto } from '../dto';

@Injectable()
export class WorkspaceMemberService {

    constructor(
        private readonly prismaService: PrismaService,
        private readonly authorizationService: AuthorizationService,
        private readonly notificationService: NotificationService,
    ) {}

    async findAll(
        workspaceId: string,
        currentUser: AuthenticatedUser,
    ) {
        const membership = await this.getCurrentUserMembership(workspaceId, currentUser.id);

        this.authorizationService.canViewWorkspaceMembers(
            currentUser,
            membership.role,
        );

        return this.prismaService.workspaceMember.findMany({
            where: {
                workspaceId,
            },
            select: {
                id: true,
                userId: true,
                workspaceId: true,
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
        workspaceId: string,
        memberId: string,
        currentUser: AuthenticatedUser,
    ) {
        const currentMembership = await this.getCurrentUserMembership(workspaceId, currentUser.id);

        this.authorizationService.canViewWorkspaceMembers(currentUser, currentMembership.role);

        const member = await this.prismaService.workspaceMember.findFirst({
            where: {
                id: memberId,
                workspaceId,
            },
            select: {
                id: true,
                userId: true,
                workspaceId: true,
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
            throw new NotFoundException('Workspace member not found');
        }

        return member;
    }

    async create(
        workspaceId: string,
        dto: CreateWorkspaceMemberDto,
        currentUser: AuthenticatedUser,
    ) {
        const currentMembership = await this.getCurrentUserMembership(workspaceId, currentUser.id);

        this.authorizationService.canManageWorkspaceMembers(currentUser, currentMembership.role);

        const user = await this.prismaService.user.findUnique({
            where: {
                id: dto.userId,
            },
        });

        if(!user) {
            throw new NotFoundException('User not found');
        }

        const workspace = await this.getWorkspace(workspaceId);

        const existingMember = await this.prismaService.workspaceMember.findUnique({
            where: {
                userId_workspaceId: {
                    userId: dto.userId,
                    workspaceId,
                },
            },
        });

        if(existingMember) {
            throw new ConflictException('User is already a member of this workspace');
        }

        return this.prismaService.$transaction(async (tx) => {
            const existingMembers = await tx.workspaceMember.findMany({
                where: {
                    workspaceId,
                },
                select: {
                    userId: true,
                },
            });

            const member = await tx.workspaceMember.create({
                data: {
                    userId: dto.userId,
                    workspaceId,
                    role: WorkspaceRole.MEMBER,
                },
                select: {
                    id: true,
                    userId: true,
                    workspaceId: true,
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

            await this.notificationService.createTx(tx,
                {
                    userId: dto.userId,
                    type: NotificationType.WORKSPACE_MEMBER_ADDED,
                    title: 'Added to workspace',
                    message: `You were added to workspace "${workspace.name}"`,
                }
            );

            await this.notificationService.notifyUsersTx(
                tx,
                existingMembers
                    .filter(
                        (member) => member.userId !== currentUser.id,
                    )
                    .map((member) => member.userId),
                NotificationType.WORKSPACE_MEMBER_ADDED,
                'New workspace member',
                `${user.email} was added to the workspace "${workspace.name}"`,
            );

            return member;
        });
    }

    async update(
        workspaceId: string,
        memberId: string,
        dto: UpdateWorkspaceMemberDto,
        currentUser: AuthenticatedUser,
    ) {
        const currentMembership = await this.getCurrentUserMembership(workspaceId, currentUser.id);

        this.authorizationService.canManageWorkspaceMembers(currentUser, currentMembership.role);

        const member = await this.prismaService.workspaceMember.findFirst({
            where: {
                id: memberId,
                workspaceId,
            },
        });

        if(!member) {
            throw new NotFoundException('Workspace member not found');
        }

        if(member.role === WorkspaceRole.OWNER) {
            throw new ForbiddenException('Workspace owner role cannot be changed');
        }

        if(dto.role === WorkspaceRole.OWNER) {
            throw new ForbiddenException('Workspace ownership cannot be changed through this endpoint');
        }

        const workspace = await this.getWorkspace(workspaceId);

        return this.prismaService.$transaction(async (tx) => {
            const updatedMember = await tx.workspaceMember.update({
                where: {
                    id: member.id,
                },
                data: {
                    role: dto.role,
                },
                select: {
                    id: true,
                    userId: true,
                    workspaceId: true,
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

            await this.notificationService.createTx(tx, 
                {
                    userId: member.userId,
                    type: NotificationType.WORKSPACE_MEMBER_ROLE_CHANGED,
                    title: 'Workspace role changed',
                    message: `Your role in workspace "${workspace.name}" was changed from ${member.role} to ${dto.role}`,
                }
            );

            return updatedMember;
        });
    }

    async remove(
        workspaceId: string,
        memberId: string,
        currentUser: AuthenticatedUser,
    ) {
        const currentMembership = await this.getCurrentUserMembership(workspaceId, currentUser.id);

        this.authorizationService.canManageWorkspaceMembers(currentUser, currentMembership.role);

        const member = await this.prismaService.workspaceMember.findFirst({
            where: {
                id: memberId,
                workspaceId,
            },
        });

        if(!member) {
            throw new NotFoundException('Workspace member not found');
        }

        if(member.role === WorkspaceRole.OWNER){
            throw new ForbiddenException('Workspace owner cannot be removed');
        }

        const workspace = await this.getWorkspace(workspaceId);

        return this.prismaService.$transaction(async (tx) => {
            await tx.workspaceMember.delete({
                where: {
                    id: member.id,
                },
            });

            await this.notificationService.createTx(
                tx,
                {
                    userId: member.userId,
                    type: NotificationType.WORKSPACE_MEMBER_REMOVED,
                    title: 'Removed from workspace',
                    message: `You were removed from workspace "${workspace.name}"`,
                }
            );
        });
    }

    async leave(
        workspaceId: string,
        currentUser: AuthenticatedUser,
    ) {
        const membership = await this.getCurrentUserMembership(workspaceId, currentUser.id);

        this.authorizationService.canLeaveWorkspace(currentUser, membership.role);

        const workspace = await this.getWorkspace(workspaceId);

        return this.prismaService.$transaction(async (tx) => {
            const remainingMembers = await tx.workspaceMember.findMany({
                where: {
                    workspaceId,
                    userId: {
                        not: currentUser.id,
                    },
                },
                select: {
                    userId: true,
                },
            });

            await tx.workspaceMember.delete({
                where: {
                    id: membership.id,
                },
            });

            await this.notificationService.notifyUsersTx(
                tx,
                remainingMembers.map(
                    (member) => member.userId,
                ),
                NotificationType.WORKSPACE_MEMBER_LEFT,
                'Workspace member left',
                `${currentUser.email} left workspace "${workspace.name}"`,
            );
        });
    }

    private async getWorkspace(id: string) {
        const workspace = await this.prismaService.workspace.findUnique({
            where: {
                id,
            },
            select: {
                name: true,
            },
        });

        if (!workspace) {
            throw new NotFoundException('Workspace not found');
        }

        return workspace;
    }

    private async getCurrentUserMembership(
        workspaceId: string,
        userId: string,
    ) {
        const membership = await this.prismaService.workspaceMember.findUnique({
            where: {
                userId_workspaceId: {
                    userId,
                    workspaceId,
                },
            },
        });

        if (!membership) {
            throw new ForbiddenException('You are not a member of this workspace');
        }

        return membership;
    }
}