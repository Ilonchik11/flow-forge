import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthenticatedUser } from 'src/common/interfaces';
import { AuthorizationService } from 'src/common/services';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { CreateWorkspaceMemberDto, UpdateWorkspaceMemberDto } from './dto';
import { WorkspaceRole } from '@prisma/client';

@Injectable()
export class WorkspaceMemberService {

    constructor(
        private readonly prismaService: PrismaService,
        private readonly authorizationService: AuthorizationService,
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

        return this.prismaService.workspaceMember.create({
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

        return this.prismaService.workspaceMember.update({
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

        await this.prismaService.workspaceMember.delete({
            where: {
                id: member.id,
            },
        });
    }

    async leave(
        workspaceId: string,
        currentUser: AuthenticatedUser,
    ) {
        const membership = await this.getCurrentUserMembership(workspaceId, currentUser.id);

        this.authorizationService.canLeaveWorkspace(currentUser, membership.role);

        await this.prismaService.workspaceMember.delete({
            where: {
                id: membership.id,
            },
        });
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