const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

// Login admin
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Vérifier si l'utilisateur existe
        const [rows] = await db.query(
            'SELECT * FROM users WHERE email = ?', 
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        const user = rows[0];

        // Vérifier le mot de passe
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        // Générer le token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            message: 'Connexion réussie',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
};

module.exports = { login };