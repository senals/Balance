import { Request, Response } from 'express';
import { Drink, IDrink } from '../models/drink.model';
import { GetAll } from '../decorators/mongoose/getAll.decorator';
import { Get } from '../decorators/mongoose/get.decorator';
import { Create } from '../decorators/mongoose/create.decorator';
import { Update } from '../decorators/mongoose/update.decorator';
import { Delete } from '../decorators/mongoose/delete.decorator';
import { Query } from '../decorators/mongoose/query.decorator';

export class DrinkController {
  @GetAll(Drink)
  async getAll(req: Request, res: Response) {
    return res.status(200).json(req.getAll);
  }

  @Get(Drink)
  async get(req: Request, res: Response) {
    return res.status(200).json(req.get);
  }

  @Create(Drink)
  async create(req: Request, res: Response) {
    return res.status(201).json(req.create);
  }

  @Update(Drink)
  async update(req: Request, res: Response) {
    return res.status(200).json(req.update);
  }

  @Delete(Drink)
  async delete(req: Request, res: Response) {
    return res.status(200).json({ message: 'Drink deleted successfully' });
  }

  @Query(Drink)
  async query(req: Request, res: Response) {
    return res.status(200).json(req.query);
  }

  // Get all drinks
  async getAllDrinks(req: Request, res: Response) {
    try {
      const drinks = await Drink.find().sort({ timestamp: -1 });
      res.json(drinks);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching drinks', error });
    }
  }

  // Get drink by ID
  async getDrinkById(req: Request, res: Response) {
    try {
      const drink = await Drink.findById(req.params.id);
      if (!drink) {
        return res.status(404).json({ message: 'Drink not found' });
      }
      res.json(drink);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching drink', error });
    }
  }

  // Create new drink
  async createDrink(req: Request, res: Response) {
    try {
      const drinkData: IDrink = req.body;
      const drink = new Drink(drinkData);
      await drink.save();
      res.status(201).json(drink);
    } catch (error) {
      res.status(400).json({ message: 'Error creating drink', error });
    }
  }

  // Update drink
  async updateDrink(req: Request, res: Response) {
    try {
      const drink = await Drink.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!drink) {
        return res.status(404).json({ message: 'Drink not found' });
      }
      res.json(drink);
    } catch (error) {
      res.status(400).json({ message: 'Error updating drink', error });
    }
  }

  // Delete drink
  async deleteDrink(req: Request, res: Response) {
    try {
      const drink = await Drink.findByIdAndDelete(req.params.id);
      if (!drink) {
        return res.status(404).json({ message: 'Drink not found' });
      }
      res.json({ message: 'Drink deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting drink', error });
    }
  }

  // Get drinks by user ID
  async getDrinksByUserId(req: Request, res: Response) {
    try {
      const drinks = await Drink.find({ userId: req.params.userId })
        .sort({ timestamp: -1 });
      res.json(drinks);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user drinks', error });
    }
  }

  // Get drinks by date range
  async getDrinksByDateRange(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;

      const query: any = { userId };
      if (startDate && endDate) {
        query.timestamp = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        };
      }

      const drinks = await Drink.find(query).sort({ timestamp: -1 });
      res.json(drinks);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching drinks by date range', error });
    }
  }
} 