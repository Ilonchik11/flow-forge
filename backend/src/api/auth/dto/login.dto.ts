import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class LoginRequest {
    @ApiProperty({
        example: 'user@example.com',
        description: 'User email address',
    })
    @IsString({
        message: 'The email must be a string'
    })
    @IsNotEmpty({
        message: 'The email is required'
    })
    @IsEmail(
        {},
        {
            message: 'The email must be a valid email address',
        }
    )
    email!: string;

    @ApiProperty({
        example: 'StrongPassword123!',
        description: 'User password',
        minLength: 6,
        maxLength: 128,
    })
    @IsString({
        message: 'The password must be a string',
    })
    @IsNotEmpty({
        message: 'The password is required',
    })
    @MinLength(6, {
        message: 'The password must contain at least 6 characters',
    })
    @MaxLength(128, {
        message: 'The password must not exceed 128 characters',
    })
    password!: string;
}