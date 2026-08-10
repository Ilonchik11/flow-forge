import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsStrongPassword,
    ValidateNested
} from 'class-validator';
import { UpdateUserProfileDto } from './update-user-profile.dto';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsOptional()
  @IsString({
    message: 'The email must be a string',
  })
  @IsNotEmpty({
    message: 'The email cannot be empty',
  })
  @IsEmail(
    {},
    {
      message: 'The email must be a valid email address',
    },
  )
  email?: string;

  @ApiPropertyOptional({
    example: 'StrongPassword123!',
    description:
      'New password. Must contain at least 8 characters, including lowercase, uppercase, number and symbol',
    minLength: 8,
    maxLength: 128,
  })
  @IsOptional()
  @IsString({
    message: 'The password must be a string',
  })
  @IsNotEmpty({
    message: 'The password cannot be empty',
  })
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'The password must contain at least 8 characters, including lowercase, uppercase, number and symbol',
    },
  )
  password?: string;

  @ApiPropertyOptional({
    type: () => UpdateUserProfileDto,
    description: 'User profile information to update',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateUserProfileDto)
  profile?: UpdateUserProfileDto;
}