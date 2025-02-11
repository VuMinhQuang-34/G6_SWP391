// repositories/authRepository.js
import dbPool from "../configs/dbConnection.js";
import client from "../configs/int_redis.js";
import logger from "../configs/logger.js"; // Import logger của Winston

/**
 * Hàm kiểm tra xem email đã tồn tại chưa
 * @param {string} email - Email của người dùng
 * @param {Object} [connection=null] - Kết nối đến DB (tuỳ chọn)
 * @returns {Promise<Array>} - Trả về mảng người dùng nếu tìm thấy
 */

export const findUserByEmail = async (email, connection = null) => {
  try {
    if (!email) {
      logger.warn("Attempted to find user with empty email");
      return [];
    }

    const query = `       
      SELECT * FROM ${process.env.DB_NAME}.user        
      WHERE LOWER(email) = LOWER(?);     
    `;

    const [rows] = connection
      ? await connection.execute(query, [email])
      : await dbPool.execute(query, [email]);

    logger.info(`Tìm kiếm người dùng với email: ${email}`);

    if (!rows || rows.length === 0) {
      logger.warn(`No user found for email: ${email}`);
      return []; // Trả về mảng rỗng nếu không có người dùng
    }
    return rows;  // Trả về kết quả hợp lệ
  } catch (err) {
    logger.error(
      `Lỗi khi tìm kiếm người dùng với email ${email}: ${err.message} `
    );
    throw err;
  }
};
export const findUserByEmailForgotPassword = async (
  email,
  connection = null
) => {
  try {
    const query = `
  SELECT * FROM ${process.env.DB_NAME}.user
      WHERE LOWER(email) = LOWER(?) AND Password != 'google';
  `;
    const [rows] = connection
      ? await connection.execute(query, [email])
      : await dbPool.execute(query, [email]);
    logger.info(`Tìm kiếm người dùng với email: ${email} `);
    return rows;
  } catch (err) {
    logger.error(
      `Lỗi khi tìm kiếm người dùng với email ${email}: ${err.message} `
    );
    throw err;
  }
};

/**
 * Hàm lưu người dùng mới vào CSDL
 * @param {string} email - Email của người dùng
 * @param {string} hashedPassword - Mật khẩu đã được băm
 * @param {boolean} registerWithGoogle - Đăng ký bằng Google hay không
 * @param {Object} [connection=null] - Kết nối đến DB (tuỳ chọn)
 * @returns {Promise<number>} - Trả về ID của người dùng mới
 */
// repositories/authRepository.js

export const insertUser = async (
  email,
  hashedPassword,
  registerWithGoogle,
  connection = null
) => {
  try {
    const query = `
      INSERT INTO ${process.env.DB_NAME}.user(Email, Password, Status, roleId)
  VALUES(?, ?, ?, 2);
  `;
    const status = registerWithGoogle ? 1 : 0;
    const password = registerWithGoogle ? "google" : hashedPassword; // Đặt Password là "google" nếu đăng ký với Google
    const [result] = connection
      ? await connection.execute(query, [email, password, status])
      : await dbPool.execute(query, [email, password, status]);
    logger.info(
      `Chèn người dùng mới với email: ${email}, ID: ${result.insertId} `
    );
    return result.insertId;
  } catch (err) {
    logger.error(
      `Lỗi khi chèn người dùng mới với email ${email}: ${err.message} `
    );
    throw err;
  }
};
/**
 * Hàm lưu hồ sơ người dùng mới vào CSDL
 * @param {number} id - ID của người dùng
 * @param {string} firstname - Tên người dùng
 * @param {string} lastName - Họ người dùng
 * @param {string|null} image - Hình ảnh hồ sơ người dùng (base64 hoặc null)
 * @param {Object} [connection=null] - Kết nối đến DB (tuỳ chọn)
 * @returns {Promise<number>} - Trả về ID của hồ sơ người dùng mới
 */
