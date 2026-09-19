const db = require('../config/db');
const geoip = require('geoip-lite');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * Géolocalisation locale via geoip-lite (base MaxMind embarquée).
 * Aucun appel réseau, illimité, ~1 ms par lookup.
 */
function geolocate(rawIp) {
    if (!rawIp) return { country: 'Inconnu', city: 'Inconnu' };

    // Normalise l'IP (retire préfixe IPv6, prend la première si liste)
    const ip = rawIp.split(',')[0].trim().replace(/^::ffff:/, '');

    // IPs locales
    if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') ||
        ip.startsWith('10.') || ip.startsWith('172.16.')) {
        return { country: 'Local', city: 'Local' };
    }

    const geo = geoip.lookup(ip);
    if (!geo) return { country: 'Inconnu', city: 'Inconnu' };

    return {
        country: geo.country || 'Inconnu',   // code ISO 2 lettres (FR, TN, US…)
        city:    geo.city    || 'Inconnu',
    };
}

// POST /api/tracking (public)
const trackVisit = asyncHandler(async (req, res) => {
    const { page, appareil, navigateur } = req.body;
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString();

    const { country, city } = geolocate(ip);

    await db.query(
        'INSERT INTO visites (ip, pays, ville, page, appareil, navigateur) VALUES (?, ?, ?, ?, ?, ?)',
        [ip, country, city, page || null, appareil || null, navigateur || null],
    );

    res.status(201).json({ message: 'Visite enregistrée' });
});

// GET /api/tracking (admin)
const getAllVisites = asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 200, 1000);
    const [rows] = await db.query('SELECT * FROM visites ORDER BY created_at DESC LIMIT ?', [limit]);
    res.json(rows);
});

// GET /api/tracking/stats (admin)
const getStats = asyncHandler(async (req, res) => {
    const [[totalRow]] = await db.query('SELECT COUNT(*) AS total FROM visites');
    const [parPays]     = await db.query('SELECT pays, COUNT(*) AS total FROM visites GROUP BY pays ORDER BY total DESC LIMIT 20');
    const [parVille]    = await db.query('SELECT ville, pays, COUNT(*) AS total FROM visites WHERE ville != "Inconnu" AND ville != "Local" GROUP BY ville, pays ORDER BY total DESC LIMIT 20');
    const [parPage]     = await db.query('SELECT page, COUNT(*) AS total FROM visites WHERE page IS NOT NULL GROUP BY page ORDER BY total DESC LIMIT 20');
    const [parAppareil] = await db.query('SELECT appareil, COUNT(*) AS total FROM visites WHERE appareil IS NOT NULL GROUP BY appareil ORDER BY total DESC');
    const [parNavigateur] = await db.query('SELECT navigateur, COUNT(*) AS total FROM visites WHERE navigateur IS NOT NULL GROUP BY navigateur ORDER BY total DESC LIMIT 10');
    const [parJour]     = await db.query(
        `SELECT DATE(created_at) AS jour, COUNT(*) AS total
         FROM visites
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         GROUP BY jour ORDER BY jour ASC`
    );

    res.json({
        totalVisites: totalRow.total,
        parPays, parVille, parPage, parAppareil, parNavigateur, parJour,
    });
});

module.exports = { trackVisit, getAllVisites, getStats };
