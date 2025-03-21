import db from '../models/index.js';
import { Op } from 'sequelize';

const Book = db.Book;
const Category = db.Category;
const Stock = db.Stock;

// Create a new book

const createBook = async (req, res) => {
    try {
        // Kiểm tra các trường bắt buộc
        const { Title, Author, Publisher, Image } = req.body;

        if (isEmptyOrWhitespace(Title)) {
            return res.status(400).json({
                success: false,
                message: 'Title cannot be empty or contain only whitespace'
            });
        }

        if (isEmptyOrWhitespace(Author)) {
            return res.status(400).json({
                success: false,
                message: 'Author cannot be empty or contain only whitespace'
            });
        }

        if (isEmptyOrWhitespace(Publisher)) {
            return res.status(400).json({
                success: false,
                message: 'Publisher cannot be empty or contain only whitespace'
            });
        }

        // Validate Image if provided
        if (Image) {
            // Check if Image is a base64 string
            if (!Image.startsWith('data:image/')) {
                return res.status(400).json({
                    success: false,
                    message: 'Image must be a valid base64 image string'
                });
            }
            
            // Check image size (limit to 5MB)
            const base64Size = Math.ceil((Image.length - 22) * 3 / 4);
            if (base64Size > 5 * 1024 * 1024) {
                return res.status(400).json({
                    success: false,
                    message: 'Image size must be less than 5MB'
                });
            }
        }

        // Trim các giá trị string
        req.body.Title = Title.trim();
        req.body.Author = Author.trim();
        req.body.Publisher = Publisher.trim();

        const book = await Book.create({
            ...req.body,
            Image: Image || null,
            Created_Date: new Date(),
            Edit_Date: new Date(),
            Status: req.body.Status || 'Active' // Mặc định là Active nếu không được cung cấp
        });

        const stock = await Stock.create({
            BookId: book.BookId,
            Quantity: 0,
            MaxStockQuantity: 0,
            MinStockQuantity: 0,
            Note: '',
            Status: ''
        });

        return res.status(201).json({
            success: true,
            message: 'Book created successfully',
            data: book
        });
    } catch (error) {
        console.error('Error creating book:', error);
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

        let condition = {};
        if (search) {
            condition = {
                [Op.or]: [
                    { Title: { [Op.like]: `%${search}%` } },
                    { Author: { [Op.like]: `%${search}%` } },
                    { Publisher: { [Op.like]: `%${search}%` } }
                ]
            };
        }

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

        console.log('Books found:', rows); // Debug log

        return res.status(200).json({
            success: true,
            data: rows,
            total: count,
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error('Error in getAllBooks:', error);
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
            Image: req.body.Image || book.Image,
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

// Thêm hàm kiểm tra chuỗi rỗng hoặc chỉ chứa khoảng trắng
const isEmptyOrWhitespace = (str) => {
    return !str || str.trim().length === 0;
};

export {
    createBook,
    getAllBooks,
    getBookById,
    updateBook,
    deleteBook
};
