/**
 * Middleware d'authentification JWT.
 * ─────────────────────────────────────────────────────────────
 * - `authenticate` : vérifie le token, remplit req.user
 * - `requireAdmin` : vérifie que le user est bien admin
 * Usage typique sur routes admin : [authenticate, requireAdmin, handler]
 */
const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({ message: 'Accès refusé — token manquant' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        const isExpired = err.name === 'TokenExpiredError';
        return res.status(isExpired ? 401 : 403)
            .json({ message: isExpired ? 'Session expirée, reconnectez-vous' : 'Token invalide' });
    }
}

function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
    }
    next();
}

// Rétro-compat : l'ancienne API exportait la fonction directement
module.exports = authenticate;
module.exports.authenticate = authenticate;
module.exports.requireAdmin = requireAdmin;
