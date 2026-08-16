import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateNotificationDto {
  @ApiProperty({
    example: true,
    description: 'Whether the notification has been read',
  })
  @IsBoolean()
  isRead!: boolean;
}