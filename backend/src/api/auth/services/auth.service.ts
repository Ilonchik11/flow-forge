import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { Request, Response } from 'express';
import type { StringValue } from 'ms';
import { JwtPayload } from 'src/common/interfaces';
import { cookieExpires, isDev } from 'src/common/utils';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { LoginRequest, RegisterRequest } from '../dto';
import { User, UserStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly JWT_ACCESS_TOKEN_TTL: StringValue;
  private readonly JWT_REFRESH_TOKEN_TTL: StringValue;

  private readonly COOKIE_DOMAIN: string;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.JWT_ACCESS_TOKEN_TTL = this.configService.getOrThrow<StringValue>(
      'JWT_ACCESS_TOKEN_TTL'
    );
    this.JWT_REFRESH_TOKEN_TTL = this.configService.getOrThrow<StringValue>(
      'JWT_REFRESH_TOKEN_TTL'
    );
    this.COOKIE_DOMAIN = this.configService.getOrThrow<StringValue>(
      'COOKIE_DOMAIN'
    );
  }

  async register(response: Response, dto: RegisterRequest) {
    const {
      email,
      password,
      firstName,
      lastName,
      displayName,
      avatarUrl,
      jobTitle,
      bio,
      timezone,
      language,
    } = dto;

    const existingUser = await this.prismaService.user.findUnique({
      where: {
        email,
      },
    });

    if(existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await argon2.hash(password);
    
    const user = await this.prismaService.user.create({
      data: {
        email,
        passwordHash,
        profile: {
          create: {
            firstName: firstName ?? '',
            lastName: lastName ?? '',
            displayName: displayName ?? '',
            avatarUrl: avatarUrl ?? '',
            jobTitle: jobTitle ?? '',
            bio: bio ?? '',
            timezone: timezone ?? '',
            language: language ?? '',
          },
        },
      },
      include: {
        profile: true,
      }
    });

    return this.auth(response, user.id);
  }

  async login(response: Response, dto: LoginRequest) {
    const { email, password } = dto;

    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
        role: true,
        passwordHash: true,
      },
    });

    if(!user) {
      throw new NotFoundException('User not found');
    }

    const isValidPassword = await argon2.verify(user.passwordHash, password);

    if(!isValidPassword) {
      throw new NotFoundException('User not found');
    }

    return this.auth(response, user.id);
  }

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies['refreshToken'];

    if(!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const payload: JwtPayload = await this.jwtService.verifyAsync(refreshToken);

    if(payload) {
      const user = await this.prismaService.user.findUnique({
        where: {
          id: payload.id,
        },
        select: {
          id: true,
          email: true,
          role: true,
        }
      });

      if(!user) {
        throw new NotFoundException('User not found');
      }

      return this.auth(res, user.id);
    }
  }

  async logout(res: Response) {
    this.setCookie(res, 'refreshToken', new Date(0));
  }

  async validate(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid authentication credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('User account is not active');
    }

    return user;
  }

  private auth(res: Response, id: string) {
    const { accessToken, refreshToken } = this.generateTokens(id);

    this.setCookie(
      res, 
      refreshToken,
      cookieExpires(this.JWT_REFRESH_TOKEN_TTL),
    );

    return { accessToken };
  }

  private generateTokens(id: string) {
    const payload: JwtPayload = { id };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.JWT_ACCESS_TOKEN_TTL,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.JWT_REFRESH_TOKEN_TTL,
    });

    return {
      accessToken, 
      refreshToken,
    };
  }

  private setCookie(res: Response, value: string, expires: Date) {
    res.cookie('refreshToken', value, {
      httpOnly: true,
      domain: this.COOKIE_DOMAIN,
      expires,
      secure: !isDev(this.configService),
      sameSite: !isDev(this.configService) ? 'none' : 'lax',
    });
  }
}
