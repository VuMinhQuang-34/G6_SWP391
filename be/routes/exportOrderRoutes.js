import express from "express";
import {
    createExportOrder,
    getExportOrders,
    getExportOrderById,
    updateExportOrder,
    deleteExportOrder,
    updateExportOrderStatus,
    getExportOrderStatusLogs
} from "../controllers/exportOrderController.js";
// import { authenticateToken } from "../middleware/auth.js";
// import { validateExportOrder } from "../validations/exportOrderValidation.js";

const exportOrderRoutes = express.Router();

// Apply authentication middleware to all routes
// exportOrderRoutes.use(authenticateToken);

// Create new export order
exportOrderRoutes.post("/export-orders", createExportOrder);

// Get list of export orders with pagination and filters
exportOrderRoutes.get("/export-orders", getExportOrders);

// Get export order details by ID
exportOrderRoutes.get("/export-orders/:id", getExportOrderById);

// Update export order details (only for orders in 'New' status)
exportOrderRoutes.put("/export-orders/:id", updateExportOrder);

// Delete export order (only for orders in 'New' status)
exportOrderRoutes.delete("/export-orders/:id", deleteExportOrder);

// Update export order status
exportOrderRoutes.patch("/export-orders/:id/status", updateExportOrderStatus);

// Get export order status history
exportOrderRoutes.get("/export-orders/:id/status-logs", getExportOrderStatusLogs);

export default exportOrderRoutes;