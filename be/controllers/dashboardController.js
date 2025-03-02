import db from "../models/index.js"; // Import db từ models
import util from "./common.js"; // Import db từ models
import { Op } from 'sequelize'; // Import Op từ sequelize để sử dụng trong tìm kiếm
const { ImportOrders, ImportOrderDetails, Book, OrderStatusLogs, Fault, Stock } = db; // Destructure các model cần thiết

//#region ADD
export const getDashboardData = async (req, res) => {
    const { SupplierID, ImportDate, Note, orderDetails, CreatedBy } = req.body; // Lấy dữ liệu từ request body

    try {
        
        const rs = {
            totalUsers: await util.getCountUserByStatus(),
            totalUsersActive: await util.getCountUserByStatus("Active"),
            totalUsersInactive: await util.getCountUserByStatus("Inactive"),
            totalIO: await util.getCountIOByStatus(),
            totalIONew: await util.getCountIOByStatus("New"),
            totalIOApprove: await util.getCountIOByStatus("Approve"),
            totalIOReceive: await util.getCountIOByStatus("Receive"),
            totalIOApproveImport: await util.getCountIOByStatus("ApproveImport"),
            stocks: await util.getAllStock(),
            totalStockQuantity: await util.getTotalQuantityStock(),
            totalBook: await util.getTotalBook()
        }
        // Trả về phản hồi thành công
        res.status(201).json({
            message: 'OK',
            data: rs
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Đã xảy ra lỗi khi tạo đơn nhập hàng!',
            error: error.message,
        });
    }
};
