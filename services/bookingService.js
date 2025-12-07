const { Booking, Band, Client, User } = require('../models');

const getAllBookings = async () => {
    try {
        const bookings = await Booking.findAll({
            include: [
                {
                    model: Band,
                    as: 'band',
                    attributes: ['band_id', 'band_name', 'genre', 'contact_person', 'phone']
                },
                {
                    model: Client,
                    as: 'client',
                    attributes: ['client_id', 'name', 'phone']
                }
            ],
            order: [['event_date', 'DESC']]
        });
        return bookings;
    } catch (error) {
        throw error;
    }
};

const getBookingById = async (id) => {
    try {
        const booking = await Booking.findByPk(id, {
            include: [
                {
                    model: Band,
                    as: 'band',
                    attributes: ['band_id', 'band_name', 'genre', 'number_of_members', 'contact_person', 'phone', 'website', 'rating']
                },
                {
                    model: Client,
                    as: 'client',
                    attributes: ['client_id', 'name', 'phone']
                }
            ]
        });
        if (!booking) {
            throw new Error('Booking not found');
        }

        // Flatten client data into booking object
        const bookingData = booking.toJSON();
        if (bookingData.client) {
            bookingData.client_name = bookingData.client.name || '';
            bookingData.client_phone = bookingData.client.phone || '';
            // Address is now stored in booking, not client
            bookingData.client_address = bookingData.address || '';
            // Remove nested client object if you don't want it
            // delete bookingData.client;
        } else {
            bookingData.client_name = '';
            bookingData.client_phone = '';
            bookingData.client_address = bookingData.address || '';
        }

        return bookingData;
    } catch (error) {
        throw error;
    }
};

const createBooking = async (bookingData) => {
    try {
        // Validate that band exists
        const band = await Band.findByPk(bookingData.band_id);
        if (!band) {
            throw new Error('Band not found');
        }

        // Check for duplicate booking (same event_date and band_id)
        // Allow creation if existing booking is cancelled
        if (bookingData.event_date && bookingData.band_id) {
            const existingBooking = await Booking.findOne({
                where: {
                    event_date: bookingData.event_date,
                    band_id: bookingData.band_id
                }
            });

            if (existingBooking && existingBooking.status !== 'cancelled') {
                throw new Error(`A booking already exists for this band on ${bookingData.event_date}. Only cancelled bookings can be replaced.`);
            }
        }

        let clientId = "";

        // Map client_name and phone_number to name and phone if provided
        const clientName = bookingData.client_name || bookingData.name;
        const clientPhone = bookingData.phone_number || bookingData.phone;
        // Address is now stored in booking, not client
        const bookingAddress = bookingData.address;

        // If client_id is not provided, check for client name and phone
        if (clientName && clientPhone) {
            // Search for existing client by both name and phone
            let client = await Client.findOne({
                where: {
                    name: clientName,
                    phone: clientPhone
                }
            });

            if (!client) {
                // Create new client if not found (no address in client model)
                client = await Client.create({
                    name: clientName,
                    phone: clientPhone
                });
            }

            clientId = client.client_id;
        }

        // If still no client_id, throw error
        if (!clientId && !bookingData.client_id) {
            throw new Error('Client information is required. Please provide either client_id or client details (client_name, phone_number)');
        }

        // If client_id was provided directly, use it
        if (!clientId && bookingData.client_id) {
            clientId = bookingData.client_id;
        }

        // Validate that client exists
        const client = await Client.findByPk(clientId);
        if (!client) {
            throw new Error('Client not found');
        }

        // Prepare booking data
        // Remove client-specific fields that are not part of the booking model
        const {
            client_name, phone_number, name, phone,
            ...bookingFields
        } = bookingData;

        bookingFields.client_id = clientId;
        
        // Store address in booking if provided
        if (bookingAddress !== undefined) {
            bookingFields.address = bookingAddress;
        }

        // Use band price as total_amount if not provided
        if (!bookingFields.total_amount && band.price) {
            bookingFields.total_amount = parseFloat(band.price);
        }

        // Calculate balance_due if not provided
        if (!bookingFields.balance_due && bookingFields.total_amount && bookingFields.deposit_amount) {
            bookingFields.balance_due = parseFloat(bookingFields.total_amount) - parseFloat(bookingFields.deposit_amount);
        }

        // Ensure status is set if not provided (though model has default)
        if (!bookingFields.status) {
            bookingFields.status = 'pending';
        }

        const booking = await Booking.create(bookingFields);

        // Reload with associations
        return await getBookingById(booking.booking_id);
    } catch (error) {
        throw error;
    }
};

