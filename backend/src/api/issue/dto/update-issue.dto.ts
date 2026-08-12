import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IssuePriority,
  IssueStatus,
  IssueType,
} from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class UpdateIssueDto {
  @ApiPropertyOptional({
    example: 'Implement JWT authentication',
    description: 'Issue title',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    example: 'Updated issue description',
    description: 'Detailed issue description',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: IssueType,
    example: IssueType.BUG,
  })
  @IsOptional()
  @IsEnum(IssueType)
  type?: IssueType;

  @ApiPropertyOptional({
    enum: IssueStatus,
    example: IssueStatus.IN_PROGRESS,
  })
  @IsOptional()
  @IsEnum(IssueStatus)
  status?: IssueStatus;

  @ApiPropertyOptional({
    enum: IssuePriority,
    example: IssuePriority.HIGH,
  })
  @IsOptional()
  @IsEnum(IssuePriority)
  priority?: IssuePriority;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the assigned user',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;
}