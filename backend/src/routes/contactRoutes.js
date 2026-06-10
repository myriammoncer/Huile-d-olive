const express = require('express');
const router = express.Router();
const { createMessage, getAllMessages, markAsRead } = require('../controllers/contactController');
const auth = require('../middleware/auth');

// Route publique
router.post('/', createMessage);

// Routes privées (admin)
router.get('/', auth, getAllMessages);
router.put('/:id/lu', auth, markAsRead);

module.exports = router;