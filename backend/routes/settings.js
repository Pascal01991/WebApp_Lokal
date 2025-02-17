// routes/settings.js

const express = require('express');
const router = express.Router();

// Importiere die Controller-Funktionen
const {
  getSettings,
  createSettings,
  updateSettings
} = require('../controllers/settingsController');

// GET /api/settings
router.get('/', getSettings);

// POST /api/settings
router.post('/', createSettings);

// PUT /api/settings/:id
router.put('/:id', updateSettings);

module.exports = router;
