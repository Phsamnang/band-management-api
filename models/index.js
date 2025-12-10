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
  let cleanUrl = databaseUrl.replace(/^jdbc:/, '');
  
  // Validate and fix URL format
  try {
    const url = new URL(cleanUrl);
    if (!url.protocol || !url.hostname) {
      throw new Error('Invalid DATABASE_URL: missing protocol or hostname');
    }
    if (!url.username) {
      throw new Error('Invalid DATABASE_URL: missing username');
    }
    
    // Ensure password is a string (empty string if missing, not null/undefined)
    // If password is missing from URL, Sequelize will pass undefined which causes the error
    // Reconstruct URL to ensure password is always a string
    const password = url.password || '';
    const auth = password ? `${url.username}:${password}` : url.username;
    cleanUrl = `${url.protocol}//${auth}@${url.host}${url.pathname}${url.search}`;
    
  } catch (urlError) {
    if (urlError.code === 'ERR_INVALID_URL') {
      throw new Error(`Invalid DATABASE_URL format. Expected format: postgresql://username:password@host:port/database. Error: ${urlError.message}`);
    }
    throw urlError;
  }
  
  sequelize = new Sequelize(cleanUrl, {
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
