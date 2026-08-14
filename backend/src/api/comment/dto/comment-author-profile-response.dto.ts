import { ApiProperty } from '@nestjs/swagger';

export class CommentAuthorProfileResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique profile identifier',
  })
  id!: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  firstName!: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
  })
  lastName!: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'User display name',
  })
  displayName!: string;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'URL of the user avatar',
    nullable: true,
  })
  avatarUrl!: string | null;

  @ApiProperty({
    example: 'Backend Developer',
    description: 'User job title',
    nullable: true,
  })
  jobTitle!: string | null;
}