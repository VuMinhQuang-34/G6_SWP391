import mysql from "mysql2/promise"; // Sử dụng giao diện dựa trên promise
import chalk from "chalk";
import { config } from "dotenv";

config(); // Tải các biến môi trường

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

// Tạo một kết nối pool
const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 20, // Điều chỉnh dựa trên nhu cầu của ứng dụng
  queueLimit: 0, // Không giới hạn hàng đợi
});

/**
 * Hàm kiểm tra và tạo cơ sở dữ liệu nếu chưa tồn tại
 */
const createDatabaseIfNotExists = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);
    console.log(chalk.green(`Đã tạo cơ sở dữ liệu ${DB_NAME} nếu chưa tồn tại.`));
  } catch (err) {
    console.error(chalk.red("Lỗi khi tạo cơ sở dữ liệu: " + err.message));
  } finally {
    connection.release();
  }
};

/**
 * Hàm thử kết nối tới cơ sở dữ liệu với cơ chế retry sau 60 giây nếu thất bại.
 */
const connectWithRetry = async () => {
  try {
    await createDatabaseIfNotExists();  // Kiểm tra và tạo cơ sở dữ liệu nếu chưa tồn tại
    const connection = await pool.getConnection();
    console.log(chalk.green(`Đã kết nối tới cơ sở dữ liệu MySQL! Database: ${DB_NAME}`));
    connection.release(); // Giải phóng kết nối trở lại pool
  } catch (err) {
    console.error(chalk.red("Lỗi khi kết nối tới MySQL: " + err.message));
    console.log(chalk.yellow("Thử kết nối lại sau 30 giây..."));
    setTimeout(connectWithRetry, 30000); // Thử lại sau 30 giây
  }
};

// Bắt đầu thử kết nối khi khởi động
connectWithRetry();

// Xử lý các sự kiện lỗi không mong muốn trên pool
pool.on("error", (err) => {
  console.error(chalk.red("Unexpected error on MySQL pool:", err));
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    console.log(chalk.yellow("Kết nối bị mất. Thử kết nối lại..."));
    connectWithRetry();
  } else {
    throw err;
  }
});

export default pool;
