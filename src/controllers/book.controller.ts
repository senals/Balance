import { Request, Response } from 'express';
import { Book } from '../models/book.model';
import { GetAll } from '../decorators/mongoose/getAll.decorator';
import { Get } from '../decorators/mongoose/get.decorator';
import { Create } from '../decorators/mongoose/create.decorator';
import { Update } from '../decorators/mongoose/update.decorator';
import { Delete } from '../decorators/mongoose/delete.decorator';
import { Query } from '../decorators/mongoose/query.decorator';

export class BookController {
  @GetAll(Book)
  async getAll(req: Request, res: Response) {
    return res.status(200).json(req.getAll);
  }

  @Get(Book)
  async get(req: Request, res: Response) {
    return res.status(200).json(req.get);
  }

  @Create(Book)
  async create(req: Request, res: Response) {
    return res.status(201).json(req.create);
  }

  @Update(Book)
  async update(req: Request, res: Response) {
    return res.status(200).json(req.update);
  }

  @Delete(Book)
  async delete(req: Request, res: Response) {
    return res.status(200).json({ message: 'Document deleted successfully' });
  }

  @Query(Book)
  async query(req: Request, res: Response) {
    return res.status(200).json(req.query);
  }
} 