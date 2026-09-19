const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const [rows] = await db.query(
        'SELECT id, email, password, role FROM users WHERE email = ? LIMIT 1',
        [email.toLowerCase().trim()],
    );

    // Réponse générique volontairement (évite l'énumération d'emails)
    const genericFail = { message: 'Email ou mot de passe incorrect' };
    if (rows.length === 0) return res.status(401).json(genericFail);

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json(genericFail);

    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    );

    res.json({
        message: 'Connexion réussie',
        token,
        user: { id: user.id, email: user.email, role: user.role },
    });
});

// Retourne le profil courant (pour /me après login)
const me = asyncHandler(async (req, res) => {
    res.json({ user: req.user });
});

module.exports = { login, me };
