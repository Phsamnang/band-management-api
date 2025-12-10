const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./models');
const { runMigrations } = require('./utils/runMigrations');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const userRoutes = require('./routes/userRoute');
const bandRoutes = require('./routes/bandRoute');
const bookingRoutes = require('./routes/bookingRoute');

// Auto-run migrations on first request in serverless environment (Vercel)
if (process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    let migrationChecked = false;
    
    // Middleware to run migrations on first request
    app.use(async (req, res, next) => {
        if (!migrationChecked) {
            migrationChecked = true;
            try {
                await runMigrations();
            } catch (error) {
                console.error('Failed to run migrations:', error);
                // Continue anyway - migrations might have already run
            }
        }
        next();
    });
}

app.get('/', (req, res) => {
    res.send('Welcome to the Booking Project API');
});

app.use('/api/users', userRoutes);
app.use('/api/bands', bandRoutes);
app.use('/api/bookings', bookingRoutes);

// Test database connection
db.sequelize.authenticate()
    .then(() => {
        console.log('Database connection established successfully');
    })
    .catch((err) => {
        console.error('Unable to connect to the database:', err);
    });

// Only start server if not in serverless environment (Vercel)
if (process.env.VERCEL !== '1' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
    // Sync database only in non-serverless environments
    // In production, use migrations instead: npx sequelize-cli db:migrate
    const syncOptions = process.env.NODE_ENV === 'production' 
        ? { alter: false } // Don't auto-sync in production
        : { alter: true };  // Allow sync in development
    
    // Sync models in correct order to handle foreign key dependencies
    // Users must be synced before Bands (which references users)
    const syncDatabase = async () => {
        try {
            // Sync User first (no dependencies)
            if (db.User) {
                await db.User.sync(syncOptions);
                console.log('Users table synced');
            }
            
            // Then sync other independent tables
            if (db.Client) {
                await db.Client.sync(syncOptions);
                console.log('Clients table synced');
            }
            
            // Then sync Band (depends on User)
            if (db.Band) {
                await db.Band.sync(syncOptions);
                console.log('Bands table synced');
            }
            
            // Then sync Booking (depends on Band and Client)
            if (db.Booking) {
                await db.Booking.sync(syncOptions);
                console.log('Bookings table synced');
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
                    console.log(`${modelName} table synced`);
                }
            }
            
            console.log('Database connected and synced');
            app.listen(PORT, () => {
                console.log(`Server is running on port ${PORT}`);
            });
        } catch (err) {
            console.error('Failed to sync database:', err);
        }
    };
    
    syncDatabase();
}

// Export app for Vercel serverless functions
module.exports = app;
