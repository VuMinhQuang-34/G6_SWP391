// dbConnection.js
import mysql from "mysql2/promise";
import chalk from "chalk";
import { config } from "dotenv";

config();

const {
  DB_HOST = 'localhost',
  DB_PORT = 3306,
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'G6_SWP'
} = process.env;

const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0
});

const connectWithRetry = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(chalk.green(`Kết nối MySQL thành công: ${DB_NAME}`));
    connection.release();
  } catch (err) {
    console.error(chalk.red(`Lỗi kết nối MySQL: ${err.message}`));
    console.log(chalk.yellow("Thử lại sau 30 giây..."));
    setTimeout(connectWithRetry, 30000);
  }
};

pool.on("error", (err) => {
  console.error(chalk.red("Lỗi pool MySQL:", err));
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    connectWithRetry();
  } else {
    throw err;
  }
});

connectWithRetry();
export default pool;