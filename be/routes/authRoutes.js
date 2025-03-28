import express from "express";
import validation from "../helpers/validation.js";
import authController from "../controllers/authController.js";
import passport from "passport";
import jwtHelpers from "../helpers/jwtHelper.js";

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Đăng ký người dùng mới
 * @access  Công khai
 */
router.post(
  "/auth/register",
  // Bỏ comment dòng sau để kích hoạt xác thực đăng ký
  // validation.signUpValidation,
  authController.register2
);

/**
 * @route   POST /api/auth/confirm-otp
 * @desc    Xác thực email của người dùng bằng OTP
 * @access  Công khai
 */
router.post("/auth/confirm-otp", authController.verifyEmail);

/**
 * @route   POST /api/auth/login
 * @desc    Xác thực người dùng và đăng nhập
 * @access  Công khai
 */
router.post("/auth/login", validation.loginValidation, authController.login);

/**
 * @route   POST /api/auth/logout
 * @desc    Đăng xuất người dùng đã xác thực
 * @access  Riêng tư
 */
router.post("/auth/logout", authController.logout);



router.post("/auth/change-password", authController.changePassword);

export default router;
