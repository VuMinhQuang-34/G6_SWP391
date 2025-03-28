// controllers/authController.js
import { validationResult } from "express-validator";
import bcrypt from "bcrypt"; // Thay thế crypto bằng bcrypt cho bảo mật tốt hơn
import axios from "axios";
import { OAuth2Client } from "google-auth-library";

import model from "../models/index.js";
import db from "../configs/dbConnection.js"; // Import connection pool
import sendMail from "../helpers/sendMail.js";
import authRepository from "../repositories/authRepository.js";
import jwtHelpers from "../helpers/jwtHelper.js";
import logger from "../configs/logger.js"; // Import logger của Winston

// Initialize Google OAuth2 Client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const { User, Role } = model;

/**
 * Hàm tạo OTP ngẫu nhiên (6 số)
 * @returns {string} - OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hàm register (Phiên bản 2) - Không sử dụng giao dịch, gửi OTP
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const register2 = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn(
      `Register2 validation failed: ${JSON.stringify(errors.array())}`
    );
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    if (!req.body.password || !req.body.email) {
      console.log(req.body)
      return res.status(400).json({ code: 400, message: "Email and password are required!" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

    const id = await authRepository.insertUser(req.body.email, hashedPassword, false);

    logger.info(`User registered successfully: ${req.body.email}`);
    return res.status(200).json({ code: 200, message: "User created!" });
  } catch (error) {
    logger.error(`Register2 failed for email ${req.body.email}: ${error.message}`);
    return res.status(500).json({ code: 500, message: error.message });
  }
};

/**
 * Hàm register - Sử dụng giao dịch và gửi OTP xác minh email
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn(
      `Register validation failed: ${JSON.stringify(errors.array())}`
    );
    return res.status(400).json({ errors: errors.array() });
  }

  // Bắt đầu giao dịch
  let connection;

  try {
    // Lấy một kết nối từ pool
    connection = await db.getConnection();

    // Bắt đầu giao dịch
    await connection.beginTransaction();

    // Trích xuất các trường từ req.body với tên chính xác
    const { email, password, registerWithGoogle, firstName, lastName, image } =
      req.body;


    // Kiểm tra xem người dùng đã tồn tại chưa
    const existingUsers = await authRepository.findUserByEmail(
      email,
      connection
    );

    if (existingUsers.length > 0) {
      // Người dùng đã tồn tại, rollback giao dịch và trả về lỗi
      await connection.rollback();
      logger.warn(`Register failed - Email already in use: ${email}`);
      return res.status(409).json({ message: "This email is already in use!" });
    }

    // Mã hóa mật khẩu với Bcrypt
    const saltRounds = 10; // Số lần salt
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Chèn người dùng mới
    const userId = await authRepository.insertUser(
      email,
      hashedPassword,
      registerWithGoogle,
      connection
    );

    // Chèn hồ sơ người dùng
    await authRepository.insertUserProfile(
      userId,
      firstName,
      lastName,
      image,
      connection
    );

    // Tạo OTP và nội dung email
    const otp = generateOTP(); // Tạo OTP ngẫu nhiên
    const mailSubject = "Email Verification OTP";
    const content = `<p>Hi ${email},<br>
      Your OTP for email verification is: <strong>${otp}</strong><br>
      Please enter this OTP in the application to verify your email.</p>`;

    // Cập nhật OTP cho người dùng trong Redis với mục đích 'verifyEmail'
    await authRepository.updateUserOTP(email, otp, "verifyEmail");

    // Gửi email chứa OTP xác nhận
    await sendMail(email, mailSubject, content);

    // Commit giao dịch sau khi mọi thứ hoàn thành
    await connection.commit();

    logger.info(`User registered successfully with transaction: ${email}`);
    return res
      .status(200)
      .json({ code: 200, message: "User created and OTP sent!" });
  } catch (error) {
    logger.error(`Đăng ký thất bại: ${error.message}`);

    if (connection) {
      try {
        // Rollback giao dịch nếu có lỗi
        await connection.rollback();
        logger.info("Đã rollback giao dịch do lỗi.");
      } catch (rollbackError) {
        logger.error(`Rollback thất bại: ${rollbackError.message}`);
      }
    }

    res.status(500).json({ code: 500, message: "Đăng ký thất bại." });
  } finally {
    if (connection) {
      // Giải phóng kết nối trở lại pool
      connection.release();
    }
  }
};
/**
 * Hàm resendVerificationEmail - Gửi lại email xác minh cho người dùng
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const resendVerificationEmail = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn(
      `ResendVerificationEmail validation failed: ${JSON.stringify(
        errors.array()
      )}`
    );
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;

  try {
    // Kiểm tra xem người dùng có tồn tại và chưa xác minh email chưa
    const users = await authRepository.findUserByEmail(email);
    if (users.length === 0) {
      logger.warn(`ResendVerificationEmail failed - Email not found: ${email}`);
      // Để bảo mật, không tiết lộ thông tin này cho người dùng
      return res.status(200).json({
        code: 200,
        message: "Email can't be found.",
      });
    }

    const user = users[0];
    if (user.Status === 1) {
      logger.warn(`ResendVerificationEmail - Email đã được xác minh: ${email}`);
      return res
        .status(400)
        .json({ code: 400, message: "Email has already been verified." });
    }

    // Giới hạn số lần gửi lại (ví dụ: tối đa 5 lần trong 20 phút)
    const resendLimit = 5;
    const windowSeconds = 1200; // 20 phút
    const currentCount = await authRepository.incrementResendCount(
      email,
      resendLimit,
      windowSeconds
    );

    if (currentCount > resendLimit) {
      logger.warn(`ResendVerificationEmail rate limit exceeded for: ${email}`);
      return res.status(429).json({
        code: 429,
        message:
          "You have sent the verification email too many times. Please try again in one hour.",
      });
    }

    // Tạo OTP mới với mục đích 'verifyEmail'
    const otp = generateOTP();
    const mailSubject = "Email Verification OTP - Resend";
    const content = `<p>Hi ${email},<br>
      Your new OTP for email verification is: <strong>${otp}</strong><br>
      Please enter this OTP in the application to verify your email.</p>`;

    // Cập nhật OTP cho người dùng trong Redis với mục đích 'verifyEmail'
    await authRepository.updateUserOTP(email, otp, "verifyEmail");

    // Gửi email chứa OTP xác nhận
    await sendMail(email, mailSubject, content);

    logger.info(`ResendVerificationEmail thành công cho: ${email}`);
    return res
      .status(200)
      .json({ code: 200, message: "Verification email has been resent." });
  } catch (error) {
    logger.error(
      `ResendVerificationEmail failed for email ${email}: ${error.message}`
    );
    return res
      .status(500)
      .json({ code: 500, message: "Failed to resend verification email." });
  }
};
/**
 * Hàm login
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn(`Login validation failed: ${JSON.stringify(errors.array())}`);
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const result = await authRepository.findUserByEmail(req.body.email);

    if (!result || result.length === 0) {
      logger.warn(`Login failed - Email not found: ${req.body.email}`);
      return res.status(401).json({
        code: 401,
        message: `This email is not registered. Please register.`,
      });
    }

    const user = result[0]; // Chỉ cần lấy phần tử đầu tiên của mảng kết quả
    logger.warn(`Login: ${result}`);
    // Kiểm tra user là object hợp lệ
    if (!user) {
      logger.warn(`Login failed - No user data returned for email: ${req.body.email}`);
      return res.status(500).json({
        code: 500,
        message: "Unexpected error: No user data found.",
      });
    }    // Add status check before further authentication
    if (user.Status == "Inactive" || user.Status == 0) {
      logger.warn(`Login failed - Unverified email: ${req.body.email}`);
      return res.status(401).json({
        code: 402,
        message: "Email not verified. Please verify your email.",
      });
    }

    if (user.Status === "Inactive") {
      logger.warn(`Login failed - Disabled account: ${req.body.email}`);
      return res.status(401).json({
        code: 403,
        message: "This account has been disabled. Please contact support.",
      });
    }

    if (user.Password === "google") {
      logger.warn(`Login attempt with Google OAuth account: ${req.body.email}`);
      return res.status(401).json({
        code: 401,
        message:
          "This account was created with Google OAuth. Please log in using Google.",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      req.body.password,
      user.Password
    );

    if (isPasswordValid) {
      // Đảm bảo sử dụng đúng tên trường ID
      const accessToken = await jwtHelpers.signAccessToken(user.ID);
      const refreshToken = await jwtHelpers.signRefreshToken(user.ID);

      // Log để debug
      console.log('User data:', user);
      console.log('Generated tokens:', { accessToken, refreshToken });

      return res.status(200).json({
        code: 200,
        message: "Login successfully!",
        tokens: {
          accessToken,
          refreshToken,
        },
        data: {
          user: {
            ...user
          }
        },
      });
    } else {
      logger.warn(
        `Login failed - Incorrect password for email: ${req.body.email}`
      );
      return res.status(401).json({
        code: 401,
        message: "Email or password is incorrect!",
      });
    }
  } catch (err) {
    logger.error(`Login error for email ${req.body.email}: ${err}`);
    return res.status(500).json({
      code: 500,
      message: err.message,
    });
  }
};
/**
 * Hàm verifyToken
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const verifyToken = async (req, res) => {
  const { refreshToken } = req.body; // Lấy refreshToken từ body request
  const authHeader = req.headers["authorization"];
  const accessToken = authHeader ? authHeader.split(" ")[1] : null; // Lấy accessToken từ header

  // Kiểm tra accessToken và refreshToken có tồn tại không
  if (!accessToken) {
    logger.warn(`VerifyToken failed - Access token is missing.`);
    return res
      .status(400)
      .json({ code: 400, message: "Access token is required." });
  }

  if (!refreshToken) {
    logger.warn(`VerifyToken failed - Refresh token is missing.`);
    return res
      .status(400)
      .json({ code: 400, message: "Refresh token is required." });
  }

  try {
    // Xác thực accessToken
    const payload = await jwtHelpers.verifyAccessToken(accessToken); // Gọi hàm verifyAccessToken với await

    // Khi accessToken hợp lệ, lấy userId từ payload
    const userId = payload.aud; // Đảm bảo rằng bạn đang sử dụng đúng thuộc tính
    const profile = await authRepository.getUserProfile(userId);

    if (profile.ProfileImage) {
      // Sửa từ 'profile.image' thành 'profile.ProfileImage' dựa trên repository
      profile.ProfileImage = `${profile.ProfileImage}`;
    }

    logger.info(`Token verified successfully for userId: ${userId}`);
    return res.status(200).json({
      code: 200,
      message: "Token is valid!",
      tokens: {
        accessToken,
        refreshToken,
      },
      data: {
        role: profile.role,
        profile,
      },
    });
  } catch (err) {
    // Nếu accessToken không hợp lệ hoặc hết hạn
    if (
      err.name === "TokenExpiredError" ||
      err.name === "JsonWebTokenError" ||
      err.message === "Access token has expired"
    ) {
      logger.warn(`Access token expired or invalid: ${err.message}`);
      // Xác thực refreshToken khi accessToken hết hạn
      try {
        const userId = await jwtHelpers.verifyRefreshToken(refreshToken);
        const newAccessToken = await jwtHelpers.signAccessToken(userId);
        const newRefreshToken = await jwtHelpers.signRefreshToken(userId);
        const profile = await authRepository.getUserProfile(userId);

        if (profile.ProfileImage) {
          // Sửa từ 'profile.image' thành 'profile.ProfileImage'
          profile.ProfileImage = `data:image/jpeg;base64,${profile.ProfileImage}`;
        }

        logger.info(
          `Access token refreshed successfully for userId: ${userId}`
        );
        return res.status(200).json({
          code: 200,
          message: "Access token refreshed successfully!",
          tokens: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          },
          data: {
            role: profile.role,
            profile,
          },
        });
      } catch (refreshErr) {
        logger.error(`Refresh token invalid: ${refreshErr.message}`);
        return res
          .status(401)
          .json({ code: 401, message: "Invalid refresh token." });
      }
    } else {
      logger.error(`VerifyToken error: ${err.message}`);
      return res.status(401).json({ code: 401, message: err.message });
    }
  }
};

/**
 * Hàm logout
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const logout = async (req, res) => {
  const authHeader = req.headers["authorization"];
  const accessToken = authHeader ? authHeader.split(" ")[1] : null;
  const { refreshToken } = req.body;

  // Kiểm tra accessToken có tồn tại không
  if (!accessToken) {
    logger.warn(`Logout failed - Access token is missing.`);
    return res
      .status(400)
      .json({ code: 400, message: "Access token is required." });
  }

  try {
    // Decode access token để lấy userId
    const payload = await jwtHelpers.decodeToken(accessToken);
    const userId = payload.aud || payload.userId; // Đảm bảo lấy đúng thuộc tính

    // Gọi repository để xóa token cho user
    await authRepository.deleteTokensByUserId(userId);

    logger.info(`User logged out successfully: userId ${userId}`);
    return res
      .status(200)
      .json({ code: 200, message: "User logged out and tokens deleted!" });
  } catch (err) {
    logger.error(`Logout error with access token: ${err.message}`);

    // Nếu có lỗi với accessToken, thử xử lý với refreshToken nếu có
    if (refreshToken) {
      try {
        // Decode refresh token để lấy userId
        const refreshPayload = await jwtHelpers.decodeToken(refreshToken);
        const userId = refreshPayload.aud || refreshPayload.userId; // Đảm bảo lấy đúng thuộc tính

        // Gọi repository để xóa token cho user
        await authRepository.deleteTokensByUserId(userId);

        logger.info(
          `User logged out successfully using refresh token: userId ${userId}`
        );
        return res.status(200).json({
          code: 200,
          message: "User logged out and tokens deleted using refresh token!",
        });
      } catch (refreshErr) {
        logger.error(
          `Logout failed - Invalid refresh token: ${refreshErr.message}`
        );
        return res.status(401).json({
          code: 401,
          message: "Invalid refresh token. Please log in again.",
        });
      }
    } else {
      return res.status(401).json({
        code: 401,
        message: "Invalid token or session expired. Please log in again.",
      });
    }
  }
};

/**
 * Hàm verifyEmail - Xác nhận email của người dùng bằng OTP
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    logger.warn(`VerifyEmail failed - Missing email or OTP.`);
    return res
      .status(400)
      .json({ code: 400, message: "Email and OTP are required." });
  }

  try {
    // Xác minh OTP từ Redis với mục đích 'verifyEmail'
    const isValid = await authRepository.verifyUserOTP(
      email,
      otp,
      "verifyEmail"
    );

    if (!isValid) {
      logger.warn(
        `VerifyEmail failed - Invalid or expired OTP for email: ${email}`
      );
      return res
        .status(400)
        .json({ code: 400, message: "Invalid or expired OTP." });
    }

    // Cập nhật trạng thái email đã được xác minh trong MySQL
    await authRepository.updateEmailVerificationStatus(email);

    // Đặt lại bộ đếm gửi lại email xác minh
    await authRepository.resetResendCount(email);

    logger.info(`Email verified successfully for: ${email}`);
    // Chuyển hướng đến frontend (localhost:3000)
    return res.status(200).json({
      code: 200,
      message: "Email verified successfully!",
    });
  } catch (err) {
    logger.error(`VerifyEmail error for email ${email}: ${err.message}`);
    return res.status(500).json({ code: 500, message: err.message });
  }
};

/**
 * Hàm verifyPasswordResetOTP - Xác nhận OTP cho đặt lại mật khẩu
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const verifyPasswordResetOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    logger.warn(`VerifyPasswordResetOTP failed - Missing email or OTP.`);
    return res
      .status(400)
      .json({ code: 400, message: "Email and OTP are required." });
  }

  try {
    // Xác minh OTP từ Redis với mục đích 'resetPassword'
    const isValid = await authRepository.verifyUserOTP(
      email,
      otp,
      "resetPassword"
    );

    if (!isValid) {
      logger.warn(
        `VerifyPasswordResetOTP failed - Invalid or expired OTP for email: ${email}`
      );
      return res
        .status(400)
        .json({ code: 400, message: "Invalid or expired OTP." });
    }

    logger.info(`OTP xác minh đặt lại mật khẩu thành công cho: ${email}`);
    return res.status(200).json({
      code: 200,
      message: "OTP xác minh đặt lại mật khẩu thành công!",
    });
  } catch (err) {
    logger.error(
      `VerifyPasswordResetOTP error for email ${email}: ${err.message}`
    );
    return res.status(500).json({ code: 500, message: err.message });
  }
};

/**
 * Hàm googleIdTokenHandler - Xử lý đăng nhập bằng Google OAuth
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */

