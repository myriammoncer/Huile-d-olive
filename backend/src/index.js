const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connexion DB
require('./config/db');

// Routes
const authRoutes = require('./routes/authRoutes');
const produitRoutes = require('./routes/produitRoutes');
const contactRoutes = require('./routes/contactRoutes');
const trackingRoutes = require('./routes/trackingRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/produits', produitRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/tracking', trackingRoutes);

// Route test
app.get('/', (req, res) => {
    res.json({ message: 'Village 1800 API is running !' });
});

// Démarrage serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});