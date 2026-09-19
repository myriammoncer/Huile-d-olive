/**
 * Rate limiters spécifiques par endpoint sensible.
 * Utilisent x-forwarded-for grâce à app.set('trust proxy', 1) dans index.js.
 */
const rateLimit = require('express-rate-limit');

const commonHeaders = { standardHeaders: true, legacyHeaders: false };

// Login : contre le brute-force
const loginLimiter = rateLimit({
    ...commonHeaders,
    windowMs: 15 * 60 * 1000,       // 15 min
    max: 5,                          // 5 tentatives
    message: { message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
    skipSuccessfulRequests: true,    // succès ne compte pas
});

// Contact : contre le spam
const contactLimiter = rateLimit({
    ...commonHeaders,
    windowMs: 60 * 60 * 1000,       // 1 h
    max: 3,                          // 3 messages / heure / IP
    message: { message: 'Trop de messages envoyés. Réessayez plus tard.' },
});

// Newsletter : idem
const newsletterLimiter = rateLimit({
    ...commonHeaders,
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { message: 'Trop d\'inscriptions. Réessayez plus tard.' },
});

// Tracking : plus permissif (chaque page vue déclenche un hit)
const trackingLimiter = rateLimit({
    ...commonHeaders,
    windowMs: 60 * 1000,             // 1 min
    max: 60,                          // 60 hits/min
});

module.exports = { loginLimiter, contactLimiter, newsletterLimiter, trackingLimiter };
