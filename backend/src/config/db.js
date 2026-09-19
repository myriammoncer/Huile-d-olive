const mysql = require('mysql2');
const path = require('path');
// Charge .env depuis la racine du backend, quel que soit le dossier de lancement (cwd).
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3307,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
});

const db = pool.promise();

db.getConnection()
    .then((conn) => { console.log('✅ Connexion MySQL réussie !'); conn.release(); })
    .catch(err => console.error('❌ Erreur connexion MySQL :', err.code || '', err.message || err));

module.exports = db;