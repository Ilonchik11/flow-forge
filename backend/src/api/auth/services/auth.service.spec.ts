import {
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { Request, Response } from 'express';
import { cookieExpires, isDev } from 'src/common/utils';

import { UserStatus } from '@prisma/client';

import { AuthService } from './auth.service';
import { PrismaService } from 'src/infra/prisma/prisma.service';

jest.mock('argon2', () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

jest.mock('src/common/utils', () => ({
  cookieExpires: jest.fn(),
  isDev: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const prismaService = {
    user: {
      findUnique: jest.fn<() => Promise<any>>(),
      create: jest.fn<() => Promise<any>>(),
    },
  };

  const configService = {
    getOrThrow: jest.fn() as jest.Mock,
  };

  const jwtService = {
    sign: jest.fn<() => string>(),
    verifyAsync: jest.fn<(token: string) => Promise<any>>(),
  };

  const response = {
    cookie: jest.fn<() => Promise<any>>(),
  } as unknown as Response;

  const request = {
    cookies: {},
  } as unknown as Request;

  const user = {
    id: 'user-1',
    email: 'john@example.com',
    passwordHash: 'hashed-password',
    role: 'USER',
    status: UserStatus.ACTIVE,
  };

  const userWithProfile = {
    ...user,
    profile: {
      id: 'profile-1',
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'John Doe',
      avatarUrl: '',
      jobTitle: 'Developer',
      bio: '',
      timezone: '',
      language: '',
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    (configService.getOrThrow as jest.Mock).mockImplementation((key: unknown) => {
      const configKey = String(key);

      switch (configKey) {
        case 'JWT_ACCESS_TOKEN_TTL':
          return '15m';

        case 'JWT_REFRESH_TOKEN_TTL':
          return '7d';

        case 'COOKIE_DOMAIN':
          return 'localhost';

        default:
          return undefined;
      }
    });

    (isDev as jest.Mock).mockReturnValue(true);

    (cookieExpires as jest.Mock).mockReturnValue(
      new Date('2026-08-23T00:00:00.000Z'),
    );

    (argon2.hash as jest.Mock).mockImplementation(
      async () => 'hashed-password',
    );

    (argon2.verify as jest.Mock).mockImplementation(
      async () => true,
    );

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: PrismaService,
            useValue: prismaService,
          },
          {
            provide: ConfigService,
            useValue: configService,
          },
          {
            provide: JwtService,
            useValue: jwtService,
          },
        ],
      }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    const dto = {
      email: 'john@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'John Doe',
      avatarUrl: 'avatar.jpg',
      jobTitle: 'Developer',
      bio: 'Backend developer',
      timezone: 'Europe/Kyiv',
      language: 'en',
    };

    it('should register a new user', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      (argon2.hash as jest.Mock).mockImplementation(
        async () => 'hashed-password',
      );

      prismaService.user.create.mockResolvedValue(
        userWithProfile,
      );

      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.register(
        response,
        dto,
      );

      expect(result).toEqual({
        accessToken: 'access-token',
      });

      expect(
        prismaService.user.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          email: dto.email,
        },
      });

      expect(argon2.hash).toHaveBeenCalledWith(
        dto.password,
      );

      expect(
        prismaService.user.create,
      ).toHaveBeenCalledWith({
        data: {
          email: dto.email,
          passwordHash: 'hashed-password',
          profile: {
            create: {
              firstName: dto.firstName,
              lastName: dto.lastName,
              displayName: dto.displayName,
              avatarUrl: dto.avatarUrl,
              jobTitle: dto.jobTitle,
              bio: dto.bio,
              timezone: dto.timezone,
              language: dto.language,
            },
          },
        },
        include: {
          profile: true,
        },
      });

      expect(jwtService.sign).toHaveBeenCalledTimes(2);

      expect(response.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh-token',
        expect.objectContaining({
          httpOnly: true,
          domain: 'localhost',
          expires: expect.any(Date),
          secure: false,
          sameSite: 'lax',
        }),
      );
    });

    it('should use empty strings for optional profile fields', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      (argon2.hash as jest.Mock).mockImplementation(
        async () => 'hashed-password',
      );

      prismaService.user.create.mockResolvedValue(
        userWithProfile,
      );

      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      await service.register(response, {
        email: dto.email,
        password: dto.password,
      });

      expect(
        prismaService.user.create,
      ).toHaveBeenCalledWith({
        data: {
          email: dto.email,
          passwordHash: 'hashed-password',
          profile: {
            create: {
              firstName: '',
              lastName: '',
              displayName: '',
              avatarUrl: '',
              jobTitle: '',
              bio: '',
              timezone: '',
              language: '',
            },
          },
        },
        include: {
          profile: true,
        },
      });
    });

    it('should throw ConflictException when user already exists', async () => {
      prismaService.user.findUnique.mockResolvedValue(
        user,
      );

      await expect(
        service.register(response, dto),
      ).rejects.toThrow(
        new ConflictException(
          'User with this email already exists',
        ),
      );

      expect(argon2.hash).not.toHaveBeenCalled();

      expect(
        prismaService.user.create,
      ).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const dto = {
      email: 'john@example.com',
      password: 'password123',
    };

    it('should login a user with valid credentials', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: user.id,
        email: user.email,
        role: user.role,
        passwordHash: user.passwordHash,
      });

      (argon2.hash as jest.Mock).mockImplementation(
        async () => true,
      );

      jwtService.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await service.login(
        response,
        dto,
      );

      expect(result).toEqual({
        accessToken: 'access-token',
      });

      expect(
        prismaService.user.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          email: dto.email,
        },
        select: {
          id: true,
          email: true,
          role: true,
          passwordHash: true,
        },
      });

      expect(argon2.verify).toHaveBeenCalledWith(
        user.passwordHash,
        dto.password,
      );

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.login(response, dto),
      ).rejects.toThrow(
        new NotFoundException('User not found'),
      );

      expect(argon2.verify).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when password is invalid', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: user.id,
        email: user.email,
        role: user.role,
        passwordHash: user.passwordHash,
      });

      (argon2.verify as jest.Mock).mockImplementation(
        async () => false,
      );

      await expect(
        service.login(response, dto),
      ).rejects.toThrow(
        new NotFoundException('User not found'),
      );

      expect(argon2.verify).toHaveBeenCalledWith(
        user.passwordHash,
        dto.password,
      );

      expect(jwtService.sign).not.toHaveBeenCalled();
      expect(response.cookie).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should refresh tokens using the refresh token cookie', async () => {
      const req = {
        cookies: {
          refreshToken: 'old-refresh-token',
        },
      } as unknown as Request;

      jwtService.verifyAsync.mockResolvedValue({
        id: 'user-1',
      });

      prismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'john@example.com',
        role: 'USER',
      });

      jwtService.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      const result = await service.refresh(
        req,
        response,
      );

      expect(
        jwtService.verifyAsync,
      ).toHaveBeenCalledWith(
        'old-refresh-token',
      );

      expect(
        prismaService.user.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          id: 'user-1',
        },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      expect(result).toEqual({
        accessToken: 'new-access-token',
      });

      expect(response.cookie).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when refresh token is missing', async () => {
      const req = {
        cookies: {},
      } as unknown as Request;

      await expect(
        service.refresh(req, response),
      ).rejects.toThrow(
        new UnauthorizedException(
          'Invalid refresh token',
        ),
      );

      expect(
        jwtService.verifyAsync,
      ).not.toHaveBeenCalled();

      expect(
        prismaService.user.findUnique,
      ).not.toHaveBeenCalled();
    });

    it('should propagate invalid refresh token errors', async () => {
      const req = {
        cookies: {
          refreshToken: 'invalid-token',
        },
      } as unknown as Request;

      jwtService.verifyAsync.mockRejectedValue(
        new UnauthorizedException(
          'Invalid refresh token',
        ),
      );

      await expect(
        service.refresh(req, response),
      ).rejects.toThrow(
        'Invalid refresh token',
      );

      expect(
        prismaService.user.findUnique,
      ).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when refresh token user does not exist', async () => {
      const req = {
        cookies: {
          refreshToken: 'refresh-token',
        },
      } as unknown as Request;

      jwtService.verifyAsync.mockResolvedValue({
        id: 'user-1',
      });

      prismaService.user.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.refresh(req, response),
      ).rejects.toThrow(
        new NotFoundException('User not found'),
      );

      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should clear the refresh token cookie', async () => {
      await service.logout(response);

      expect(response.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refreshToken',
        expect.objectContaining({
          httpOnly: true,
          domain: 'localhost',
          expires: new Date(0),
          secure: false,
          sameSite: 'lax',
        }),
      );
    });
  });

  describe('validate', () => {
    it('should return the user when user is active', async () => {
      prismaService.user.findUnique.mockResolvedValue(
        user,
      );

      const result = await service.validate(
        'user-1',
      );

      expect(result).toEqual(user);

      expect(
        prismaService.user.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          id: 'user-1',
        },
      });
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.validate('user-1'),
      ).rejects.toThrow(
        new UnauthorizedException(
          'Invalid authentication credentials',
        ),
      );
    });

    it('should throw ForbiddenException when user is not active', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...user,
        status: UserStatus.INACTIVE,
      });

      await expect(
        service.validate('user-1'),
      ).rejects.toThrow(
        new ForbiddenException(
          'User account is not active',
        ),
      );
    });
  });
});