import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';
import { CommentAuthorProfileResponseDto } from './comment-author-profile-response.dto';

export class CommentAuthorResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique user identifier',
  })
  id!: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  email!: string;

  @ApiProperty({
    enum: UserStatus,
    example: UserStatus.ACTIVE,
    description: 'Current user account status',
  })
  status!: UserStatus;

  @ApiProperty({
    example: true,
    description: 'Whether the user has verified their email address',
  })
  isEmailVerified!: boolean;

  @ApiProperty({
    type: () => CommentAuthorProfileResponseDto,
    nullable: true,
    description: 'User profile information',
  })
  profile!: CommentAuthorProfileResponseDto | null;
}