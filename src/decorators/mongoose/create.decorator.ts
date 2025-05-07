import { Request, Response, NextFunction } from 'express';
import { Model, Types } from 'mongoose';

export function Create(model: Model<any>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (req: Request, res: Response, next: NextFunction) {
      try {
        const document = new model({
          _id: new Types.ObjectId(),
          ...req.body
        });
        await document.save();
        req.create = document;
        return originalMethod.call(this, req, res, next);
      } catch (error) {
        console.error('Error in Create decorator:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    };

    return descriptor;
  };
} 