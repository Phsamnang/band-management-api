const bookingService = require('../services/bookingService');
const bandService = require('../services/bandService');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const getAllBookings = async (req, res) => {
    try {
        const bookings = await bookingService.getAllBookings();
        return successResponse(res, 200, 'Bookings retrieved successfully', bookings);
    } catch (error) {
        return errorResponse(res, 500, 'Error retrieving bookings', error.message);
    }
};

const getBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await bookingService.getBookingById(id);
        return successResponse(res, 200, 'Booking retrieved successfully', booking);
    } catch (error) {
        if (error.message === 'Booking not found') {
            return errorResponse(res, 404, 'Booking not found');
        }
        return errorResponse(res, 500, 'Error retrieving booking', error.message);
    }
};

const createBooking = async (req, res) => {
    try {
        const booking = await bookingService.createBooking(req.body);
        return successResponse(res, 201, 'Booking created successfully', booking);
    } catch (error) {
        if (error.message === 'Band not found' || error.message === 'Client not found') {
            return errorResponse(res, 404, error.message);
        }
        if (error.message.includes('A booking already exists for this band')) {
            return errorResponse(res, 409, error.message);
        }
        return errorResponse(res, 500, 'Error creating booking', error.message);
    }
};

const updateBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await bookingService.updateBooking(id, req.body);
        return successResponse(res, 200, 'Booking updated successfully', booking);
    } catch (error) {
        if (error.message === 'Booking not found' || error.message === 'Band not found' || error.message === 'Client not found') {
            return errorResponse(res, 404, error.message);
        }
        if (error.message.includes('Booking ID in URL does not match')) {
            return errorResponse(res, 400, error.message);
        }
        return errorResponse(res, 500, 'Error updating booking', error.message);
    }
};

const deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await bookingService.deleteBooking(id);
        return successResponse(res, 200, result.message);
    } catch (error) {
        if (error.message === 'Booking not found') {
            return errorResponse(res, 404, 'Booking not found');
        }
        return errorResponse(res, 500, 'Error deleting booking', error.message);
    }
};

const updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return errorResponse(res, 400, 'Status is required');
        }

        const booking = await bookingService.updateBookingStatus(id, status);
        return successResponse(res, 200, 'Booking status updated successfully', booking);
    } catch (error) {
        if (error.message === 'Booking not found') {
            return errorResponse(res, 404, 'Booking not found');
        }
        if (error.message.includes('Invalid status')) {
            return errorResponse(res, 400, error.message);
        }
        return errorResponse(res, 500, 'Error updating booking status', error.message);
    }
};

const getBookingsByBandId = async (req, res) => {
    try {
        const { id } = req.params;
        const bookings = await bandService.getBookingsByBandId(id);
        return successResponse(res, 200, 'Bookings retrieved successfully', bookings);
    } catch (error) {
        if (error.message === 'Band not found') {
            return errorResponse(res, 404, 'Band not found');
        }
        return errorResponse(res, 500, 'Error retrieving bookings', error.message);
    }
};

const getAllBookingsByUser = async (req, res) => {
    try {
        // Get user_id from authenticated user (from token)
        const userId = req.user?.id;
        
        if (!userId) {
            return errorResponse(res, 401, 'Authentication required. User ID must come from token.');
        }

        // Get optional query parameters
        const { band_id, page, limit } = req.query;

        const result = await bookingService.getAllBookingsByUser(
            userId,
            band_id || null,
            page || 1,
            limit || 10
        );

        return successResponse(res, 200, 'Bookings retrieved successfully', result);
    } catch (error) {
        if (error.message === 'User not found') {
            return errorResponse(res, 404, error.message);
        }
        if (error.message === 'Band not found' || error.message.includes('permission')) {
            return errorResponse(res, 403, error.message);
        }
        if (error.message.includes('Page number') || error.message.includes('Limit must')) {
            return errorResponse(res, 400, error.message);
        }
        return errorResponse(res, 500, 'Error retrieving bookings', error.message);
    }
};

module.exports = {
    getAllBookings,
    getBookingById,
    createBooking,
    updateBooking,
    updateBookingStatus,
    deleteBooking,
    getBookingsByBandId,
    getAllBookingsByUser
};

