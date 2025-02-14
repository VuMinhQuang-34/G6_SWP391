import express from 'express';
import { createBook, getAllBooks, getBookById, updateBook, deleteBook } from '../controllers/bookController.js';
import { verifyToken, checkRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/books', getAllBooks);
router.get('/books/:id', getBookById);

// Protected routes - Yêu cầu đăng nhập và phân quyền
router.post('/books', verifyToken, checkRole(['Admin', 'Manager']), createBook);
router.put('/books/:id', verifyToken, checkRole(['Admin', 'Manager']), updateBook);
router.delete('/books/:id', verifyToken, checkRole(['Admin']), deleteBook);

export default router;
