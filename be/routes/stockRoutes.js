import express from "express";
import {
    getAllStock,
    updateStock
} from "../controllers/stockController.js";

const stockRoutes = express.Router();

stockRoutes.get("/stocks", getAllStock);        
stockRoutes.patch("/stocks", updateStock);   

export default stockRoutes;
