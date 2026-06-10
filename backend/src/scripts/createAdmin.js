const bcrypt = require('bcryptjs');
const db = require('../config/db');
require('dotenv').config();

const createAdmin = async () => {
    try {
        const email = 'admin@village1800.com';
        const password = 'Village1800@Admin';

        // Vérifier si l'admin existe déjà
        const [rows] = await db.query(
            'SELECT * FROM users WHERE email = ?', 
            [email]
        );

        if (rows.length > 0) {
            console.log('⚠️ Admin existe déjà !');
            process.exit(0);
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Créer l'admin
        await db.query(
            'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
            [email, hashedPassword, 'admin']
        );

        console.log('✅ Admin créé avec succès !');
        console.log('📧 Email :', email);
        console.log('🔑 Mot de passe :', password);
        process.exit(0);

    } catch (err) {
        console.error('❌ Erreur :', err.message);
        process.exit(1);
    }
};

createAdmin();