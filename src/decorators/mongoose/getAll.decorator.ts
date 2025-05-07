import { Request, Response, NextFunction } from 'express';
import { Model } from 'mongoose';

export function GetAll(model: Model<any>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (req: Request, res: Response, next: NextFunction) {
      try {
        const documents = await model.find();
        req.getAll = documents;
        return originalMethod.call(this, req, res, next);
      } catch (error) {
        console.error('Error in GetAll decorator:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    };

    return descriptor;
  };
} 