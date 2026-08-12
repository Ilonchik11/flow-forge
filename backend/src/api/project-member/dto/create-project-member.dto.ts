import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateProjectMemberDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the user to add to the project',
  })
  @IsUUID()
  @IsNotEmpty({
    message: 'The userId is required',
  })
  userId!: string;
}