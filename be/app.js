// app.js
import express from "express";
import chalk from "chalk";
import { config } from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import expressWinston from "express-winston";
import logger from "./configs/logger.js"; // Winston logger

// ===== Nếu muốn bỏ dbPool thì comment dòng này lại =====
import dbPool from "./configs/dbConnection.js";

import { errorHandler, notFoundHandler } from "./middlewares/index.js";

// Routes
import authRoutes from "./routes/authRoutes.js";

// ===== Import Sequelize (models/index.js) =====
import db from "./models/index.js"; 

// Tải các biến môi trường
config();
  
// Khởi tạo ứng dụng Express
const app = express();

/* ------------------------ */
/* Các middleware toàn cục  */
/* ------------------------ */

app.use(helmet());
app.use(cors());

// Ghi log request bằng Morgan => đẩy message vào logger Winston
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// Hoặc dùng express-winston nâng cao (nếu muốn):
// app.use(
//   expressWinston.logger({
//     winstonInstance: logger,
//     meta: true,
//     msg: "HTTP {{req.method}} {{req.url}}",
//     expressFormat: true,
//     colorize: false,
//   })
// );

// Middleware phân tích body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ------------------------ */
/*           Routes         */
/* ------------------------ */

// Ví dụ route chính
app.get("/", (req, res) => {
  res.send("<h1>Xin chào Thế giới!</h1>");
});

// Routes cho xác thực
app.use("/api", authRoutes);

/* ------------------------ */
/*   Xử lý 404 và lỗi chung  */
/* ------------------------ */
app.use(notFoundHandler);

app.use(
  expressWinston.errorLogger({
    winstonInstance: logger,
  })
);

app.use(errorHandler);

/* ------------------------ */
/*  Hàm khởi động server    */
/* ------------------------ */
const startServer = async () => {
  try {
    // ===== Dùng Sequelize để kiểm tra kết nối DB =====
    await db.sequelize.authenticate();
    logger.info("Kết nối Sequelize tới cơ sở dữ liệu thành công.");

    // Tự động tạo bảng nếu chưa có (hoặc update cấu trúc, tuỳ biến)
    await db.sequelize.sync({
      force: false, // true sẽ xóa bảng cũ (cẩn thận mất dữ liệu)
      alter: false, // true sẽ cố gắng sửa bảng cũ cho khớp model
    });
    logger.info("Đã sync (tạo/kiểm tra) các bảng thành công.");

    // Lấy PORT từ .env hoặc mặc định là 9999
    const port = process.env.PORT || 9999;

    // Bắt đầu lắng nghe request
    app.listen(port, () => {
      console.log(
        chalk.bold(
          chalk.bgGreenBright.white("Server đang chạy trên cổng ") +
            chalk.bgRed.white(` ${port} `)
        )
      );
    });
  } catch (err) {
    logger.error(`Kết nối tới DB thất bại: ${err.message}`);
    console.error(
      chalk.red("Không thể kết nối tới cơ sở dữ liệu. Thử lại sau 30 giây...")
    );
    setTimeout(startServer, 30000);
  }
};

// Bắt đầu khởi động server
startServer();
