import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiBadRequestResponse, ApiConflictResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';
import type {
  Request,
  Response
} from 'express';
import { AuthService } from './auth.service';
import { AuthResponse, LoginRequest, RegisterRequest } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Account creation', description: 'Creation a new user account', })
  @ApiOkResponse({ type: AuthResponse })
  @ApiBadRequestResponse({ description: 'Incorrect input data' })
  @ApiConflictResponse({ description: 'User with this email already exists' })
  @Post('register') 
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Res({ passthrough: true }) res: Response,
    @Body() dto: RegisterRequest,
  ) {
    return this.authService.register(res, dto);
  }

  @ApiOperation({ summary: 'Authenticate user', description: 'Authenticates the user using their email and password, sets a refresh token in an HTTP-only cookie, and returns a JWT access token.', })
  @ApiOkResponse({ type: AuthResponse })
  @ApiBadRequestResponse({ description: 'Incorrect input data' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Res({ passthrough: true }) res: Response,
    @Body() dto: LoginRequest
  ) {
    return this.authService.login(res, dto);
  }

  @ApiOperation({ summary: 'Token refresh', description: 'Generates a new access token', })
  @ApiOkResponse({ type: AuthResponse })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  @Post('refresh') 
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.refresh(req, res);
  }

  @ApiOperation({ summary: 'Log out user', description: 'Clears the refresh token cookie and signs the user out.', })
  @Post('logout') 
  @HttpCode(HttpStatus.OK)
  async logout(
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.logout(res);
  }
}
