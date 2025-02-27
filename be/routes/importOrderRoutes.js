import express from "express";
import {
    createImportOrder,
    getImportOrders,
    getImportOrderDetails,
    updateImportOrder,
    deleteImportOrder,
    approveImportOrder,
    checkImportOrder,
    getBooksByImportOrderId,
    approveWMS
} from "../controllers/importOrderController.js";

const importOrderRoutes = express.Router();

importOrderRoutes.post("/import-orders", createImportOrder);         // Lấy tất cả user
importOrderRoutes.get('/import-orders', getImportOrders);
importOrderRoutes.get('/import-orders/:id', getImportOrderDetails);
importOrderRoutes.put('/import-orders/:id', updateImportOrder); // Route cho cập nhật đơn nhập
importOrderRoutes.delete('/import-orders/:id', deleteImportOrder); // Route cho xóa đơn nhập
importOrderRoutes.patch('/import-orders/:id', approveImportOrder); // Route cho xóa đơn nhập
importOrderRoutes.post('/import-orders/:id/approveWMS', approveWMS); // Route cho xóa đơn nhập
importOrderRoutes.post('/import-orders/:id/check', checkImportOrder); // Route cho xóa đơn nhập
importOrderRoutes.get('/import-orders/:id/books', getBooksByImportOrderId); // Route cho xóa đơn nhập

export default importOrderRoutes;
