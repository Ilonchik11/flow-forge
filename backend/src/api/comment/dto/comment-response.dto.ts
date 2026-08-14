import { ApiProperty } from '@nestjs/swagger';
import { CommentAuthorResponseDto } from './comment-author-response.dto';

export class CommentResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique comment identifier',
  })
  id!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the issue this comment belongs to',
  })
  issueId!: string;

  @ApiProperty({
    example: 'I have implemented the authentication flow.',
    description: 'Comment content',
  })
  content!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the comment author',
  })
  authorId!: string;

  @ApiProperty({
    type: () => CommentAuthorResponseDto,
    description: 'Comment author',
  })
  author!: CommentAuthorResponseDto;

  @ApiProperty({
    example: '2026-08-13T12:00:00.000Z',
    description: 'Date and time when the comment was created',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2026-08-13T12:30:00.000Z',
    description: 'Date and time when the comment was last updated',
  })
  updatedAt!: Date;
}