import fs from 'fs';
import path from 'path';
import { Sequelize, DataTypes } from 'sequelize';
import { config } from 'dotenv';

// Tải các biến môi trường từ .env
config();

// Tạo __filename và __dirname trong ES module
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename); // Lấy thư mục chứa file hiện tại

const basename = path.basename(__filename);
const db = {};
const env = process.env.NODE_ENV || 'development';

// Lấy cấu hình kết nối từ biến môi trường
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'G6_SWP';

// Khởi tạo đối tượng Sequelize để kết nối với MySQL
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mysql',
});

// Log ra đường dẫn thư mục `models` để kiểm tra
const modelsPath = path.join(__dirname); // Đảm bảo chỉ ra đúng thư mục `models`
console.log("Đường dẫn tới thư mục models:", modelsPath);  // In ra đường dẫn để kiểm tra

// Đọc tất cả file .js trong thư mục models (trừ index.js) và import các model
fs.readdirSync(modelsPath)  // Chỉ quét thư mục chính xác
  .filter((file) => {
    return (
      file.indexOf('.') !== 0 &&        // Bỏ qua các file ẩn
      file !== basename &&              // Bỏ qua file index.js này
      file.slice(-3) === '.js'          // Chỉ lấy các file .js
    );
  })
  .forEach((file) => {
    const model = require(path.join(modelsPath, file))(sequelize, DataTypes);
    db[model.name] = model;
  });

// Đồng bộ các models với cơ sở dữ liệu
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Lưu lại sequelize và Sequelize constructor để sử dụng ở nơi khác
db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
