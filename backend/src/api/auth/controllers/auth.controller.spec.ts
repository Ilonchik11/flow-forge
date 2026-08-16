import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';

import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const authService = {
    register: jest.fn<() => Promise<any>>(),
    login: jest.fn<() => Promise<any>>(),
    refresh: jest.fn<() => Promise<any>>(),
    logout: jest.fn<() => Promise<any>>(),
  };

  const response = {
    cookie: jest.fn(),
  } as unknown as Response;

  const request = {
    cookies: {},
  } as unknown as Request;

  const registerDto = {
    email: 'john@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    displayName: 'John Doe',
  };

  const loginDto = {
    email: 'john@example.com',
    password: 'password123',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule =
      await Test.createTestingModule({
        controllers: [AuthController],
        providers: [
          {
            provide: AuthService,
            useValue: authService,
          },
        ],
      }).compile();

    controller = module.get<AuthController>(
      AuthController,
    );
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const authResponse = {
        accessToken: 'access-token',
      };

      authService.register.mockResolvedValue(
        authResponse,
      );

      const result = await controller.register(
        response,
        registerDto,
      );

      expect(result).toEqual(authResponse);

      expect(authService.register).toHaveBeenCalledWith(
        response,
        registerDto,
      );

      expect(authService.register).toHaveBeenCalledTimes(
        1,
      );
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const authResponse = {
        accessToken: 'access-token',
      };

      authService.login.mockResolvedValue(
        authResponse,
      );

      const result = await controller.login(
        response,
        loginDto,
      );

      expect(result).toEqual(authResponse);

      expect(authService.login).toHaveBeenCalledWith(
        response,
        loginDto,
      );

      expect(authService.login).toHaveBeenCalledTimes(1);
    });
  });

  describe('refresh', () => {
    it('should refresh the access token', async () => {
      const authResponse = {
        accessToken: 'new-access-token',
      };

      authService.refresh.mockResolvedValue(
        authResponse,
      );

      const result = await controller.refresh(
        request,
        response,
      );

      expect(result).toEqual(authResponse);

      expect(authService.refresh).toHaveBeenCalledWith(
        request,
        response,
      );

      expect(authService.refresh).toHaveBeenCalledTimes(
        1,
      );
    });
  });

  describe('logout', () => {
    it('should logout the user', async () => {
      authService.logout.mockResolvedValue(undefined);

      const result = await controller.logout(response);

      expect(result).toBeUndefined();

      expect(authService.logout).toHaveBeenCalledWith(
        response,
      );

      expect(authService.logout).toHaveBeenCalledTimes(1);
    });
  });
});