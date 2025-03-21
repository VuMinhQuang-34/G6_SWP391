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

// lấy số lượng tồn kho theo id sách
export const getStockByIdBook = async (req, res) => {
    try {
        const stock = await Stock.findOne({
            where: {
                BookId: req.params.id
            }
        });
        return res.status(200).json({code: 200, data:[{quantity: stock.Quantity}], message: "Lấy số lượng tồn kho thành công"});
    } catch (error) {
        console.error("Lỗi khi lấy số lượng tồn kho:", error);
        return res.status(500).json({ message: "Lỗi server" });
    }
}



