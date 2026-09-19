/**
 * Village 1800 — API entry point
 * ─────────────────────────────────────────────────────────────
 * - Fail-fast au boot si variables critiques absentes
 * - Helmet (headers de sécurité)
 * - CORS whitelist depuis CORS_ORIGINS
 * - Rate limiting global + spécifique login/contact
 * - Body size limit
 * - Health check /api/health
 * - Error handler global qui masque err.message en prod
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// ─── Fail-fast : variables critiques ────────────────────────
const REQUIRED_ENV = ['JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_NAME'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
    console.error('❌ Variables d\'environnement manquantes :', missing.join(', '));
    console.error('   → copier .env.example en .env et remplir les valeurs.');
    process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️ JWT_SECRET fait moins de 32 caractères. Recommandé : au moins 32.');
}

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// ─── Trust proxy (Railway / Vercel derrière reverse proxy) ──
// Nécessaire pour req.ip correct + rate-limit par IP réelle
app.set('trust proxy', 1);

// ─── Sécurité headers HTTP ──────────────────────────────────
app.use(helmet({
    // API JSON pure → pas besoin de CSP côté serveur
    contentSecurityPolicy: false,
    // Autoriser les images uploadées à être servies cross-origin
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ─── CORS whitelist ─────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, cb) => {
        // Autoriser les requêtes sans Origin (curl, mobile app, healthchecks)
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`CORS bloqué pour l'origine : ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// ─── Rate limit global (protection basique) ─────────────────
app.use('/api/', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,                       // 500 req / 15 min / IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Trop de requêtes. Réessayez plus tard.' },
}));

// ─── Body parsers avec limite ───────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── Connexion DB (import déclenche le pool) ────────────────
require('./config/db');

// ─── Routes API (strict cahier des charges client) ──────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/produits', require('./routes/produitRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/tracking', require('./routes/trackingRoutes'));

// ─── Health check (Railway / Vercel / uptime robot) ─────────
app.get('/api/health', async (req, res) => {
    try {
        const db = require('./config/db');
        await db.query('SELECT 1');
        res.json({
            status: 'ok',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            env: process.env.NODE_ENV || 'development',
        });
    } catch (err) {
        res.status(503).json({ status: 'degraded', message: 'DB unreachable' });
    }
});

// ─── Ping racine ────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({ message: 'Village 1800 API', docs: '/api/health' });
});

// ─── 404 (route non trouvée) ────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ message: 'Route non trouvée' });
});

// ─── Error handler global ───────────────────────────────────
// Masque err.message en prod (évite fuite structure DB / chemins)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    // CORS block → 403 explicite
    if (err && err.message && err.message.startsWith('CORS bloqué')) {
        console.warn('CORS:', err.message);
        return res.status(403).json({ message: 'Origine non autorisée' });
    }
    console.error('❌', err.stack || err);
    res.status(err.status || 500).json({
        message: isProd ? 'Erreur serveur' : (err.message || 'Erreur serveur'),
    });
});

// ─── Démarrage ──────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT} (${process.env.NODE_ENV || 'development'})`);
    console.log(`🌍 CORS autorisé pour : ${allowedOrigins.length ? allowedOrigins.join(', ') : '(aucun)'}`);
});

// ─── Graceful shutdown (Railway envoie SIGTERM) ─────────────
const shutdown = (signal) => {
    console.log(`\n${signal} reçu — arrêt propre…`);
    server.close(() => {
        console.log('✅ Serveur arrêté');
        process.exit(0);
    });
    // Force kill si pas propre en 10s
    setTimeout(() => { console.error('⚠ Arrêt forcé après timeout'); process.exit(1); }, 10000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

module.exports = app;