const updateBooking = async (id, bookingData) => {
    try {
        // If booking_id is provided in body, use it (but validate it matches the id parameter if both are provided)
        const bookingId = bookingData.booking_id ? parseInt(bookingData.booking_id, 10) : parseInt(id, 10);
        
        // If both are provided, they should match
        if (bookingData.booking_id && parseInt(id, 10) !== bookingId) {
            throw new Error('Booking ID in URL does not match booking_id in request body');
        }

        const booking = await Booking.findByPk(bookingId);
        if (!booking) {
            throw new Error('Booking not found');
        }

        // Validate band if band_id is being updated
        if (bookingData.band_id) {
            const band = await Band.findByPk(bookingData.band_id);
            if (!band) {
                throw new Error('Band not found');
            }
        }

        // Validate client if client_id is being updated
        if (bookingData.client_id) {
            const client = await Client.findByPk(bookingData.client_id);
            if (!client) {
                throw new Error('Client not found');
            }
        }

        // Remove booking_id from update data (it's not a field that should be updated)
        const { booking_id, ...updateFields } = bookingData;

        // Handle empty strings - convert to null for optional text fields
        if (updateFields.address === '') {
            updateFields.address = null;
        }
        if (updateFields.special_requests === '') {
            updateFields.special_requests = null;
        }
        if (updateFields.notes === '') {
            updateFields.notes = null;
        }

        // Recalculate balance_due if total_amount or deposit_amount is updated
        if (updateFields.total_amount !== undefined || updateFields.deposit_amount !== undefined) {
            const totalAmount = updateFields.total_amount !== undefined 
                ? parseFloat(updateFields.total_amount) || 0 
                : parseFloat(booking.total_amount) || 0;
            const depositAmount = updateFields.deposit_amount !== undefined 
                ? parseFloat(updateFields.deposit_amount) || 0 
                : parseFloat(booking.deposit_amount) || 0;
            updateFields.balance_due = totalAmount - depositAmount;
        }

        await booking.update(updateFields);

        // Reload with associations
        return await getBookingById(bookingId);
    } catch (error) {
        throw error;
    }
};

const updateBookingStatus = async (id, status) => {
    try {
        // Normalize status: map "confirm" to "confirmed"
        const statusMap = {
            'confirm': 'confirmed',
            'confirmed': 'confirmed',
            'pending': 'pending',
            'cancelled': 'cancelled',
            'cancel': 'cancelled',
            'completed': 'completed',
            'complete': 'completed'
        };

        const normalizedStatus = statusMap[status.toLowerCase()];
        
        // Validate status
        const allowedStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
        if (!normalizedStatus || !allowedStatuses.includes(normalizedStatus)) {
            throw new Error(`Invalid status. Allowed values: pending, confirmed (or confirm), cancelled (or cancel), completed (or complete)`);
        }

        const booking = await Booking.findByPk(id);
        if (!booking) {
            throw new Error('Booking not found');
        }

        await booking.update({ status: normalizedStatus });
        
        // Reload with associations
        return await getBookingById(id);
    } catch (error) {
        throw error;
    }
};

const deleteBooking = async (id) => {
    try {
        const booking = await Booking.findByPk(id);
        if (!booking) {
            throw new Error('Booking not found');
        }
        await booking.destroy();
        return { message: 'Booking deleted successfully' };
    } catch (error) {
        throw error;
    }
};

