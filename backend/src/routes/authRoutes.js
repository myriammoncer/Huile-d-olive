const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { login, me } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loginLimiter } = require('../middleware/rateLimits');

router.post(
    '/login',
    loginLimiter,
    [
        body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
        body('password').isString().notEmpty().withMessage('Mot de passe requis'),
    ],
    validate,
    login,
);

router.get('/me', authenticate, me);

module.exports = router;
