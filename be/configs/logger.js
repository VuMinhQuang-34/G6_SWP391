import winston from "winston";
import path from "path";
import { fileURLToPath } from "url";
import DailyRotateFile from "winston-daily-rotate-file"; // Import winston-daily-rotate-file

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`
  )
);

// Cấu hình log với xoay vòng file log
const logger = winston.createLogger({
  levels,
  format,
  transports: [
    // Sử dụng DailyRotateFile cho các file log
    new DailyRotateFile({
      filename: path.join(__dirname, "../logs/error-%DATE%.log"),
      datePattern: "YYYY-MM-DD", // Định dạng ngày trong tên file
      level: "error",
      maxSize: "20m", // Kích thước tối đa mỗi file log
      maxFiles: "3d", // Giới hạn giữ log trong 3 ngày
    }),
    new DailyRotateFile({
      filename: path.join(__dirname, "../logs/combined-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "3d",
    }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

export default logger;
