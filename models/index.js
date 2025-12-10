'use strict';

// Explicitly require pg to ensure it's available for Sequelize
require('pg');

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  const databaseUrl = process.env[config.use_env_variable];
  
  if (!databaseUrl) {
    throw new Error(`Database URL not found in environment variable: ${config.use_env_variable}`);
  }
  
  // Remove jdbc: prefix if present (for compatibility)
  const cleanUrl = databaseUrl.replace(/^jdbc:/, '');
  
  // Parse URL and extract connection parameters explicitly
  // This ensures password is always a string, not undefined
  try {
    const url = new URL(cleanUrl);
    
    if (!url.protocol || !url.hostname) {
      throw new Error('Invalid DATABASE_URL: missing protocol or hostname');
    }
    if (!url.username) {
      throw new Error('Invalid DATABASE_URL: missing username');
    }
    
    // Extract database name (remove leading slash)
    const database = url.pathname ? url.pathname.slice(1) : '';
    if (!database) {
      throw new Error('Invalid DATABASE_URL: missing database name');
    }
    
    // Extract port (default to 5432 for PostgreSQL)
    const port = url.port ? parseInt(url.port, 10) : 5432;
    
    // Ensure password is always a string (empty string if missing, never undefined/null)
    // This is critical - pg driver requires password to be a string
    const password = url.password !== null && url.password !== undefined ? String(url.password) : '';
    
    // Use explicit connection parameters instead of connection string
    // This ensures password is always passed as a string
    sequelize = new Sequelize(database, url.username, password, {
      host: url.hostname,
      port: port,
      dialect: config.dialect || 'postgres',
      dialectOptions: config.dialectOptions || {},
      logging: config.logging || false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });
    
  } catch (urlError) {
    if (urlError.code === 'ERR_INVALID_URL') {
      throw new Error(`Invalid DATABASE_URL format. Expected format: postgresql://username:password@host:port/database. Error: ${urlError.message}`);
    }
    throw urlError;
  }
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
