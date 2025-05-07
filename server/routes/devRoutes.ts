import { Router, Request, Response } from 'express';
import Drink from '../models/Drink';
import User from '../models/User';
import DrinkHistory from '../models/DrinkHistory';
import ReadinessAssessment from '../models/ReadinessAssessment';

const router = Router();

// Reset all database collections
router.post('/reset-database', async (req: Request, res: Response) => {
  try {
    // Delete all data from each collection
    await Promise.all([
      Drink.deleteMany({}),
      User.deleteMany({}),
      DrinkHistory.deleteMany({}),
      ReadinessAssessment.deleteMany({})
    ]);
    
    res.json({ message: 'Database reset successful. All collections have been cleared.' });
  } catch (error) {
    console.error('Error resetting database:', error);
    res.status(500).json({ message: 'Error resetting database', error });
  }
});

export default router; 