const express = require('express');
const router = express.Router();
const bandController = require('../controllers/bandController');
const bookingController = require('../controllers/bookingController');
const { authenticate } = require('../middleware/auth');

router.get('/', bandController.getAllBands);
router.get('/my-bands', authenticate, bandController.getMyBands);
router.get('/user', authenticate, bandController.getAllBandsByUser);
router.get('/:id/bookings', bookingController.getBookingsByBandId);
router.get('/:id', bandController.getBandById);
router.post('/', authenticate, bandController.createBand);
router.put('/:id', authenticate, bandController.updateBand);

module.exports = router;
