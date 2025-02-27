import express from "express";
import {
    getAllStock
} from "../controllers/stockController.js";

const stockRoutes = express.Router();

stockRoutes.get("/stocks", getAllStock);        
export default stockRoutes;
