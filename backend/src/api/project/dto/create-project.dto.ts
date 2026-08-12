import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    example: 'Flow Forge Backend',
    description: 'Project name',
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
    example: 'FF',
    description:
      'Unique project key within the workspace. Usually 2–10 uppercase characters.',
    minLength: 2,
    maxLength: 10,
  })
  @IsString({
    message: 'The key must be a string',
  })
  @IsNotEmpty({
    message: 'The key is required',
  })
  @MinLength(2, {
    message: 'The key must contain at least 2 characters',
  })
  @MaxLength(10, {
    message: 'The key must not exceed 10 characters',
  })
  key!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the workspace containing the project',
  })
  @IsString({
    message: 'The workspaceId must be a string',
  })
  @IsNotEmpty({
    message: 'The workspaceId is required',
  })
  workspaceId!: string;

  @ApiPropertyOptional({
    example: 'Backend API for the Flow Forge project management platform.',
    description: 'Project description',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString({
    message: 'The description must be a string',
  })
  @MaxLength(2000, {
    message: 'The description must not exceed 2000 characters',
  })
  description?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/project-avatar.jpg',
    description: 'URL of the project avatar',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({
    message: 'The avatarUrl must be a string',
  })
  @MaxLength(255, {
    message: 'The avatarUrl must not exceed 255 characters',
  })
  avatarUrl?: string;
}