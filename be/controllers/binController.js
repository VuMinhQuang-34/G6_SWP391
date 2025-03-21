import db from "../models/index.js"; // Import db từ models
import { Op } from 'sequelize'; // Import Op từ sequelize để sử dụng trong tìm kiếm
const { ImportOrders, ImportOrderDetails, Book, OrderStatusLogs, User, Bin, Shelf, Warehouse, BookBin } = db; // Destructure các model cần thiết
import util from "./common.js";

export const getAllBin = async (req, res) => {
    try {
        const { page = 1, limit = 10, shelfId } = req.query;
        const offset = (page - 1) * limit;
        
        // Xây dựng điều kiện tìm kiếm
        const whereCondition = {};
        if (shelfId) {
            whereCondition.ShelfId = shelfId;
        }
        
        // Thực hiện truy vấn với phân trang
        const { count, rows } = await Bin.findAndCountAll({
            where: whereCondition,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['BinId', 'ASC']]
        });
        
        return res.status(200).json({
            data: rows,
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
        });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách bins:", error);
        return res.status(500).json({ message: "Lỗi server" });
    }
};

export const getOneBinById = async (req, res) => {
    try {
        const { id } = req.params;

        const bin = await Bin.findOne({ where: { BinId: id } });
        if (!bin) {
            return res.status(404).json({ error: `Không tìm thấy Bin với ID ${id}` });
        }

        const bookBinEntries = await BookBin.findAll({ where: { BinId: id } });

        let books = [];
        for (const entry of bookBinEntries) {
            const book = await Book.findOne({ where: { BookId: entry.BookId } });

            if (book) {
                books.push({
                    BookId: book.BookId,
                    Title: book.Title,
                    Author: book.Author,
                    CategoryId: book.CategoryId,
                    Publisher: book.Publisher,
                    Published_Year: book.Published_Year,
                    NumberOfPages: book.NumberOfPages,
                    Language: book.Language,
                    Status: book.Status,
                    Quantity: entry.Quantity // Số lượng sách trong Bin
                });
            }
        }

        return res.status(200).json({
            BinId: bin.BinId,
            ShelfId: bin.ShelfId,
            Name: bin.Name,
            Quantity_Max_Limit: bin.Quantity_Max_Limit,
            Quantity_Current: bin.Quantity_Current,
            Description: bin.Description,
            books
        });

    } catch (error) {
        console.error("Lỗi khi lấy thông tin Bin:", error);
        return res.status(500).json({ message: "Lỗi server", details: error.message });
    }
};

export const createBin = async (req, res) => {
    try {
        const { BinId, ShelfId, Name, Quantity_Max_Limit, Description } = req.body;

        // Kiểm tra xem các trường bắt buộc có được gửi không
        if (!BinId || !ShelfId || !Name || Quantity_Max_Limit === undefined || Quantity_Max_Limit === null) {
            return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin Bin' });
        }

        // Xác thực dữ liệu số lượng tối đa
        const maxLimit = parseInt(Quantity_Max_Limit, 10);
        if (isNaN(maxLimit) || !Number.isInteger(maxLimit) || maxLimit <= 0) {
            return res.status(400).json({ error: 'Số lượng sách tối đa phải là số nguyên dương' });
        }

        // Kiểm tra xem BinId đã tồn tại chưa
        const existingBin = await Bin.findOne({ where: { BinId } });
        if (existingBin) {
            return res.status(409).json({ error: `Bin với ID ${BinId} đã tồn tại` });
        }

        // Kiểm tra xem ShelfId có tồn tại không
        const existingShelf = await Shelf.findOne({ where: { ShelfId } });
        if (!existingShelf) {
            return res.status(404).json({ error: `Không tìm thấy Shelf với ID ${ShelfId}` });
        }

        // Chèn dữ liệu Bin mới vào database
        const newBin = await Bin.create({
            BinId,
            ShelfId,
            Name,
            Quantity_Max_Limit: maxLimit,
            Quantity_Current: 0, // Mặc định là 0 khi tạo mới
            Description: Description || '' // Nếu không có thì mặc định là chuỗi rỗng
        });

        return res.status(201).json({
            message: "Tạo Bin thành công!",
            bin: newBin
        });

    } catch (error) {
        console.error("Lỗi khi tạo Bin:", error);
        return res.status(500).json({ error: "Lỗi server", details: error.message });
    }
};

export const updateBin = async (req, res) => {
    try {
        const { id } = req.params; // Lấy BinId từ URL
        const { Name, Quantity_Max_Limit, Quantity_Current, Description } = req.body;

        if (Quantity_Max_Limit !== undefined && Quantity_Current > Quantity_Max_Limit) {
            return res.status(400).json({ error: "Quantity_Current không được lớn hơn Quantity_Max_Limit" });
        }
        // Kiểm tra xem Bin có tồn tại không
        const bin = await Bin.findOne({ where: { BinId: id } });
        if (!bin) {
            return res.status(404).json({ error: `Không tìm thấy Bin với ID ${id}` });
        }

        // Cập nhật thông tin Bin (chỉ cập nhật các trường hợp lệ)
        await bin.update({
            Name: Name || bin.Name,
            Quantity_Max_Limit: Quantity_Max_Limit || bin.Quantity_Max_Limit,
            Quantity_Current: Quantity_Current || bin.Quantity_Current,
            Description: Description || bin.Description
        });

        return res.status(200).json({
            message: "Cập nhật Bin thành công!",
            bin
        });

    } catch (error) {
        console.error("Lỗi khi cập nhật Bin:", error);
        return res.status(500).json({ error: "Lỗi server", details: error.message });
    }
};

export const deleteBin = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ 
                success: false, 
                message: "Thiếu mã bin" 
            });
        }
        
        const result = await util.deleteBin(id);
        
        return res.status(result.status).json({
            success: result.success,
            message: result.message
        });
    } catch (error) {
        console.error("Lỗi khi xóa bin:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Lỗi server", 
            error: error.message 
        });
    }
};


export const getAllShelf = async (req, res) => {
    try {
        const shelfs = await util.getAllShelf();
        return res.status(200).json(shelfs);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách kệ:", error);
        return res.status(500).json({ message: "Lỗi server" });
    }
};

