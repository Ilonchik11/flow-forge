import { ApiProperty } from '@nestjs/swagger';
import { UserProfileResponseDto } from './user-profile-response.dto';
import { UserStatus } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique user identifier',
  })
  id!: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  email!: string;

  @ApiProperty({
    example: true,
    description: 'Whether the user has verified their email address',
  })
  isEmailVerified!: boolean;

  @ApiProperty({
    enum: UserStatus,
    example: UserStatus.ACTIVE,
    description: 'Current user account status',
  })
  status!: UserStatus;

  @ApiProperty({
    example: '2026-08-09T10:30:00.000Z',
    description: 'Date and time of the user last login',
    nullable: true,
  })
  lastLoginAt!: Date | null;

  @ApiProperty({
    type: () => UserProfileResponseDto,
    nullable: true,
    description: 'User profile information',
  })
  profile!: UserProfileResponseDto | null;

  @ApiProperty({
    example: '2026-08-01T12:00:00.000Z',
    description: 'Date and time when the user was created',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2026-08-09T10:30:00.000Z',
    description: 'Date and time when the user was last updated',
  })
  updatedAt!: Date;
}