import { Request, Response, NextFunction } from 'express';
import { Document } from 'mongoose';

export const declareHandler = (req: Request, res: Response, next: NextFunction) => {
  req.getAll = [];
  req.get = undefined;
  req.create = undefined;
  req.update = undefined;
  req.query = [];
  next();
}; 