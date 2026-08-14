import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsString,
    IsUUID,
    MaxLength,
    MinLength,
} from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the issue this comment belongs to',
  })
  @IsUUID('4', {
    message: 'The issueId must be a valid UUID',
  })
  @IsNotEmpty({
    message: 'The issueId is required',
  })
  issueId!: string;

  @ApiProperty({
    example: 'I have implemented the authentication flow.',
    description: 'Comment content',
    minLength: 1,
    maxLength: 5000,
  })
  @IsString({
    message: 'The content must be a string',
  })
  @IsNotEmpty({
    message: 'The content is required',
  })
  @MinLength(1, {
    message: 'The content must contain at least 1 character',
  })
  @MaxLength(5000, {
    message: 'The content must not exceed 5000 characters',
  })
  content!: string;
}