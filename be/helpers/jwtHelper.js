import jwt from "jsonwebtoken";
import createError from "http-errors";
import client from "../configs/int_redis.js";
import logger from "winston"; // or use your preferred logging library

function signAccessToken(userId) {
  return new Promise((resolve, reject) => {
    const payload = {};
    const secret = process.env.ACCESS_TOKEN_SECRET;
    console.log(userId);
    const options = {
      expiresIn: "3d",
      audience: userId.toString(),
    };

    jwt.sign(payload, secret, options, (err, token) => {
      if (err) {
        console.log(err.message);
        return reject(createError.InternalServerError(err.message));
      }
      resolve(token);
    });
  });
}

function verifyAccessToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return reject(createError.Unauthorized("Access token has expired"));
        }
        return reject(createError.Unauthorized("Invalid token"));
      }
      if (!payload || !payload.aud) {
        // Kiểm tra thêm thuộc tính cụ thể nếu cần
        return reject(createError.Unauthorized("Invalid token payload"));
      }
      resolve(payload); // Trả về payload nếu thành công
    });
  });
}

function signRefreshToken(userId) {
  return new Promise((resolve, reject) => {
    const payload = {};
    const secret = process.env.REFRESH_TOKEN_SECRET;
    const options = {
      expiresIn: "1y",
      issuer: "127.0.0.1:9999",
      audience: userId.toString(),
    };

    jwt.sign(payload, secret, options, async (err, token) => {
      if (err) {
        console.log("JWT Sign Error:", err.message);
        return reject(createError.InternalServerError(err.message));
      }

      if (!client.isReady) {
        console.log("Redis client is not ready.");
        return reject(
          createError.InternalServerError("Redis client is not ready.")
        );
      }

      try {
        const redisKey = `refreshToken:${userId}`;
        await client.SET(redisKey, token, {
          EX: 365 * 24 * 60 * 60, // Expiration in seconds (1 year)
        });
        resolve(token);
      } catch (redisError) {
        console.log("Redis SET Error:", redisError.message);
        return reject(createError.InternalServerError(redisError.message));
      }
    });
  });
}

// function verifyRefreshToken(refreshToken) {
//   return new Promise((resolve, reject) => {
//     jwt.verify(
//       refreshToken,
//       process.env.REFRESH_TOKEN_SECRET,
//       async (err, payload) => {
//         if (err) return reject(createError.Unauthorized(err.message));

//         const userId = payload.aud;
//         const redisKey = `refreshToken:${userId}`;

//         try {
//           const result = await client.GET(redisKey);
//           if (refreshToken === result) return resolve(userId);
//           reject(createError.Unauthorized("Invalid refresh token"));
//         } catch (redisError) {
//           console.log(redisError.message);
//           return reject(createError.InternalServerError(redisError.message));
//         }
//       }
//     );
//   });
// }
function verifyRefreshToken(refreshToken) {
  return new Promise((resolve, reject) => {
    // Kiểm tra JWT Refresh Token và thời gian sống của nó
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      async (err, payload) => {
        if (err) {
          // logger.warn(`Invalid refresh token: ${err.message}`);
          return reject(createError.Unauthorized("Invalid refresh token"));
        }

        const userId = payload.aud; // Lấy userId từ phần payload của token
        const redisKey = `refreshToken:${userId}`; // Khóa Redis cho refresh token

        // Kiểm tra nếu token đã hết hạn
        const now = Math.floor(Date.now() / 1000); // Thời gian hiện tại tính bằng giây
        if (payload.exp < now) {
          // logger.warn(`Refresh token has expired for user ID: ${userId}`);
          return reject(createError.Unauthorized("Refresh token has expired"));
        }

        try {
          // Lấy giá trị refresh token từ Redis
          const result = await client.GET(redisKey);

          // Nếu refresh token trong Redis trùng với token được truyền vào, thì hợp lệ
          if (refreshToken === result) {
            // logger.info(`Refresh token valid for user ID: ${userId}`);
            return resolve(userId);
          }

          // Nếu token không khớp, trả về lỗi
          // logger.warn(`Invalid refresh token for user ID: ${userId}`);
          reject(createError.Unauthorized("Invalid refresh token"));
        } catch (redisError) {
          // Lỗi khi truy vấn Redis
          // logger.error(`Redis error: ${redisError.message}`);
          reject(
            createError.InternalServerError(
              "Error checking refresh token in Redis"
            )
          );
        }
      }
    );
  });
}

// Hàm để giải mã token mà không xác minh
function decodeToken(token) {
  return new Promise((resolve, reject) => {
    try {
      // Giải mã token mà không xác thực chữ ký
      const payload = jwt.decode(token);

      if (!payload) {
        return reject(createError.Unauthorized("Token không hợp lệ"));
      }

      // Trích xuất userId và các thuộc tính khác từ payload
      const { aud: userId, ...otherPayload } = payload;
      console.log("userId:", userId);

      resolve({ userId, ...otherPayload });
    } catch (err) {
      console.error("Giải mã token thất bại:", err);
      reject(createError.Unauthorized("Token không hợp lệ"));
    }
  });
}

const jwtHelpers = {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  decodeToken, // Thêm hàm decodeToken vào exports
};

export default jwtHelpers;
