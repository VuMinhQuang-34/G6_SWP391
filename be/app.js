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
import { Sequelize } from "sequelize";
import defaultRoles from "./seeders/20240101000000-default-roles.js";
import defaultUsers from "./seeders/20240101000001-default-users.js";
import defaultWarehouses from "./seeders/20240101000002-default-warehouses.js";
import defaultShelfs from "./seeders/20240101000003-default-shelfs.js";
import dotenv from "dotenv";

// import routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import stockRoutes from "./routes/stockRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import importOrderRoutes from "./routes/importOrderRoutes.js";
import orderStatusLogRoutes from "./routes/orderStatusLogRoutes.js";
import exportOrderRoutes from "./routes/exportOrderRoutes.js";
import binRoutes from "./routes/binRoutes.js";

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

// Load environment variables
dotenv.config();

// Kiá»ƒm tra JWT_SECRET
if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not defined in environment variables");
  process.exit(1);
}

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
// app.use(cors({
//   origin: 'http://localhost:3000', // Chá»‰ Ä‘á»‹nh nguá»“n cho phÃ©p
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // CÃ¡c phÆ°Æ¡ng thá»©c cho phÃ©p
//   credentials: true // Náº¿u báº¡n cáº§n gá»­i cookie
// }));
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.send("<h1>Xin chÃ o Tháº¿ giá»›i!</h1>");
});
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", categoryRoutes);
app.use("/api", bookRoutes);
app.use("/api", importOrderRoutes);
app.use("/api", orderStatusLogRoutes);
app.use("/api", testRoutes);
app.use("/api", stockRoutes);
app.use("/api", dashboardRoutes);
app.use("/api", exportOrderRoutes);
app.use("/api", binRoutes);

// Error handling
app.use(notFoundHandler);
app.use(expressWinston.errorLogger({ winstonInstance: logger }));
app.use(errorHandler);

// Khá»Ÿi táº¡o database vÃ  seeder
const initializeDatabase = async () => {
  try {
    // Sync database
    await db.sequelize.sync();

    // Kiá»ƒm tra vÃ  táº¡o roles máº·c Ä‘á»‹nh
    const existingRoles = await db.Role.count();
    if (existingRoles === 0) {
      await defaultRoles.up(db.sequelize.getQueryInterface(), db.Sequelize);
      console.log("Default roles created successfully");
    } else {
      console.log("Roles already exist, skipping seeder");
    }

    // Kiá»ƒm tra vÃ  táº¡o users máº·c Ä‘á»‹nh
    const existingUsers = await db.User.count();
    if (existingUsers === 0) {
      await defaultUsers.up(db.sequelize.getQueryInterface(), db.Sequelize);
      console.log("Default users created successfully");
    } else {
      console.log("Users already exist, skipping seeder");
    }

    // Kiá»ƒm tra vÃ  táº¡o kho hÃ ng
    const existingWarehouses = await db.Warehouse.count();
    if (existingWarehouses == 0) {
      await defaultWarehouses.up(
        db.sequelize.getQueryInterface(),
        db.Sequelize
      );
      console.log("Default warehouses created successfully");
    } else {
      console.log("Warehouses already exist, skipping seeder");
    }

    // Kiá»ƒm tra vÃ  táº¡o kho hÃ ng
    const existingShelfs = await db.Shelf.count();
    if (existingShelfs == 0) {
      await defaultShelfs.up(db.sequelize.getQueryInterface(), db.Sequelize);
      console.log("Default Shelfs created successfully");
    } else {
      console.log("Shelfs already exist, skipping seeder");
    }

    console.log("Database synchronized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};

// Gá»i hÃ m khá»Ÿi táº¡o
initializeDatabase();

// Server startup
const startServer = async () => {
  try {
    // Táº¡o káº¿t ná»‘i khÃ´ng cáº§n database
    const tempSequelize = new Sequelize("", DB_USER, DB_PASSWORD, {
      host: DB_HOST,
      dialect: "mysql",
    });

    // Táº¡o database náº¿u chÆ°a cÃ³
    await tempSequelize.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);
    await tempSequelize.close();

    // Káº¿t ná»‘i vá»›i database Ä‘Ã£ táº¡o
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
