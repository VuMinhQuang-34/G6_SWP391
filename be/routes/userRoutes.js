import express from "express";
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
} from "../controllers/userController.js";

const userRoutes = express.Router();

userRoutes.get("/users", getAllUsers);         // Lấy tất cả user
userRoutes.post("/users", createUser);         // Tạo user mới
userRoutes.get("/users/:id", getUserById);      // Lấy user theo ID
userRoutes.put("/users/:id", updateUser);       // Cập nhật user theo ID
userRoutes.delete("/users/:id", deleteUser);    // Xóa user theo ID

export default userRoutes;
