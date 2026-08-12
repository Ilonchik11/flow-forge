import { ApiProperty } from '@nestjs/swagger';
import { ProjectRole } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateProjectMemberDto {
  @ApiProperty({
    enum: ProjectRole,
    example: ProjectRole.ADMIN,
    description: 'New role for the project member',
  })
  @IsEnum(ProjectRole, {
    message: 'The role must be a valid project role',
  })
  @IsNotEmpty({
    message: 'The role is required',
  })
  role!: ProjectRole;
}