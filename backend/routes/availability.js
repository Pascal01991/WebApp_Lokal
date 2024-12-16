const express = require('express');
const router = express.Router();
const { getSlots } = require('../controllers/availabilityController');

// Route um die bereits berechneten Slots zu bekommen
router.get('/slots', getSlots);

module.exports = router;
