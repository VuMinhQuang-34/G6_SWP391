import chalk from "chalk";

// Middleware để xử lý các lỗi không mong muốn
export const errorHandler = (err, req, res, next) => {
  // Log lỗi với màu sắc
  console.error(chalk.red("Error occurred:"), chalk.red(err.stack));

  // Xác định mã trạng thái lỗi
  const statusCode = err.statusCode || 500;

  // Trả về phản hồi lỗi cho client
  res.status(statusCode).json({
    code: statusCode,
    message: err.message || "Internal Server Error",
    // Nếu cần, có thể gửi thêm thông tin lỗi ở đây
    error: process.env.NODE_ENV === "development" ? err.stack : {}, // Hiển thị stack trace chỉ trong môi trường phát triển
  });
};
