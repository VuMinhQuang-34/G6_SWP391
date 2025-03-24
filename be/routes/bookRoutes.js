import express from 'express';
import { createBook, getAllBooks, getBookById, updateBook, deleteBook, getBookBins } from '../controllers/bookController.js';
import { verifyToken, checkRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes - không cần token
router.get('/books', getAllBooks);
router.get('/books/:id', getBookById);
router.get('/books/:id/bins', getBookBins);

// Protected routes - yêu cầu token và phân quyền
router.post('/books', createBook);
router.put('/books/:id', updateBook);
router.delete('/books/:id', deleteBook);
// router.post('/books', verifyToken, checkRole(['Admin', 'Manager', 'Staff']), createBook);
// router.put('/books/:id', verifyToken, checkRole(['Admin', 'Manager', 'Staff']), updateBook);
// router.delete('/books/:id', verifyToken, checkRole(['Admin', 'Manager']), deleteBook);

export default router;
