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
  authController.register
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

/**
 * @route   GET /api/auth/protected
 * @desc    Truy cập vào một route bảo vệ
 * @access  Riêng tư
 */
router.get("/auth/protected", (req, res) => {
  res.json({ message: "Bạn đã truy cập vào một route bảo vệ!" });
});

/**
 * @route   POST /api/auth/verifyToken
 * @desc    Xác thực token JWT
 * @access  Công khai
 */
router.post("/auth/verifyToken", authController.verifyToken);

/**
 * @route   POST /api/auth/google/idtoken
 * @desc    Xác thực người dùng bằng Google ID Token
 * @access  Công khai
 */
router.post("/auth/google/idtoken", authController.googleIdTokenHandler);

/**
 * @route   POST /api/auth/resend-confirm-otp
 * @desc    Gửi lại OTP để xác thực email
 * @access  Công khai
 */
router.post("/auth/resend-confirm-otp", authController.resendVerificationEmail);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Yêu cầu đặt lại mật khẩu
 * @access  Công khai
 */
router.post("/auth/forgot-password", authController.forgotPasswordRequest);

/**
 * @route   POST /api/auth/verify-reset-password-otp
 * @desc    Xác nhận OTP cho đặt lại mật khẩu
 * @access  Công khai
 */
router.post(
  "/auth/verify-reset-password-otp",
  authController.verifyPasswordResetOTP
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Đặt lại mật khẩu sau khi xác nhận OTP
 * @access  Công khai
 */
router.post("/auth/reset-password", authController.resetPassword);

/**
 * @route   GET /api/health
 * @desc    Kiểm tra trạng thái hệ thống
 * @access  Công khai
 */
router.get("/health", authController.healthCheck);

/**
 * Các Route OAuth Google (Đã Bị Comment)
 *
 * Bỏ comment và cấu hình các route sau để kích hoạt xác thực OAuth Google.
 */

/*
router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get("/auth/google/callback", authController.googleAuthCallback);

router.post("/auth/login-success", authController.loginSuccess);
*/

export default router;
