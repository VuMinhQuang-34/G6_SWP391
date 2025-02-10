// models/index.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Sequelize, DataTypes } from 'sequelize';
import { config } from 'dotenv';

config();

// Fix Windows path issues
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basename = path.basename(__filename);
const db = {};

const {
  DB_HOST = 'localhost',
  DB_PORT = 3306,
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'G6_SWP'
} = process.env;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mysql',
  logging: false
});

try {
  const modelFiles = fs.readdirSync(__dirname)
    .filter(file =>
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js'
    );

  for (const file of modelFiles) {
    const modelModulePath = `file://${path.join(__dirname, file)}`.replace(/\\/g, '/');
    const model = await import(modelModulePath);
    if (model.default) {
      const initialized = model.default(sequelize, DataTypes);
      db[initialized.name] = initialized;
    }
  }
} catch (error) {
  console.error('Error loading models:', error);
}

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;