import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  IssuePriority,
  IssueStatus,
  IssueType,
} from '@prisma/client';

export class CreateIssueDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the project where the issue will be created',
  })
  @IsUUID()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({
    example: 'Implement JWT authentication',
    description: 'Issue title',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({
    example: 'Implement access and refresh token authentication.',
    description: 'Detailed issue description',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: IssueType,
    example: IssueType.TASK,
    default: IssueType.TASK,
  })
  @IsOptional()
  @IsEnum(IssueType)
  type?: IssueType;

  @ApiPropertyOptional({
    enum: IssuePriority,
    example: IssuePriority.MEDIUM,
    default: IssuePriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the user assigned to the issue',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;
}