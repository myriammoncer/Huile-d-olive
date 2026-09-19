/**
 * Création du premier admin.
 * ─────────────────────────────────────────────────────────────
 * Ordre de priorité pour email/password :
 *   1. Variables d'environnement (ADMIN_EMAIL, ADMIN_INITIAL_PASSWORD)
 *   2. Prompt interactif (inquirer) — pour usage local sécurisé
 *
 * Lancement :  npm run create-admin
 */
const bcrypt = require('bcryptjs');
const db = require('../config/db');
require('dotenv').config();

async function prompt() {
    // inquirer v14 est ESM — import dynamique
    const { default: inquirer } = await import('inquirer');
    return inquirer.prompt([
        {
            type: 'input',
            name: 'email',
            message: 'Email admin :',
            default: process.env.ADMIN_EMAIL || 'admin@village1800.com',
            validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Email invalide',
        },
        {
            type: 'password',
            name: 'password',
            message: 'Mot de passe (12+ caractères recommandés) :',
            mask: '*',
            validate: (v) => v.length >= 8 || 'Au moins 8 caractères',
        },
        {
            type: 'password',
            name: 'confirm',
            message: 'Confirmer le mot de passe :',
            mask: '*',
        },
    ]);
}

(async () => {
    try {
        let email = process.env.ADMIN_EMAIL;
        let password = process.env.ADMIN_INITIAL_PASSWORD;

        if (!email || !password) {
            console.log('ℹ Aucune variable ADMIN_INITIAL_PASSWORD trouvée — passage en mode interactif.\n');
            const answers = await prompt();
            if (answers.password !== answers.confirm) {
                console.error('❌ Les mots de passe ne correspondent pas.');
                process.exit(1);
            }
            email = answers.email.trim().toLowerCase();
            password = answers.password;
        } else {
            email = email.trim().toLowerCase();
            console.log(`ℹ Utilisation des variables d'environnement pour ${email}`);
        }

        const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
            console.log(`⚠ L'admin ${email} existe déjà.`);
            process.exit(0);
        }

        const hashed = await bcrypt.hash(password, 12);
        await db.query(
            'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
            [email, hashed, 'admin'],
        );

        console.log('\n✅ Admin créé avec succès !');
        console.log(`   📧 Email : ${email}`);
        console.log('   🔑 Mot de passe : (défini interactivement, non affiché)');
        console.log('\n⚠ Après création, videz la variable ADMIN_INITIAL_PASSWORD de votre .env.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur :', err.message);
        process.exit(1);
    }
})();
