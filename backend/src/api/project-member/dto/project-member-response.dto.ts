import { ApiProperty } from '@nestjs/swagger';
import { ProjectRole, UserStatus } from '@prisma/client';

export class ProjectMemberUserProfileDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    example: 'John',
  })
  firstName!: string;

  @ApiProperty({
    example: 'Doe',
  })
  lastName!: string;

  @ApiProperty({
    example: 'John Doe',
  })
  displayName!: string;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  avatarUrl!: string | null;

  @ApiProperty({
    example: 'Backend Developer',
    nullable: true,
  })
  jobTitle!: string | null;
}

export class ProjectMemberUserDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    example: 'john@example.com',
  })
  email!: string;

  @ApiProperty({
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @ApiProperty({
    example: true,
  })
  isEmailVerified!: boolean;

  @ApiProperty({
    type: () => ProjectMemberUserProfileDto,
    nullable: true,
  })
  profile!: ProjectMemberUserProfileDto | null;
}

export class ProjectMemberResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  projectId!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  userId!: string;

  @ApiProperty({
    enum: ProjectRole,
    example: ProjectRole.MEMBER,
  })
  role!: ProjectRole;

  @ApiProperty({
    example: '2026-08-11T12:00:00.000Z',
  })
  joinedAt!: Date;

  @ApiProperty({
    type: () => ProjectMemberUserDto,
  })
  user!: ProjectMemberUserDto;
}