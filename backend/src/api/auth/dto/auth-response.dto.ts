import { ApiProperty } from "@nestjs/swagger";

export class AuthResponse {
    @ApiProperty({
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        description: 'JWT access token',
    })
    accessToken!: string;
}