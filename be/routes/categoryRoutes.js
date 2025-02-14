import express from 'express';
import {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} from '../controllers/categoryController.js';

const categoryRoutes = express.Router();

// GET all categories
categoryRoutes.get('/categories', getAllCategories);

// GET single category by ID
categoryRoutes.get('/categories/:id', getCategoryById);

// POST new category
categoryRoutes.post('/categories', createCategory);

// PUT update category
categoryRoutes.put('/categories/:id', updateCategory);

// DELETE category
categoryRoutes.delete('/categories/:id', deleteCategory);

export default categoryRoutes;
