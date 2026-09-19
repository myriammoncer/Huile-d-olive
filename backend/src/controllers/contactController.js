const db = require('../config/db');
const asyncHandler = require('../middleware/asyncHandler');

// POST /api/contact (public)
const createMessage = asyncHandler(async (req, res) => {
    const { nom, email, sujet, message, website } = req.body;

    // Honeypot anti-bot : si "website" est rempli, on fait semblant d'accepter
    if (website) {
        console.warn('🛡 Honeypot déclenché — bot bloqué silencieusement');
        return res.status(201).json({ message: 'Message envoyé avec succès' });
    }

    await db.query(
        'INSERT INTO messages (nom, email, sujet, message) VALUES (?, ?, ?, ?)',
        [nom.trim(), email.toLowerCase().trim(), (sujet || '').trim() || null, message.trim()],
    );

    res.status(201).json({ message: 'Message envoyé avec succès' });
});

// GET /api/contact (admin)
const getAllMessages = asyncHandler(async (req, res) => {
    const [rows] = await db.query('SELECT * FROM messages ORDER BY created_at DESC');
    res.json(rows);
});

// GET /api/contact/unread-count (admin) — pour le badge messages non lus
const getUnreadCount = asyncHandler(async (req, res) => {
    const [[row]] = await db.query('SELECT COUNT(*) AS count FROM messages WHERE lu = FALSE');
    res.json({ count: row.count });
});

// PUT /api/contact/:id/lu (admin)
const markAsRead = asyncHandler(async (req, res) => {
    const [result] = await db.query('UPDATE messages SET lu = TRUE WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Message non trouvé' });
    res.json({ message: 'Message marqué comme lu' });
});

// DELETE /api/contact/:id (admin)
const deleteMessage = asyncHandler(async (req, res) => {
    const [result] = await db.query('DELETE FROM messages WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Message non trouvé' });
    res.json({ message: 'Message supprimé' });
});

module.exports = { createMessage, getAllMessages, getUnreadCount, markAsRead, deleteMessage };
