import express from "express";
import {
    createImportOrder,
    getImportOrders,
    getImportOrderDetails,
    updateImportOrder,
    deleteImportOrder
} from "../controllers/importOrderController.js";

const importOrderRoutes = express.Router();

importOrderRoutes.post("/import-orders", createImportOrder);         // Lấy tất cả user
importOrderRoutes.get('/import-orders', getImportOrders);
importOrderRoutes.get('/import-orders/:id', getImportOrderDetails);
importOrderRoutes.put('/import-orders/:id', updateImportOrder); // Route cho cập nhật đơn nhập
importOrderRoutes.delete('/import-orders/:id', deleteImportOrder); // Route cho xóa đơn nhập

export default importOrderRoutes;
