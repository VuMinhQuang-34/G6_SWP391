import express from "express";
import {
    createExportOrder,
    getExportOrders,
    getExportOrderById,
    updateExportOrder,
    deleteExportOrder,
    updateExportOrderStatus
} from "../controllers/exportOrderController.js";

const exportOrderRoutes = express.Router();

exportOrderRoutes.post("/export-orders", createExportOrder);
exportOrderRoutes.get('/export-orders', getExportOrders);
exportOrderRoutes.get('/export-orders/:id', getExportOrderById);
exportOrderRoutes.put('/export-orders/:id', updateExportOrder);
exportOrderRoutes.delete('/export-orders/:id', deleteExportOrder);
exportOrderRoutes.patch('/export-orders/:id', updateExportOrderStatus);

export default exportOrderRoutes; 