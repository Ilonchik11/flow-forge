import { ApiProperty } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';

export class ProjectResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique project identifier',
  })
  id!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the workspace containing the project',
  })
  workspaceId!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the project owner',
  })
  ownerId!: string;

  @ApiProperty({
    example: 'Flow Forge Backend',
    description: 'Project name',
  })
  name!: string;

  @ApiProperty({
    example: 'FF',
    description: 'Unique project key within the workspace',
  })
  key!: string;

  @ApiProperty({
    example: 'Backend API for Flow Forge',
    description: 'Project description',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    example: 'https://example.com/project-avatar.jpg',
    description: 'Project avatar URL',
    nullable: true,
  })
  avatarUrl!: string | null;

  @ApiProperty({
    enum: ProjectStatus,
    example: ProjectStatus.ACTIVE,
    description: 'Current project status',
  })
  status!: ProjectStatus;

  @ApiProperty({
    example: '2026-08-10T12:00:00.000Z',
    description: 'Date when the project was created',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2026-08-10T12:00:00.000Z',
    description: 'Date when the project was last updated',
  })
  updatedAt!: Date;
}