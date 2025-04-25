import { Router } from 'express';
import { BookController } from '../controllers/book.controller';

const router = Router();
const bookController = new BookController();

router.get('/getall', bookController.getAll.bind(bookController));
router.get('/:id', bookController.get.bind(bookController));
router.post('/create', bookController.create.bind(bookController));
router.patch('/update/:id', bookController.update.bind(bookController));
router.delete('/delete/:id', bookController.delete.bind(bookController));
router.post('/query', bookController.query.bind(bookController));

export default router; 