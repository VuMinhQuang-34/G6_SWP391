import express from "express";
import {
    getOrderStatusLogs,
  
} from "../controllers/orderStatusLogsController.js";

const orderStatusLogRoutes = express.Router();

orderStatusLogRoutes.get("/order-status-logs", getOrderStatusLogs);         // Lấy tất cả user
// orderStatusLogRoutes.get('/import-orders', getImportOrders);
// orderStatusLogRoutes.get('/import-orders/:id', getImportOrderDetails);
// orderStatusLogRoutes.put('/import-orders/:id', updateImportOrder); // Route cho cập nhật đơn nhập
// orderStatusLogRoutes.delete('/import-orders/:id', deleteImportOrder); // Route cho xóa đơn nhập

export default orderStatusLogRoutes;
