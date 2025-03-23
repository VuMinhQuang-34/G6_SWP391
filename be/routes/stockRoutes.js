import express from "express";
import {
    getAllStock,
    updateStock,
    getStockByIdBook
} from "../controllers/stockController.js";

const stockRoutes = express.Router();

stockRoutes.get("/stocks", getAllStock);
stockRoutes.patch("/stocks", updateStock);
// lấy số lượng tồn kho theo id sách
stockRoutes.get("/stocks/:id", getStockByIdBook);

export default stockRoutes;
