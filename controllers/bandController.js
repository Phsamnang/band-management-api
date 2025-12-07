const bandService = require('../services/bandService');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const getAllBands = async (req, res) => {
    try {
        // Get user_id from authenticated user (from token) or query parameter
        const userId = req.user?.id || (req.query.user_id ? parseInt(req.query.user_id) : null);
        // Get search and filter parameters
        const bandName = req.query.band_name || null;
        const date = req.query.date || null;
        
        const bands = await bandService.getAllBands(userId, bandName, date);
        return successResponse(res, 200, 'Bands retrieved successfully', bands);
    } catch (error) {
        return errorResponse(res, 500, 'Error retrieving bands', error.message);
    }
};

const createBand = async (req, res) => {
    try {
        // Get user_id from authenticated user (from token) or request body
        const userId = req.user?.id || req.body.user_id;
        
        if (!userId) {
            return errorResponse(res, 400, 'User ID is required');
        }
        
        // Set user_id from token if not provided in body
        const bandData = {
            ...req.body,
            user_id: userId
        };
        
        const band = await bandService.createBand(bandData);
        return successResponse(res, 201, 'Band created successfully', band);
    } catch (error) {
        if (error.message === 'User not found') {
            return errorResponse(res, 404, 'User not found');
        }
        return errorResponse(res, 500, 'Error creating band', error.message);
    }
};

const getBandById = async (req, res) => {
    try {
        const { id } = req.params;
        const band = await bandService.getBandById(id);
        return successResponse(res, 200, 'Band retrieved successfully', band);
    } catch (error) {
        if (error.message === 'Band not found') {
            return errorResponse(res, 404, 'Band not found');
        }
        return errorResponse(res, 500, 'Error retrieving band', error.message);
    }
};

const getAllBandsByUser = async (req, res) => {
    try {
        // Get user_id from authenticated user (from token only)
        const userId = req.user?.id;
        
        if (!userId) {
            return errorResponse(res, 401, 'Authentication required. User ID must come from token.');
        }
        
        const bands = await bandService.getAllBandsByUser(userId);
        return successResponse(res, 200, 'Bands retrieved successfully', bands);
    } catch (error) {
        if (error.message === 'User not found' || error.message === 'User ID is required') {
            return errorResponse(res, 404, error.message);
        }
        return errorResponse(res, 500, 'Error retrieving bands', error.message);
    }
};

const getMyBands = async (req, res) => {
    try {
        // Get user_id from authenticated user (from token)
        const userId = req.user?.id;
        
        if (!userId) {
            return errorResponse(res, 401, 'Authentication required');
        }
        
        const bands = await bandService.getAllBandsByUser(userId);
        return successResponse(res, 200, 'Bands retrieved successfully', bands);
    } catch (error) {
        if (error.message === 'User not found' || error.message === 'User ID is required') {
            return errorResponse(res, 404, error.message);
        }
        return errorResponse(res, 500, 'Error retrieving bands', error.message);
    }
};

const updateBand = async (req, res) => {
    try {
        const { id } = req.params;
        const band = await bandService.updateBand(id, req.body);
        return successResponse(res, 200, 'Band updated successfully', band);
    } catch (error) {
        if (error.message === 'Band not found') {
            return errorResponse(res, 404, 'Band not found');
        }
        return errorResponse(res, 500, 'Error updating band', error.message);
    }
};

module.exports = {
    getAllBands,
    getAllBandsByUser,
    getMyBands,
    getBandById,
    createBand,
    updateBand
};
