import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateWorkspaceDto {
  @ApiPropertyOptional({
    example: 'Backend Engineering',
    description: 'Workspace name',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString({
    message: 'The name must be a string',
  })
  @MinLength(1, {
    message: 'The name must contain at least 1 character',
  })
  @MaxLength(100, {
    message: 'The name must not exceed 100 characters',
  })
  name?: string;

  @ApiPropertyOptional({
    example: 'backend-engineering',
    description: 'Workspace slug',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString({
    message: 'The slug must be a string',
  })
  @MinLength(1, {
    message: 'The slug must contain at least 1 character',
  })
  @MaxLength(100, {
    message: 'The slug must not exceed 100 characters',
  })
  slug?: string;

  @ApiPropertyOptional({
    example: 'Backend engineering team workspace',
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
}