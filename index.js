const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const userRoutes = require('./routes/userRoute');
const bandRoutes = require('./routes/bandRoute');
const bookingRoutes = require('./routes/bookingRoute');

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
    
    db.sequelize.sync(syncOptions).then(() => {
        console.log('Database connected and synced');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }).catch((err) => {
        console.error('Failed to sync database:', err);
    });
}

// Export app for Vercel serverless functions
module.exports = app;
