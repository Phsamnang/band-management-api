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

// Sync database
db.sequelize.sync().then(() => {
    console.log('Database connected and synced');
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((err) => {
    console.error('Failed to sync database:', err);
});