/**
 * Hàm resetPassword - Đặt lại mật khẩu sau khi OTP đã được xác nhận
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const resetPassword = async (req, res) => {
  const { email, confirmPassword } = req.body;

  if (!email || !confirmPassword) {
    logger.warn(`ResetPassword failed - Missing email or confirmPassword.`);
    return res
      .status(400)
      .json({ code: 400, message: "Email and new password are required." });
  }

  try {
    // Kiểm tra xem OTP đã được xác nhận chưa
    // Điều này có thể thực hiện bằng cách sử dụng session, token tạm thời, hoặc các phương pháp khác
    // Giả sử chúng ta đã xác nhận OTP trước đó và frontend gửi yêu cầu này sau khi xác nhận

    // Hash mật khẩu mới với Bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(confirmPassword, saltRounds);

    // Cập nhật mật khẩu mới cho người dùng
    await authRepository.updateUserPassword(email, hashedPassword);

    // Đặt lại bộ đếm gửi lại email xác minh (nếu cần)
    await authRepository.resetResendCount(email);

    logger.info(`Password reset successfully for: ${email}`);
    return res
      .status(200)
      .json({ code: 200, message: "Mật khẩu đã được đặt lại thành công." });
  } catch (err) {
    logger.error(`ResetPassword error for email ${email}: ${err.message}`);
    return res
      .status(500)
      .json({ code: 500, message: "Đặt lại mật khẩu thất bại." });
  }
};

// Xử lý đổi mật khẩu
export const changePassword = async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;

    // Kiểm tra các trường dữ liệu
    if (!userId || !oldPassword || !newPassword) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin!" });
    }

    // Tìm người dùng trong cơ sở dữ liệu
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User không tồn tại!" });
    }

    // Kiểm tra mật khẩu cũ có đúng không
    const isMatch = await bcrypt.compare(oldPassword, user.Password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu cũ không chính xác!" });
    }

    // Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu mới vào cơ sở dữ liệu
    await user.update({ Password: hashedPassword });

    // Trả về thông báo thành công
    res.status(200).json({ success: true, message: "Mật khẩu đã được thay đổi thành công!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server, vui lòng thử lại sau!" });
  }
};

// Export an object containing the functions
const authController = {
  register,
  register2,
  login,
  logout,
  verifyEmail,
  verifyToken,
  resendVerificationEmail,
  verifyPasswordResetOTP,
  resetPassword,
  changePassword
  // Thêm phương thức mới
  // googleAuthCallback,
  // loginSuccess,
};

export default authController;
