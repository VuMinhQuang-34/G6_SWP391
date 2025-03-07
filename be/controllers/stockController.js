import db from '../models/index.js';
import { Op } from 'sequelize';
import util from "./common.js"; // Import db từ models

const Book = db.Book;
const Category = db.Category;
const Stock = db.Stock;


export const getAllStock = async (req, res) => {
    
    try {
       const stocks = await util.getAllStock();
        return res.status(200).json(stocks);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách OrderStatusLogs:", error);
        return res.status(500).json({ message: "Lỗi server" });
    }
};


export const updateStock = async (req, res) => {
    try {
        const stocks = await util.updateStock({...req.body});
        return res.status(200).json(stocks);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách OrderStatusLogs:", error);
        return res.status(500).json({ message: "Cập nhật thất bại" });
    }
};



