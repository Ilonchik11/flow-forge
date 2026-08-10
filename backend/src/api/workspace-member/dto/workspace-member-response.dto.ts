import { ApiProperty } from '@nestjs/swagger';
import { UserStatus, WorkspaceRole } from '@prisma/client';

export class WorkspaceMemberUserResponseDto {
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
    enum: UserStatus,
    example: UserStatus.ACTIVE,
    description: 'Current user account status',
  })
  status!: UserStatus;

  @ApiProperty({
    example: true,
    description: 'Whether the user has verified their email address',
  })
  isEmailVerified!: boolean;

  @ApiProperty({
    type: () => WorkspaceMemberUserProfileResponseDto,
    nullable: true,
    description: 'User profile information',
  })
  profile!: WorkspaceMemberUserProfileResponseDto | null;
}

export class WorkspaceMemberUserProfileResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique profile identifier',
  })
  id!: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  firstName!: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
  })
  lastName!: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'User display name',
  })
  displayName!: string;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'URL of the user avatar',
    nullable: true,
  })
  avatarUrl!: string | null;

  @ApiProperty({
    example: 'Backend Developer',
    description: 'User job title',
    nullable: true,
  })
  jobTitle!: string | null;
}

export class WorkspaceMemberResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique workspace membership identifier',
  })
  id!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the user',
  })
  userId!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the workspace',
  })
  workspaceId!: string;

  @ApiProperty({
    enum: WorkspaceRole,
    example: WorkspaceRole.MEMBER,
    description: 'Role of the user within the workspace',
  })
  role!: WorkspaceRole;

  @ApiProperty({
    example: '2026-08-10T12:00:00.000Z',
    description: 'Date when the user joined the workspace',
  })
  joinedAt!: Date;

  @ApiProperty({
    type: () => WorkspaceMemberUserResponseDto,
    description: 'User associated with this workspace membership',
  })
  user!: WorkspaceMemberUserResponseDto;
}