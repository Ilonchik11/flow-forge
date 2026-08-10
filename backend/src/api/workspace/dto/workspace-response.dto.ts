import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

export class WorkspaceResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique workspace identifier',
  })
  id!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the organization containing the workspace',
  })
  organizationId!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the workspace owner',
  })
  ownerId!: string;

  @ApiProperty({
    example: 'Backend Team',
    description: 'Workspace name',
  })
  name!: string;

  @ApiProperty({
    example: 'backend-team',
    description: 'Workspace slug',
  })
  slug!: string;

  @ApiPropertyOptional({
    example: 'Workspace for the backend development team',
    description: 'Workspace description',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    example: '2026-08-10T12:00:00.000Z',
    description: 'Date and time when the workspace was created',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2026-08-10T12:00:00.000Z',
    description: 'Date and time when the workspace was last updated',
  })
  updatedAt!: Date;
}