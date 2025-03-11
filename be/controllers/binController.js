import db from "../models/index.js"; // Import db từ models
import { Op } from 'sequelize'; // Import Op từ sequelize để sử dụng trong tìm kiếm
const { ImportOrders, ImportOrderDetails, Book, OrderStatusLogs, User, Bin, Shelf, Warehouse, BookBin } = db; // Destructure các model cần thiết
import util from "./common.js";

export const getAllBin = async (req, res) => {
    try {
        const bins = await util.getAllBin();
        return res.status(200).json(bins);
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
        const { BinId, ShelfId, Name, Quantity_Max_Limit, Quantity_Current, Description } = req.body;

        // Kiểm tra xem các trường bắt buộc có được gửi không
        if (!BinId || !ShelfId || !Name || !Quantity_Max_Limit) {
            return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin Bin' });
        }

        // Kiểm tra xem BinId đã tồn tại chưa
        const existingBin = await Bin.findOne({ where: { BinId } });
        if (existingBin) {
            return res.status(409).json({ error: `Bin với ID ${BinId} đã tồn tại` });
        }

        // Chèn dữ liệu Bin mới vào database
        const newBin = await Bin.create({
            BinId,
            ShelfId,
            Name,
            Quantity_Max_Limit,
            Quantity_Current: Quantity_Current || 0, // Nếu không có thì mặc định là 0
            Description
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
        const bin = await util.deleteBin(req.body);
        return res.status(200).json(bin);
    } catch (error) {
        console.error("Lỗi khi xóa bin", error);
        return res.status(500).json({ message: "Lỗi server" });
    }
};

