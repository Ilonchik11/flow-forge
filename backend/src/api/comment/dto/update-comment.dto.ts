import { ApiProperty } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({
    example: 'I have updated the authentication implementation.',
    description: 'Updated comment content',
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