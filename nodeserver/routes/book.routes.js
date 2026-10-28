import { Router } from 'express';
import {
  getBook,
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  addWaitlistSubscriber,
  deleteWaitlistSubscriber,
  getWaitlistSubscribers,
} from '../controllers/book.controller.js';

const router = Router();

// Book endpoints
router.get('/', getBook);
router.get('/all', getAllBooks);
router.post('/', createBook);
router.put('/', updateBook);
router.put('/:id', updateBook);
router.delete('/:id', deleteBook);

// Waitlist endpoints
router.get('/waitlist', getWaitlistSubscribers);
router.post('/waitlist', addWaitlistSubscriber);
router.delete('/waitlist/:id', deleteWaitlistSubscriber);

// Specific book by ID/slug (must be placed after specific paths like /all and /waitlist)
router.get('/:id', getBookById);

export default router;
