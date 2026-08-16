import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from '../dto';
import { AuthorizationService } from 'src/common/services';
import { AuthenticatedUser } from 'src/common/interfaces';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly authorizationService: AuthorizationService,
  ) { }

  async findAll() {
    return await this.prismaService.user.findMany({
      include: {
        profile: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, currentUser: AuthenticatedUser) {
    this.authorizationService.canViewUser(
      currentUser,
      id,
    );

    const user = await this.prismaService.user.findUnique({
      where: {
        id,
      },
    });

    if(!user) {
      throw new NotFoundException(`User with ${id} not found`);
    }

    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUser: AuthenticatedUser,
  ) {
    this.authorizationService.canUpdateUser(
      currentUser,
      id,
    );

    const existingUser =
      await this.prismaService.user.findUnique({
        where: {
          id,
        },
        include: {
          profile: true,
        },
      });

    if (!existingUser) {
      throw new NotFoundException(
        `User with id "${id}" not found`,
      );
    }

    const { email, profile } = updateUserDto;

    if (email && email !== existingUser.email) {
      const emailTaken =
        await this.prismaService.user.findUnique({
          where: {
            email,
          },
        });

      if (emailTaken) {
        throw new ConflictException(
          'User with this email already exists',
        );
      }
    }

    const user = await this.prismaService.user.update({
      where: {
        id,
      },
      data: {
        ...(email !== undefined && {
          email,
        }),

        ...(profile && {
          profile: {
            upsert: {
              create: {
                firstName: profile.firstName ?? '',
                lastName: profile.lastName ?? '',
                displayName: profile.displayName ?? '',
                avatarUrl: profile.avatarUrl,
                jobTitle: profile.jobTitle,
                bio: profile.bio,
                timezone: profile.timezone ?? 'UTC',
                language: profile.language ?? 'en',
              },

              update: {
                ...(profile.firstName !== undefined && {
                  firstName: profile.firstName,
                }),

                ...(profile.lastName !== undefined && {
                  lastName: profile.lastName,
                }),

                ...(profile.displayName !== undefined && {
                  displayName: profile.displayName,
                }),

                ...(profile.avatarUrl !== undefined && {
                  avatarUrl: profile.avatarUrl,
                }),

                ...(profile.jobTitle !== undefined && {
                  jobTitle: profile.jobTitle,
                }),

                ...(profile.bio !== undefined && {
                  bio: profile.bio,
                }),

                ...(profile.timezone !== undefined && {
                  timezone: profile.timezone,
                }),

                ...(profile.language !== undefined && {
                  language: profile.language,
                }),
              },
            },
          },
        }),
      },
      include: {
        profile: true,
      },
    });

    return user;
  }

  async remove(id: string, currentUser: AuthenticatedUser) {
    this.authorizationService.canDeleteUser(
      currentUser,
      id,
    );

    const user = await this.prismaService.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    await this.prismaService.user.delete({
      where: {
        id,
      },
    });

    return {
      message: `User ${id} deleted successfully`,
    };
  }
}
