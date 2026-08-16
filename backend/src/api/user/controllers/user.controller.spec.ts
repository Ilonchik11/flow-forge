import {
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../services/user.service';
import { UserController } from './user.controller';

describe('UserController', () => {
  let controller: UserController;

  const userService = {
    findAll: jest.fn<() => Promise<any[]>>(),
    findOne: jest.fn<() => Promise<any>>(),
    update: jest.fn<() => Promise<any>>(),
    remove: jest.fn<() => Promise<any>>(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: userService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all users', async() => {
      const users = [
        {
          id: 'user-1',
          email: 'john@example.com',
        },
        {
          id: 'user-2',
          email: 'jane@example.com',
        },
      ];

      userService.findAll.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(result).toEqual(users);

      expect(userService.findAll).toHaveBeenCalledWith();
    });
  });

  describe('findOne', () => {
    it('should return a user', async() =>{
      const currentUser = {
        id: 'user-1',
        email: 'john@example.com',
        role: 'USER',
      } as any;

      const user = {
        id: 'user-2',
        email: 'jane@example.com',
      };

      userService.findOne.mockResolvedValue(user);

      const result = await controller.findOne(
        'user-2',
        currentUser,
      );

      expect(result).toEqual(user);

      expect(userService.findOne).toHaveBeenCalledWith(
        'user-2',
        currentUser,
      );
    }); 
  }); 

  describe('update', () => {
    it('should update a user', async() => {
      const currentUser = {
        id: 'user-1',
        email: 'john@example.com',
        role: 'USER',
      } as any;

      const dto = {
        email: 'new@example.com',
      };

      const updatedUser = {
        id: 'user-1',
        email: 'new@example.com',
      };

      userService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(
        'user-1',
        currentUser,
        dto as any,
      );

      expect(result).toEqual(updatedUser);

      expect(userService.update).toHaveBeenCalledWith(
        'user-1',
        dto as any,
        currentUser,
      );

      expect(result).toEqual(updatedUser);

      expect(userService.update).toHaveBeenCalledWith(
        'user-1',
        dto,
        currentUser,
      );
    });
  });

  describe('remove', () =>{
    it('should remove a user', async() =>{
      const currentUser = {
        id: 'user-1',
        email: 'john@example.com',
        role: 'USER',
      } as any;

      const response = {
        message: 'User user-2 deleted successfully',
      };

      userService.remove.mockResolvedValue(response);

      const result = await controller.remove(
        'user-2',
        currentUser,
      );

      expect(result).toEqual(response);

      expect(userService.remove).toHaveBeenCalledWith(
        'user-2',
        currentUser,
      );
    });
  });
});
