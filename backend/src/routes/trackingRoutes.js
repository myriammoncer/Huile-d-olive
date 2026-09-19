const express = require('express');
const router = express.Router();
const { trackVisit, getAllVisites, getStats } = require('../controllers/trackingController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { trackingLimiter } = require('../middleware/rateLimits');

router.post('/', trackingLimiter, trackVisit);
router.get('/', authenticate, requireAdmin, getAllVisites);
router.get('/stats', authenticate, requireAdmin, getStats);

module.exports = router;
