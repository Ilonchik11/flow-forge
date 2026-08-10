import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserProfileDto {
  @ApiPropertyOptional({
    example: 'John',
    description: 'User first name',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString({
    message: 'The firstName must be a string',
  })
  @MinLength(1, {
    message: 'The firstName must contain at least 1 character',
  })
  @MaxLength(100, {
    message: 'The firstName must not exceed 100 characters',
  })
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Doe',
    description: 'User last name',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString({
    message: 'The lastName must be a string',
  })
  @MinLength(1, {
    message: 'The lastName must contain at least 1 character',
  })
  @MaxLength(100, {
    message: 'The lastName must not exceed 100 characters',
  })
  lastName?: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'User display name',
    minLength: 1,
    maxLength: 150,
  })
  @IsOptional()
  @IsString({
    message: 'The displayName must be a string',
  })
  @MinLength(1, {
    message: 'The displayName must contain at least 1 character',
  })
  @MaxLength(150, {
    message: 'The displayName must not exceed 150 characters',
  })
  displayName?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'URL of the user avatar',
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

  @ApiPropertyOptional({
    example: 'Backend Developer',
    description: 'User job title',
    maxLength: 150,
  })
  @IsOptional()
  @IsString({
    message: 'The jobTitle must be a string',
  })
  @MaxLength(150, {
    message: 'The jobTitle must not exceed 150 characters',
  })
  jobTitle?: string;

  @ApiPropertyOptional({
    example: 'Backend developer interested in distributed systems.',
    description: 'Short user biography',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({
    message: 'The bio must be a string',
  })
  @MaxLength(1000, {
    message: 'The bio must not exceed 1000 characters',
  })
  bio?: string;

  @ApiPropertyOptional({
    example: 'Europe/Kyiv',
    description: 'User IANA timezone',
  })
  @IsOptional()
  @IsString({
    message: 'The timezone must be a string',
  })
  timezone?: string;

  @ApiPropertyOptional({
    example: 'en',
    description: 'User preferred language',
    maxLength: 10,
  })
  @IsOptional()
  @IsString({
    message: 'The language must be a string',
  })
  @MaxLength(10, {
    message: 'The language must not exceed 10 characters',
  })
  language?: string;
}