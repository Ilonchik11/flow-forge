import { ApiProperty } from '@nestjs/swagger';
import { WorkspaceRole } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateWorkspaceMemberDto {
  @ApiProperty({
    enum: WorkspaceRole,
    example: WorkspaceRole.ADMIN,
    description: 'New role of the workspace member',
  })
  @IsEnum(WorkspaceRole, {
    message: 'The role must be a valid workspace role',
  })
  @IsNotEmpty({
    message: 'The role is required',
  })
  role!: WorkspaceRole;
}