import db from "../models/index.js"; // Import db từ models
import { Op } from 'sequelize'; // Import Op từ sequelize để sử dụng trong tìm kiếm
const { ImportOrders, ImportOrderDetails, Book, OrderStatusLogs, User } = db; // Destructure các model cần thiết

export const getOrderStatusLogs = async (req, res) => {
    const { orderId, status, orderType } = req.query;
    
    try {
        // Tạo điều kiện tìm kiếm
        const conditions = {};
        if (orderId) conditions.OrderId = orderId; // Thêm điều kiện OrderId
        if (status) conditions.Status = status; // Thêm điều kiện Status
        if (orderType) conditions.OrderType = orderType; // Thêm điều kiện Status

        // Lấy danh sách OrderStatusLogs
        const logs = await OrderStatusLogs.findAll({
            where: conditions,
            order: [['Created_Date', 'DESC']], // Sắp xếp theo ngày tạo giảm dần
        });

        // Ghép thông tin người dùng vào từng log
        const formattedLogs = await Promise.all(logs.map(async (log) => {
            const user = await User.findOne({ where: { userId: log.CreatedBy } }); // Tìm người dùng theo CreatedBy
            return {
                ...log.toJSON(),
                CreatedBy: user || null
            };
        }));

        return res.status(200).json(formattedLogs);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách OrderStatusLogs:", error);
        return res.status(500).json({ message: "Lỗi server" });
    }
};

// Các hàm CRUD khác (update, delete, etc.) sẽ được thêm vào đây