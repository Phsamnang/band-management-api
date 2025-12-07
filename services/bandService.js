const { Band, Booking, Client, User } = require('../models');
const { Op } = require('sequelize');

const getAllBands = async (userId = null, bandName = null, date = null) => {
    try {
        const whereClause = { is_active: true };
        
        // Filter by user_id if provided
        if (userId) {
            whereClause.user_id = userId;
        }
        
        // Filter by band name (case-insensitive search)
        if (bandName) {
            whereClause.band_name = {
                [Op.iLike]: `%${bandName}%`
            };
        }
        
        // If date is provided, exclude bands that have non-cancelled bookings on that date
        // Show only bands that are available (not booked) on that date
        if (date) {
            // Find band_ids that have non-cancelled bookings on this date
            const bookedBands = await Booking.findAll({
                where: {
                    event_date: date,
                    status: {
                        [Op.ne]: 'cancelled' // Exclude cancelled bookings (cancelled = available)
                    }
                },
                attributes: ['band_id'],
                raw: true
            });
            
            // Extract unique band_ids that are booked
            const bookedBandIds = [...new Set(bookedBands.map(b => b.band_id).filter(id => id !== null))];
            
            // Exclude these band_ids from the query (show only available bands)
            if (bookedBandIds.length > 0) {
                whereClause.band_id = {
                    [Op.notIn]: bookedBandIds
                };
            }
            // If no bands are booked, all bands are available, so no need to filter
        }
        
        const bands = await Band.findAll({
            where: whereClause,
            order: [['band_name', 'ASC']]
        });
        
        return bands;
    } catch (error) {
        throw error;
    }
};

const getAllBandsByUser = async (userId) => {
    try {
        if (!userId) {
            throw new Error('User ID is required');
        }
        
        // Validate user exists
        const user = await User.findByPk(userId);
        if (!user) {
            throw new Error('User not found');
        }
        
        const bands = await Band.findAll({
            where: {
                user_id: userId,
                is_active: true
            },
            order: [['band_name', 'ASC']]
        });
        return bands;
    } catch (error) {
        throw error;
    }
};

const createBand = async (bandData) => {
    try {
        // Validate user exists if user_id is provided
        if (bandData.user_id) {
            const user = await User.findByPk(bandData.user_id);
            if (!user) {
                throw new Error('User not found');
            }
        }
        
        const band = await Band.create(bandData);
        return band;
    } catch (error) {
        throw error;
    }
};

const updateBand = async (id, bandData) => {
    try {
        const band = await Band.findByPk(id);
        if (!band) {
            throw new Error('Band not found');
        }
        await band.update(bandData);
        return band;
    } catch (error) {
        throw error;
    }
};

const getBandById = async (id) => {
    try {
        const band = await Band.findByPk(id, {
            include: [{
                model: Booking,
                as: 'bookings',
                attributes: ['booking_id', 'client_id', 'event_type', 'event_date', 'address', 'status', 'total_amount', 'deposit_amount', 'balance_due', 'special_requests', 'notes', 'created_at', 'updated_at'],
                include: [{
                    model: Client,
                    as: 'client',
                    attributes: ['client_id', 'name', 'phone']
                }]
            }]
        });
        if (!band) {
            throw new Error('Band not found');
        }
        
        // Flatten client data in bookings array
        const bandData = band.toJSON();
        if (bandData.bookings && Array.isArray(bandData.bookings)) {
            bandData.bookings = bandData.bookings.map(booking => {
                if (booking.client) {
                    booking.client_name = booking.client.name || '';
                    booking.client_phone = booking.client.phone || '';
                    // Address is now stored in booking, not client
                    booking.client_address = booking.address || '';
                    // Remove nested client object
                    delete booking.client;
                } else {
                    booking.client_name = '';
                    booking.client_phone = '';
                    booking.client_address = booking.address || '';
                }
                return booking;
            });
        }
        
        return bandData;
    } catch (error) {
        throw error;
    }
};

const getBookingsByBandId = async (bandId) => {
    try {
        // Validate band exists
        const band = await Band.findByPk(bandId);
        if (!band) {
            throw new Error('Band not found');
        }

        const bookings = await Booking.findAll({
            where: {
                band_id: bandId
            },
            include: [{
                model: Client,
                as: 'client',
                attributes: ['client_id', 'name', 'phone']
            }],
            order: [['event_date', 'DESC'], ['created_at', 'DESC']]
        });

        // Flatten client data in bookings array
        const bookingsData = bookings.map(booking => {
            const bookingData = booking.toJSON();
            if (bookingData.client) {
                bookingData.client_name = bookingData.client.name || '';
                bookingData.client_phone = bookingData.client.phone || '';
                // Address is now stored in booking, not client
                bookingData.client_address = bookingData.address || '';
                // Remove nested client object
                delete bookingData.client;
            } else {
                bookingData.client_name = '';
                bookingData.client_phone = '';
                bookingData.client_address = bookingData.address || '';
            }
            return bookingData;
        });

        return bookingsData;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    getAllBands,
    getAllBandsByUser,
    createBand,
    updateBand,
    getBandById,
    getBookingsByBandId
};
