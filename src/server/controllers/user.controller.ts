import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { UserService } from '../services/user.service';
import { CreateUserDto, UpdateUserDto } from '../dtos/user.dto';

export class UserController extends BaseController {
  constructor(private userService: UserService) {
    super();
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const users = await this.userService.getAll();
      this.sendResponse(res, users);
    } catch (error) {
      this.sendError(res, error as Error);
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.userService.getById(req.params.id);
      if (!user) {
        this.sendError(res, new Error('User not found'), 404);
        return;
      }
      this.sendResponse(res, user);
    } catch (error) {
      this.sendError(res, error as Error);
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const createUserDto = await this.validateDto(CreateUserDto, req.body);
      const user = await this.userService.create(createUserDto);
      this.sendResponse(res, user, 201);
    } catch (error) {
      this.sendError(res, error as Error);
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const updateUserDto = await this.validateDto(UpdateUserDto, req.body);
      const user = await this.userService.update(req.params.id, updateUserDto);
      if (!user) {
        this.sendError(res, new Error('User not found'), 404);
        return;
      }
      this.sendResponse(res, user);
    } catch (error) {
      this.sendError(res, error as Error);
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const success = await this.userService.delete(req.params.id);
      if (!success) {
        this.sendError(res, new Error('User not found'), 404);
        return;
      }
      this.sendResponse(res, { message: 'User deleted successfully' });
    } catch (error) {
      this.sendError(res, error as Error);
    }
  }
} 