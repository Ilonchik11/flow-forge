import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

export class NotificationResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique notification identifier',
  })
  id!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the user who owns the notification',
  })
  userId!: string;

  @ApiProperty({
    enum: NotificationType,
    description: 'Type of notification',
    example: NotificationType.ISSUE_ASSIGNED,
  })
  type!: NotificationType;

  @ApiProperty({
    example: 'Issue assigned to you',
    description: 'Notification title',
  })
  title!: string;

  @ApiProperty({
    example: 'You have been assigned to issue PROJ-15',
    description: 'Notification message',
  })
  message!: string;

  @ApiProperty({
    example: false,
    description: 'Whether the notification has been read',
  })
  isRead!: boolean;

  @ApiProperty({
    example: '2026-08-14T08:30:00.000Z',
    description: 'Date and time when the notification was read',
    nullable: true,
  })
  readAt!: Date | null;

  @ApiProperty({
    example: '2026-08-14T08:00:00.000Z',
    description: 'Date and time when the notification was created',
  })
  createdAt!: Date;
}