export const insertUserProfile = async (
  id,
  firstname,
  lastName,
  image,
  connection = null
) => {
  try {
    const profileImage = image ? image : null;
    const query = `
      INSERT INTO ${process.env.DB_NAME}.Student(AccountID, FirstName, LastName, ProfileImage)
  VALUES(?, ?, ?, ?);
  `;
    const [result] = connection
      ? await connection.execute(query, [id, firstname, lastName, profileImage])
      : await dbPool.execute(query, [id, firstname, lastName, profileImage]);
    logger.info(
      `Chèn hồ sơ người dùng với AccountID: ${id}, ProfileID: ${result.insertId} `
    );
    return result.insertId;
  } catch (err) {
    logger.error(
      `Lỗi khi chèn hồ sơ người dùng với AccountID ${id}: ${err.message} `
    );
    throw err;
  }
};

/**
 * Hàm lấy hồ sơ người dùng
 * @param {number} id - ID của người dùng
 * @param {Object} [connection=null] - Kết nối đến DB (tuỳ chọn)
 * @returns {Promise<Object|null>} - Trả về hồ sơ người dùng nếu tìm thấy, ngược lại null
 */
export const getUserProfile = async (id, connection = null) => {
  try {
    // Truy vấn RoleID của người dùng
    const queryRole = `SELECT RoleID FROM ${process.env.DB_NAME}.user WHERE ID = ? `;
    const [roleResult] = connection
      ? await connection.execute(queryRole, [id])
      : await dbPool.execute(queryRole, [id]);

    if (roleResult.length === 0) {
      logger.warn(`Không tìm thấy tài khoản với ID: ${id} `);
      return null; // Không tìm thấy tài khoản
    }

    const role = roleResult[0].RoleID;
    logger.info(`Lấy hồ sơ người dùng với ID: ${id}, RoleID: ${role} `);

    // Định nghĩa các truy vấn cho từng vai trò
    const roleQueries = {
      1: `SELECT r.RoleName AS role FROM ${process.env.DB_NAME}.Role r WHERE r.RoleID = ${role} `, // Admin
      4: `SELECT r.RoleName AS role FROM ${process.env.DB_NAME}.Role r WHERE r.RoleID = ${role} `, // Referee
      5: `SELECT r.RoleName AS role FROM ${process.env.DB_NAME}.Role r WHERE r.RoleID = ${role} `, // Manager
      2: `SELECT st.ProfileImage, st.FirstName, st.LastName, r.RoleName AS role, a.Email, st.ID AS StudentID, st.AccountID 
          FROM ${process.env.DB_NAME}.Student st
          LEFT JOIN ${process.env.DB_NAME}.user a ON a.ID = st.AccountID 
          LEFT JOIN ${process.env.DB_NAME}.Role r ON r.RoleID = a.RoleID
          WHERE st.AccountID = ?; `, // Student
      3: `SELECT st.ProfileImage, st.FirstName, st.LastName, r.RoleName AS role, a.Email, st.ID AS TeacherID, st.AccountID 
          FROM ${process.env.DB_NAME}.Teacher st
          LEFT JOIN ${process.env.DB_NAME}.user a ON a.ID = st.AccountID 
          LEFT JOIN ${process.env.DB_NAME}.Role r ON r.RoleID = a.RoleID
          WHERE st.AccountID = ?; `, // Teacher
    };

    // Kiểm tra xem có truy vấn cho vai trò này không
    if (!roleQueries[role]) {
      logger.warn(`Không có truy vấn cho vai trò với RoleID: ${role} `);
      return null;
    }

    // Thực hiện truy vấn cho vai trò
    const [profileResult] = connection
      ? await connection.execute(roleQueries[role], [id])
      : await dbPool.execute(roleQueries[role], [id]);

    if (profileResult.length === 0) {
      logger.warn(`Không tìm thấy hồ sơ cho người dùng với ID: ${id} `);
      return null; // Không tìm thấy hồ sơ
    }

    logger.info(`Lấy hồ sơ thành công cho người dùng với ID: ${id} `);
    return profileResult[0]; // Trả về hồ sơ người dùng
  } catch (error) {
    logger.error(
      `Lỗi khi lấy hồ sơ người dùng với ID: ${id}, lỗi: ${error.message} `
    );
    return null; // Trả về null nếu có lỗi
  }
};

