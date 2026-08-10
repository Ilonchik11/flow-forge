import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrganizationResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Unique organization identifier',
  })
  id!: string;

  @ApiProperty({
    example: 'Acme Corporation',
    description: 'Organization name',
  })
  name!: string;

  @ApiProperty({
    example: 'acme-corporation',
    description: 'Unique URL-friendly organization identifier',
  })
  slug!: string;

  @ApiPropertyOptional({
    example: 'Software development company',
    description: 'Organization description',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    example: 'https://acme.com',
    description: 'Organization website',
  })
  website!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID of the organization owner',
  })
  ownerId!: string;

  @ApiProperty({
    example: '2026-08-10T08:00:00.000Z',
    description: 'Date and time when the organization was created',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2026-08-10T08:00:00.000Z',
    description: 'Date and time when the organization was last updated',
  })
  updatedAt!: Date;
}