import db from '../models/index.js';
import { Op } from 'sequelize';

const Book = db.Book;
const Category = db.Category;
const Stock = db.Stock;


// Get all stock with pagination and search
const getAllStock = async (req, res) => {
        
};



export {
    getAllStock,
};
