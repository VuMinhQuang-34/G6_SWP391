import express from "express";
import {
    test
} from "../controllers/testController.js";

const testRoutes = express.Router();

testRoutes.post("/test", test);        
export default testRoutes;
