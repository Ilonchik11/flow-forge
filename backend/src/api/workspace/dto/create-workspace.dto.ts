import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateWorkspaceDto {
  @ApiProperty({
    example: 'Backend Team',
    description: 'Workspace name',
    minLength: 1,
    maxLength: 150,
  })
  @IsString({
    message: 'The name must be a string',
  })
  @IsNotEmpty({
    message: 'The name is required',
  })
  @MinLength(1, {
    message: 'The name must contain at least 1 character',
  })
  @MaxLength(150, {
    message: 'The name must not exceed 150 characters',
  })
  name!: string;

  @ApiProperty({
    example: 'backend-team',
    description: 'Unique workspace slug within the organization',
    minLength: 1,
    maxLength: 100,
  })
  @IsString({
    message: 'The slug must be a string',
  })
  @IsNotEmpty({
    message: 'The slug is required',
  })
  @MinLength(1, {
    message: 'The slug must contain at least 1 character',
  })
  @MaxLength(100, {
    message: 'The slug must not exceed 100 characters',
  })
  slug!: string;

  @ApiPropertyOptional({
    example: 'Workspace for the backend development team',
    description: 'Workspace description',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({
    message: 'The description must be a string',
  })
  @MaxLength(1000, {
    message: 'The description must not exceed 1000 characters',
  })
  description?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Organization that owns the workspace',
  })
  @IsString({
    message: 'The organizationId must be a string',
  })
  @IsNotEmpty({
    message: 'The organizationId is required',
  })
  organizationId!: string;
}