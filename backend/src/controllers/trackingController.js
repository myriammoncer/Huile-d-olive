const db = require('../config/db');
const axios = require('axios');

// Enregistrer une visite
const trackVisit = async (req, res) => {
    const { page, appareil, navigateur } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    try {
        // Géolocalisation via ip-api.com
        const geoResponse = await axios.get(`http://ip-api.com/json/${ip}`);
        const { country, city } = geoResponse.data;

        await db.query(
            'INSERT INTO visites (ip, pays, ville, page, appareil, navigateur) VALUES (?, ?, ?, ?, ?, ?)',
            [ip, country || 'Inconnu', city || 'Inconnu', page, appareil, navigateur]
        );

        res.status(201).json({ message: 'Visite enregistrée' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
};

// Récupérer toutes les visites (admin)
const getAllVisites = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM visites ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
};

// Statistiques (admin)
const getStats = async (req, res) => {
    try {
        const [totalVisites] = await db.query('SELECT COUNT(*) as total FROM visites');
        const [parPays] = await db.query('SELECT pays, COUNT(*) as total FROM visites GROUP BY pays ORDER BY total DESC');
        const [parPage] = await db.query('SELECT page, COUNT(*) as total FROM visites GROUP BY page ORDER BY total DESC');
        const [parAppareil] = await db.query('SELECT appareil, COUNT(*) as total FROM visites GROUP BY appareil ORDER BY total DESC');

        res.json({
            totalVisites: totalVisites[0].total,
            parPays,
            parPage,
            parAppareil
        });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
};

module.exports = { trackVisit, getAllVisites, getStats };