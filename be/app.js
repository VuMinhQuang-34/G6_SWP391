// app.js
import express from "express";
import chalk from "chalk";
import { config } from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import expressWinston from "express-winston";
import logger from "./configs/logger.js";
import { errorHandler, notFoundHandler } from "./middlewares/index.js";
import db from "./models/index.js";
import { Sequelize } from 'sequelize';
import defaultRoles from './seeders/20240101000000-default-roles.js';
import defaultUsers from './seeders/20240101000001-default-users.js';
import dotenv from 'dotenv';

// import routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import bookRoutes from './routes/bookRoutes.js';
import importOrderRoutes from './routes/importOrderRoutes.js';
import orderStatusLogRoutes from './routes/orderStatusLogRoutes.js';

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

// Load environment variables
dotenv.config();

// Kiểm tra JWT_SECRET
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not defined in environment variables');
  process.exit(1);
}

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
// app.use(cors({
//   origin: 'http://localhost:3000', // Chỉ định nguồn cho phép
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Các phương thức cho phép
//   credentials: true // Nếu bạn cần gửi cookie
// }));
app.use(morgan("combined", {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.send("<h1>Xin chào Thế giới!</h1>");
});
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", categoryRoutes);
app.use('/api', bookRoutes);
app.use('/api', importOrderRoutes);
app.use('/api', orderStatusLogRoutes);

// Error handling
app.use(notFoundHandler);
app.use(expressWinston.errorLogger({ winstonInstance: logger }));
app.use(errorHandler);

// Khởi tạo database và seeder
const initializeDatabase = async () => {
  try {
    // Sync database
    await db.sequelize.sync();

    // Kiểm tra và tạo roles mặc định
    const existingRoles = await db.Role.count();
    if (existingRoles === 0) {
      await defaultRoles.up(db.sequelize.getQueryInterface(), db.Sequelize);
      console.log('Default roles created successfully');
    } else {
      console.log('Roles already exist, skipping seeder');
    }

    // Kiểm tra và tạo users mặc định
    const existingUsers = await db.User.count();
    if (existingUsers === 0) {
      await defaultUsers.up(db.sequelize.getQueryInterface(), db.Sequelize);
      console.log('Default users created successfully');
    } else {
      console.log('Users already exist, skipping seeder');
    }

    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Gọi hàm khởi tạo
initializeDatabase();

// Server startup
const startServer = async () => {
  try {
    // Tạo kết nối không cần database
    const tempSequelize = new Sequelize('', DB_USER, DB_PASSWORD, {
      host: DB_HOST,
      dialect: 'mysql'
    });

    // Tạo database nếu chưa có
    await tempSequelize.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);
    await tempSequelize.close();

    // Kết nối với database đã tạo
    await db.sequelize.authenticate();
    await db.sequelize.sync({ force: false });

    const port = process.env.PORT || 9999;
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    logger.error(`Server startup error: ${err.message}`);
    setTimeout(startServer, 30000);
  }
};
startServer();

