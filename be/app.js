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
import authRoutes from "./routes/authRoutes.js";
import db from "./models/index.js";
import { Sequelize } from 'sequelize';

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
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

// Error handling
app.use(notFoundHandler);
app.use(expressWinston.errorLogger({ winstonInstance: logger }));
app.use(errorHandler);

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

