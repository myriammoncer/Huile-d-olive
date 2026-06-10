const express = require('express');
const router = express.Router();
const { trackVisit, getAllVisites, getStats } = require('../controllers/trackingController');
const auth = require('../middleware/auth');

// Route publique
router.post('/', trackVisit);

// Routes privées (admin)
router.get('/', auth, getAllVisites);
router.get('/stats', auth, getStats);

module.exports = router;