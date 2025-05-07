import { Request, Response, NextFunction } from 'express';
import { Model } from 'mongoose';

export function Update(model: Model<any>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (req: Request, res: Response, next: NextFunction) {
      try {
        const document = await model.findById(req.params.id);
        if (!document) {
          return res.status(404).json({ error: 'Document not found' });
        }
        document.set(req.body);
        await document.save();
        req.update = document;
        return originalMethod.call(this, req, res, next);
      } catch (error) {
        console.error('Error in Update decorator:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    };

    return descriptor;
  };
} 