/**
 * Hàm cập nhật OTP người dùng vào Redis với mục đích cụ thể
 * @param {string} email - Email của người dùng
 * @param {string} otp - OTP được tạo cho người dùng
 * @param {string} type - Mục đích của OTP ('verifyEmail' hoặc 'resetPassword')
 * @returns {Promise<Object>} - Thông báo thành công
 */
export const updateUserOTP = async (email, otp, type) => {
  try {
    // Xác định khóa dựa trên mục đích
    const key = `${type}:${email} `;
    // Lưu OTP vào Redis với khóa xác định và thời gian sống 10 phút
    await client.SET(key, otp, {
      EX: 600, // 10 phút
    });
    logger.info(
      `Cập nhật OTP cho email: ${email}, mục đích: ${type}, OTP: ${otp} `
    );
    return { message: "OTP stored successfully in Redis" };
  } catch (err) {
    logger.error(`Lỗi khi cập nhật OTP cho email ${email}: ${err.message} `);
    throw err;
  }
};

/**
 * Hàm xác minh OTP của người dùng từ Redis với mục đích cụ thể
 * @param {string} email - Email của người dùng
 * @param {string} otp - OTP được gửi cho người dùng
 * @param {string} type - Mục đích của OTP ('verifyEmail' hoặc 'resetPassword')
 * @returns {Promise<boolean>} - Trả về true nếu OTP hợp lệ, ngược lại false
 */
export const verifyUserOTP = async (email, otp, type) => {
  try {
    const key = `${type}:${email} `;
    const storedOTP = await client.GET(key);
    if (storedOTP == otp) {
      logger.info(`OTP hợp lệ cho email: ${email}, mục đích: ${type} `);
      // Xóa OTP sau khi xác minh thành công
      await client.DEL(key);
      return true;
    } else {
      logger.warn(`OTP không hợp lệ cho email: ${email}, mục đích: ${type} `);
      return false;
    }
  } catch (err) {
    logger.error(`Lỗi khi xác minh OTP cho email ${email}: ${err.message} `);
    throw err;
  }
};

/**
 * Hàm cập nhật trạng thái xác thực email
 * @param {string} email - Email của người dùng
 * @param {Object} [connection=null] - Kết nối đến DB (tuỳ chọn)
 * @returns {Promise<Object>} - Kết quả cập nhật
 */
export const updateEmailVerificationStatus = async (
  email,
  connection = null
) => {
  try {
    // Cập nhật trạng thái isVerified trong MySQL
    const updateQuery = `UPDATE ${process.env.DB_NAME}.user SET Status = 1 WHERE email = ? `;
    const [result] = connection
      ? await connection.execute(updateQuery, [email])
      : await dbPool.execute(updateQuery, [email]);

    logger.info(
      `Cập nhật trạng thái xác thực email thành công cho email: ${email} `
    );
    return result;
  } catch (err) {
    logger.error(
      `Lỗi khi cập nhật trạng thái xác thực email ${email}: ${err.message} `
    );
    throw err;
  }
};

/**
 * Hàm xóa token của người dùng khỏi Redis
 * @param {string} token - Token của người dùng
 * @returns {Promise<Object>} - Thông báo thành công
 */
export const deleteToken = async (token) => {
  try {
    await client.DEL(`token:${token} `);
    logger.info(`Xóa token: ${token} khỏi Redis`);
    return { message: "Token deleted successfully from Redis" };
  } catch (err) {
    logger.error(`Lỗi khi xóa token ${token}: ${err.message} `);
    throw err; // Xử lý lỗi nếu có
  }
};

/**
 * Hàm xóa tất cả token của người dùng khỏi Redis dựa trên userId
 * @param {string} userId - ID của người dùng
 * @returns {Promise<Object>} - Thông báo thành công
 */
export const deleteTokensByUserId = async (userId) => {
  try {
    logger.info(`Xóa tokens của userId: ${userId} `);
    // Xóa accessToken và refreshToken của user trong Redis
    await client.DEL(`accessToken:${userId} `);
    await client.DEL(`refreshToken:${userId} `);
    logger.info(`Xóa accessToken và refreshToken của userId: ${userId} `);
    return { message: "Tokens deleted successfully from Redis" };
  } catch (err) {
    logger.error(`Lỗi khi xóa tokens cho userId ${userId}: ${err.message} `);
    throw err; // Xử lý lỗi nếu có
  }
};

