const db = require('../config/db');

// Envoyer un message
const createMessage = async (req, res) => {
    const { nom, email, message } = req.body;
    try {
        await db.query(
            'INSERT INTO messages (nom, email, message) VALUES (?, ?, ?)',
            [nom, email, message]
        );
        res.status(201).json({ message: 'Message envoyé avec succès' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
};

// Récupérer tous les messages (admin)
const getAllMessages = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM messages ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
};

// Marquer un message comme lu (admin)
const markAsRead = async (req, res) => {
    try {
        await db.query('UPDATE messages SET lu = TRUE WHERE id = ?', [req.params.id]);
        res.json({ message: 'Message marqué comme lu' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
};

module.exports = { createMessage, getAllMessages, markAsRead };