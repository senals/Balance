import express, { Request, Response } from 'express';
import Drink from '../models/Drink';

const router = express.Router();

// Get all drinks
router.get('/', async (req: Request, res: Response) => {
  try {
    const drinks = await Drink.find().sort({ timestamp: -1 });
    res.json(drinks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching drinks', error });
  }
});

// Get drinks by user ID
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const drinks = await Drink.find({ userId: req.params.userId })
      .sort({ timestamp: -1 });
    res.json(drinks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user drinks', error });
  }
});

// Get a single drink
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const drink = await Drink.findById(req.params.id);
    if (!drink) {
      return res.status(404).json({ message: 'Drink not found' });
    }
    res.json(drink);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching drink', error });
  }
});

// Create a new drink
router.post('/', async (req: Request, res: Response) => {
  try {
    const drink = new Drink(req.body);
    const savedDrink = await drink.save();
    res.status(201).json(savedDrink);
  } catch (error) {
    res.status(400).json({ message: 'Error creating drink', error });
  }
});

// Update a drink
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const drink = await Drink.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!drink) {
      return res.status(404).json({ message: 'Drink not found' });
    }
    res.json(drink);
  } catch (error) {
    res.status(400).json({ message: 'Error updating drink', error });
  }
});

// Delete a drink
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const drink = await Drink.findByIdAndDelete(req.params.id);
    if (!drink) {
      return res.status(404).json({ message: 'Drink not found' });
    }
    res.json({ message: 'Drink deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting drink', error });
  }
});

// Get drinks by date range for a user
router.get('/user/:userId/range', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const drinks = await Drink.find({
      userId: req.params.userId,
      timestamp: {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      }
    }).sort({ timestamp: -1 });
    res.json(drinks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching drinks by date range', error });
  }
});

export default router; 