/**
 * Hàm ping Redis để kiểm tra kết nối
 * @returns {Promise<string>} - Trả về 'PONG' nếu Redis hoạt động
 */
export const pingRedis = async () => {
  try {
    const response = await client.PING();
    logger.info(`Redis PING response: ${response} `);
    return response;
  } catch (err) {
    logger.error(`Redis PING failed: ${err.message} `);
    throw err;
  }
};

/**
 * Hàm tăng số lần gửi lại email xác minh và đặt thời gian hết hạn nếu là lần đầu
 * @param {string} email - Email của người dùng
 * @param {number} limit - Giới hạn số lần gửi lại
 * @param {number} windowSeconds - Thời gian cửa sổ (giây)
 * @returns {Promise<number>} - Trả về số lần gửi lại hiện tại
 */
export const incrementResendCount = async (
  email,
  limit = 5,
  windowSeconds = 20
) => {
  try {
    const key = `resendCount:${email} `;
    const currentCount = await client.INCR(key);
    if (currentCount === 1) {
      // Đặt thời gian hết hạn cho khóa
      await client.EXPIRE(key, windowSeconds);
    }
    logger.info(`Resend count for ${email}: ${currentCount} `);
    return currentCount;
  } catch (err) {
    logger.error(
      `Lỗi khi tăng resend count cho email ${email}: ${err.message} `
    );
    throw err;
  }
};

/**
 * Hàm lấy số lần gửi lại email xác minh hiện tại
 * @param {string} email - Email của người dùng
 * @returns {Promise<number>} - Trả về số lần gửi lại hiện tại
 */
export const getResendCount = async (email) => {
  try {
    const key = `resendCount:${email} `;
    const count = await client.GET(key);
    return count ? parseInt(count, 10) : 0;
  } catch (err) {
    logger.error(`Lỗi khi lấy resend count cho email ${email}: ${err.message} `);
    throw err;
  }
};

/**
 * Hàm đặt lại số lần gửi lại email xác minh (nếu cần)
 * @param {string} email - Email của người dùng
 * @returns {Promise<void>}
 */
export const resetResendCount = async (email) => {
  try {
    const key = `resendCount:${email} `;
    await client.DEL(key);
    logger.info(`Đặt lại resend count cho email: ${email} `);
  } catch (err) {
    logger.error(
      `Lỗi khi đặt lại resend count cho email ${email}: ${err.message} `
    );
    throw err;
  }
};

/**
 * Hàm cập nhật mật khẩu người dùng
 * @param {string} email - Email của người dùng
 * @param {string} hashedPassword - Mật khẩu đã được băm mới
 * @param {Object} [connection=null] - Kết nối đến DB (tuỳ chọn)
 * @returns {Promise<Object>} - Kết quả cập nhật
 */
export const updateUserPassword = async (
  email,
  hashedPassword,
  connection = null
) => {
  try {
    const query = `UPDATE ${process.env.DB_NAME}.user SET Password = ? WHERE email = ? `;
    const [result] = connection
      ? await connection.execute(query, [hashedPassword, email])
      : await dbPool.execute(query, [hashedPassword, email]);

    logger.info(`Cập nhật mật khẩu cho email: ${email} `);
    return result;
  } catch (err) {
    logger.error(
      `Lỗi khi cập nhật mật khẩu cho email ${email}: ${err.message} `
    );
    throw err;
  }
};

const authRepository = {
  findUserByEmailForgotPassword,
  findUserByEmail,
  insertUser,
  insertUserProfile,
  updateUserOTP,
  verifyUserOTP,
  updateEmailVerificationStatus,
  deleteToken,
  deleteTokensByUserId,
  getUserProfile,
  pingRedis,
  incrementResendCount,
  getResendCount,
  resetResendCount,
  updateUserPassword,
};

export default authRepository;
