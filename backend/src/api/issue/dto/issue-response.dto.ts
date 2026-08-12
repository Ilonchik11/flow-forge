import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IssuePriority,
    IssueStatus,
    IssueType,
} from '@prisma/client';

class IssueUserResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    example: 'john@example.com',
  })
  email!: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    nullable: true,
  })
  displayName!: string | null;
}

export class IssueResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  projectId!: string;

  @ApiProperty({
    example: 1,
  })
  key!: number;

  @ApiProperty({
    example: 'Implement authentication',
  })
  title!: string;

  @ApiPropertyOptional({
    example: 'Implement JWT authentication.',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    enum: IssueType,
    example: IssueType.TASK,
  })
  type!: IssueType;

  @ApiProperty({
    enum: IssueStatus,
    example: IssueStatus.TODO,
  })
  status!: IssueStatus;

  @ApiProperty({
    enum: IssuePriority,
    example: IssuePriority.MEDIUM,
  })
  priority!: IssuePriority;

  @ApiProperty({
    type: IssueUserResponseDto,
  })
  reporter!: IssueUserResponseDto;

  @ApiProperty({
    type: IssueUserResponseDto,
    nullable: true,
  })
  assignee!: IssueUserResponseDto | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}