import express, { Request, Response } from 'express';
import Budget from '../models/Budget';

const router = express.Router();

// Get all budgets
router.get('/', async (req: Request, res: Response) => {
  try {
    const budgets = await Budget.find();
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching budgets', error });
  }
});

// Get budgets by user ID
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const budgets = await Budget.find({ userId: req.params.userId });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user budgets', error });
  }
});

// Create a new budget
router.post('/', async (req: Request, res: Response) => {
  try {
    const budget = new Budget(req.body);
    const savedBudget = await budget.save();
    res.status(201).json(savedBudget);
  } catch (error) {
    res.status(400).json({ message: 'Error creating budget', error });
  }
});

// Update a budget
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const updatedBudget = await Budget.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedBudget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    res.json(updatedBudget);
  } catch (error) {
    res.status(400).json({ message: 'Error updating budget', error });
  }
});

// Delete a budget
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deletedBudget = await Budget.findByIdAndDelete(req.params.id);
    if (!deletedBudget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting budget', error });
  }
});

export default router; 