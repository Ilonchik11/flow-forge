import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({
    example: 'Acme Corporation',
    description: 'Organization name',
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
    example: 'acme-corporation',
    description:
      'Unique URL-friendly organization identifier',
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
    example: 'Software development company',
    description: 'Organization description',
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
    example: 'https://acme.com',
    description: 'Organization website',
    maxLength: 255,
  })
  @IsString({
    message: 'The website must be a string',
  })
  @IsNotEmpty({
    message: 'The website is required',
  })
  @MaxLength(255, {
    message: 'The website must not exceed 255 characters',
  })
  website!: string;
}