const getAllBookingsByUser = async (userId, bandId = null, page = 1, limit = 10) => {
    try {
        // Validate that user exists
        const user = await User.findByPk(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Validate pagination parameters
        const pageNumber = parseInt(page, 10) || 1;
        const pageSize = parseInt(limit, 10) || 10;
        
        if (pageNumber < 1) {
            throw new Error('Page number must be greater than 0');
        }
        if (pageSize < 1 || pageSize > 100) {
            throw new Error('Limit must be between 1 and 100');
        }

        // Calculate offset
        const offset = (pageNumber - 1) * pageSize;

        // Build where clause for bookings
        // User can see bookings for bands they own (band.user_id = userId)
        const bookingWhere = {};
        
        // If band_id is provided, validate it belongs to the user
        if (bandId) {
            const bandIdNum = parseInt(bandId, 10);
            const band = await Band.findByPk(bandIdNum);
            if (!band) {
                throw new Error('Band not found');
            }
            // Verify the band belongs to the authenticated user
            if (band.user_id !== userId) {
                throw new Error('You do not have permission to view bookings for this band');
            }
            bookingWhere.band_id = bandIdNum;
        }

        // Build include clause with band filter
        const bandInclude = {
            model: Band,
            as: 'band',
            attributes: ['band_id', 'band_name', 'genre', 'contact_person', 'phone'],
            where: {
                user_id: userId  // Only show bookings for bands owned by this user
            },
            required: true  // INNER JOIN - only bookings with bands owned by user
        };

        // Get total count
        const totalCount = await Booking.count({
            where: bookingWhere,
            include: [
                {
                    model: Band,
                    as: 'band',
                    where: {
                        user_id: userId
                    },
                    required: true
                }
            ]
        });

        // Get paginated bookings
        const bookings = await Booking.findAll({
            where: bookingWhere,
            include: [
                bandInclude,
                {
                    model: Client,
                    as: 'client',
                    attributes: ['client_id', 'name', 'phone']
                }
            ],
            order: [['created_at', 'DESC']],
            limit: pageSize,
            offset: offset
        });

        // Transform bookings to include client_address from address field
        const transformedBookings = bookings.map(booking => {
            const bookingData = booking.toJSON();
            // Add client_address field from address (for consistency with getBookingById)
            bookingData.client_address = bookingData.address || '';
            return bookingData;
        });

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalCount / pageSize);
        const hasNextPage = pageNumber < totalPages;
        const hasPreviousPage = pageNumber > 1;

        // Get statistics counts
        const baseInclude = [
            {
                model: Band,
                as: 'band',
                where: {
                    user_id: userId
                },
                required: true
            }
        ];

        // Total confirmed bookings
        const totalConfirm = await Booking.count({
            where: {
                ...bookingWhere,
                status: 'confirmed'
            },
            include: baseInclude
        });

        // Total pending bookings
        const totalPending = await Booking.count({
            where: {
                ...bookingWhere,
                status: 'pending'
            },
            include: baseInclude
        });

        // Total completed bookings
        const totalCompleted = await Booking.count({
            where: {
                ...bookingWhere,
                status: 'completed'
            },
            include: baseInclude
        });

        return {
            bookings: transformedBookings,
            pagination: {
                currentPage: pageNumber,
                pageSize: pageSize,
                totalCount: totalCount,
                totalPages: totalPages,
                hasNextPage: hasNextPage,
                hasPreviousPage: hasPreviousPage
            },
            stats: {
                total_booking: totalCount,
                total_confirm: totalConfirm,
                total_pending: totalPending,
                total_completed: totalCompleted
            }
        };
    } catch (error) {
        throw error;
    }
};

module.exports = {
    getAllBookings,
    getBookingById,
    createBooking,
    updateBooking,
    updateBookingStatus,
    deleteBooking,
    getAllBookingsByUser
};

