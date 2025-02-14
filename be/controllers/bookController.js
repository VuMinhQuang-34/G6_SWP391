import db from '../models/index.js';
import { Op } from 'sequelize';

const Book = db.Book;
const Category = db.Category;

// Create a new book
const createBook = async (req, res) => {
    try {
        const currentDate = new Date();
        const bookData = {
            ...req.body,
            Created_Date: currentDate,
            Edit_Date: currentDate,
            Status: req.body.Status || 'Active' // Mặc định là Active nếu không được cung cấp
        };

        const book = await Book.create(bookData);
        return res.status(201).json({
            success: true,
            message: 'Book created successfully',
            data: book
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error creating book',
            error: error.message
        });
    }
};

// Get all books with pagination and search
const getAllBooks = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', categoryId } = req.query;
        const offset = (page - 1) * limit;

        // Build where condition
        let condition = {};

        // Add search condition
        if (search) {
            condition = {
                [Op.or]: [
                    { Title: { [Op.like]: `%${search}%` } },
                    { Author: { [Op.like]: `%${search}%` } },
                    { Publisher: { [Op.like]: `%${search}%` } }
                ]
            };
        }

        // Add category filter
        if (categoryId) {
            condition.CategoryId = categoryId;
        }

        const { count, rows } = await Book.findAndCountAll({
            where: condition,
            include: [{
                model: Category,
                attributes: ['CategoryName']
            }],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['BookId', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            data: rows,
            total: count,
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error retrieving books',
            error: error.message
        });
    }
};

// Get book by ID
const getBookById = async (req, res) => {
    try {
        const book = await Book.findByPk(req.params.id, {
            include: [{
                model: Category,
                attributes: ['CategoryName']
            }]
        });

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }
        return res.status(200).json({
            success: true,
            data: book
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error retrieving book',
            error: error.message
        });
    }
};

// Update book
const updateBook = async (req, res) => {
    try {
        const book = await Book.findByPk(req.params.id);
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        const updateData = {
            ...req.body,
            Edit_Date: new Date()
        };

        await book.update(updateData);

        // Fetch updated book with category information
        const updatedBook = await Book.findByPk(book.BookId, {
            include: [{
                model: Category,
                attributes: ['CategoryName']
            }]
        });

        return res.status(200).json({
            success: true,
            message: 'Book updated successfully',
            data: updatedBook
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error updating book',
            error: error.message
        });
    }
};

// Delete book
const deleteBook = async (req, res) => {
    try {
        const book = await Book.findByPk(req.params.id);
        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found'
            });
        }

        // Soft delete - chỉ cập nhật trạng thái
        await book.update({
            Status: 'Inactive',
            Edit_Date: new Date()
        });

        return res.status(200).json({
            success: true,
            message: 'Book deleted successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error deleting book',
            error: error.message
        });
    }
};

export {
    createBook,
    getAllBooks,
    getBookById,
    updateBook,
    deleteBook
};
