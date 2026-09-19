const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { createMessage, getAllMessages, getUnreadCount, markAsRead, deleteMessage } = require('../controllers/contactController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { contactLimiter } = require('../middleware/rateLimits');

router.post(
    '/',
    contactLimiter,
    [
        body('nom').isString().trim().isLength({ min: 2, max: 100 }).withMessage('Nom requis (2-100 caractères)'),
        body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
        body('sujet').optional({ nullable: true }).isString().isLength({ max: 200 }),
        body('message').isString().trim().isLength({ min: 10, max: 5000 }).withMessage('Message requis (10-5000 caractères)'),
        body('website').optional().isString().isLength({ max: 0 }).withMessage('Bot détecté'), // honeypot
    ],
    validate,
    createMessage,
);

router.get('/', authenticate, requireAdmin, getAllMessages);
router.get('/unread-count', authenticate, requireAdmin, getUnreadCount);
router.put('/:id/lu', authenticate, requireAdmin, markAsRead);
router.delete('/:id', authenticate, requireAdmin, deleteMessage);

module.exports = router;
