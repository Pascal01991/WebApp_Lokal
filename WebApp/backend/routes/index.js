const express = require('express');
const router = express.Router();

// Beispielroute
router.get('/', (req, res) => {
  res.send('API ist aktiv');
});

module.exports = router;
