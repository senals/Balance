import { Request, Response } from 'express';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

export class BaseController {
  protected async validateDto<T extends object>(dto: new () => T, data: any): Promise<T> {
    const instance = plainToClass(dto, data);
    const errors = await validate(instance);
    
    if (errors.length > 0) {
      throw new Error(errors.map(error => Object.values(error.constraints)).flat().join(', '));
    }
    
    return instance;
  }

  protected sendResponse<T>(res: Response, data: T, status = 200): void {
    res.status(status).json({
      success: true,
      data
    });
  }

  protected sendError(res: Response, error: Error, status = 400): void {
    res.status(status).json({
      success: false,
      error: error.message
    });
  }
} 