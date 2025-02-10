'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);  // tên file hiện tại (index.js)
const env = process.env.NODE_ENV || 'development';
const db = {};

// Lấy cấu hình từ biến môi trường
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'G6_SWP';

// Khởi tạo đối tượng sequelize kết nối DB
let sequelize;
if (process.env.DATABASE_URL) {
  // Nếu có DATABASE_URL, sử dụng nó
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    protocol: 'mysql',
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false,
      },
    },
  });
} else {
  // Kết nối thông qua các thông tin trong .env
  sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'mysql',
  });
}

// Đọc tất cả file .js trong thư mục models (trừ index.js) và import model
fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf('.') !== 0 &&            // Bỏ qua file ẩn
      file !== basename &&                  // Bỏ qua file index.js này
      file.slice(-3) === '.js'              // Chỉ lấy file .js
    );
  })
  .forEach((file) => {
    // Import model (ví dụ require('./User.js')(sequelize, Sequelize.DataTypes))
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Gọi associate cho từng model nếu có
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Lưu trữ sequelize và Sequelize constructor để dùng ở nơi khác
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
