const db = require('../models');
const fs = require('fs');
const path = require('path');

let migrationsRun = false;
let migrationPromise = null;

/**
 * Check if a table exists in the database
 */
async function tableExists(tableName) {
    try {
        const queryInterface = db.sequelize.getQueryInterface();
        const tables = await queryInterface.showAllTables();
        return tables.includes(tableName);
    } catch (error) {
        return false;
    }
}

/**
 * Run database migrations automatically
 * This will only run once per process and only if tables don't exist
 */
async function runMigrations() {
    // If migrations already ran, return
    if (migrationsRun) {
        return { success: true, message: 'Migrations already run' };
    }

    // If migrations are currently running, wait for them
    if (migrationPromise) {
        return migrationPromise;
    }

    // Start migration process
    migrationPromise = (async () => {
        try {
            console.log('Checking if database tables exist...');
            
            // Check if Users table exists (first migration)
            const usersExists = await tableExists('Users');
            
            if (usersExists) {
                console.log('Database tables already exist, skipping migrations');
                migrationsRun = true;
                return { success: true, message: 'Tables already exist' };
            }

            console.log('Tables not found. Running migrations to create tables...');
            
            // If tables don't exist, use sync to create them
            // This is safe for first-time setup
            const syncOptions = { force: false, alter: false };
            
            // Sync in correct order
            if (db.User) {
                await db.User.sync(syncOptions);
                console.log('Users table created');
            }
            
            if (db.Client) {
                await db.Client.sync(syncOptions);
                console.log('Clients table created');
            }
            
            if (db.Band) {
                await db.Band.sync(syncOptions);
                console.log('Bands table created');
            }
            
            if (db.Booking) {
                await db.Booking.sync(syncOptions);
                console.log('Bookings table created');
            }
            
            // Sync any other models
            const otherModels = Object.keys(db).filter(key => 
                key !== 'sequelize' && 
                key !== 'Sequelize' && 
                !['User', 'Client', 'Band', 'Booking'].includes(key)
            );
            
            for (const modelName of otherModels) {
                if (db[modelName] && typeof db[modelName].sync === 'function') {
                    await db[modelName].sync(syncOptions);
                    console.log(`${modelName} table created`);
                }
            }
            
            migrationsRun = true;
            console.log('Database tables created successfully');
            return { success: true, message: 'Tables created' };
        } catch (error) {
            console.error('Migration error:', error.message);
            // Don't mark as run if it failed
            migrationPromise = null;
            return { success: false, message: error.message };
        }
    })();

    return migrationPromise;
}

module.exports = { runMigrations };

