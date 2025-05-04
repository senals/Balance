import { Router } from 'express';
import { DrinkController } from '../controllers/drink.controller';

const router = Router();
const drinkController = new DrinkController();

// Basic CRUD routes
router.get('/', drinkController.getAllDrinks);
router.get('/:id', drinkController.getDrinkById);
router.post('/', drinkController.createDrink);
router.put('/:id', drinkController.updateDrink);
router.delete('/:id', drinkController.deleteDrink);

// Custom routes
router.get('/user/:userId', drinkController.getDrinksByUserId);
router.get('/user/:userId/range', drinkController.getDrinksByDateRange);

export default router; 