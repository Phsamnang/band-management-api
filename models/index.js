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
    
    // Create a safe version of URL for error messages (hide password)
    const safeUrl = cleanUrl.replace(/:([^:@]+)@/, ':****@');
    
    if (!url.protocol || !url.hostname) {
      throw new Error(`Invalid DATABASE_URL: missing protocol or hostname. URL format: ${safeUrl}`);
    }
    
    // Username might be empty for some database setups, but warn about it
    const username = url.username || '';
    if (!username) {
      console.warn(`Warning: DATABASE_URL has no username. URL: ${safeUrl}`);
    }
    
    // Extract database name (remove leading slash)
    const database = url.pathname ? url.pathname.slice(1) : '';
    if (!database) {
      throw new Error(`Invalid DATABASE_URL: missing database name. URL format: ${safeUrl}`);
    }
    
    // Extract port (default to 5432 for PostgreSQL)
    const port = url.port ? parseInt(url.port, 10) : 5432;
    
    // Ensure password is always a string (empty string if missing, never undefined/null)
    // This is critical - pg driver requires password to be a string
    const password = url.password !== null && url.password !== undefined ? String(url.password) : '';
    
    // If username is missing, try using connection string directly as fallback
    // Some database URLs might have different formats
    if (!username) {
      console.warn('Attempting to use connection string directly due to missing username');
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
      // Use explicit connection parameters instead of connection string
      // This ensures password is always passed as a string
      sequelize = new Sequelize(database, username, password, {
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
    }
    
  } catch (urlError) {
    // If URL parsing fails, try using the connection string directly
    // This handles edge cases where the URL format might be non-standard
    if (urlError.code === 'ERR_INVALID_URL' || urlError.message.includes('missing username')) {
      console.warn('URL parsing failed, attempting to use connection string directly:', urlError.message);
      try {
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
      } catch (fallbackError) {
        const safeUrl = cleanUrl.replace(/:([^:@]+)@/, ':****@');
        throw new Error(`Invalid DATABASE_URL format. Expected: postgresql://username:password@host:port/database. Got: ${safeUrl}. Error: ${fallbackError.message}`);
      }
    } else {
      throw urlError;
    }
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
