import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateWorkspaceMemberDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the user to add to the workspace',
  })
  @IsString({
    message: 'The userId must be a string',
  })
  @IsNotEmpty({
    message: 'The userId is required',
  })
  @IsUUID('4', {
    message: 'The userId must be a valid UUID',
  })
  userId!: string;
}