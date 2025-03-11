import express from "express";
import {
    createExportOrder,
    getExportOrders,
    getExportOrderById,
    updateExportOrder,
    deleteExportOrder,
    updateExportOrderStatus,
    getOrderStatusLogs
} from "../controllers/exportOrderController.js";

const exportOrderRoutes = express.Router();

// Tạo đơn hàng xuất
exportOrderRoutes.post("/export-orders/", createExportOrder);

// Lấy danh sách đơn hàng xuất
exportOrderRoutes.get("/export-orders/", getExportOrders);

// Lấy chi tiết một đơn hàng xuất theo ID
exportOrderRoutes.get("/export-orders/:id", getExportOrderById);

// Cập nhật thông tin đơn hàng xuất
exportOrderRoutes.put("/export-orders/:id", updateExportOrder);

// Xóa đơn hàng xuất
exportOrderRoutes.delete("/export-orders/:id", deleteExportOrder);

// Cập nhật trạng thái đơn hàng xuất
exportOrderRoutes.patch("/export-orders/:id/status", updateExportOrderStatus);

// Lấy lịch sử trạng thái đơn hàng xuất
exportOrderRoutes.get("/export-orders/:id/status-logs", getOrderStatusLogs);

export default exportOrderRoutes;



