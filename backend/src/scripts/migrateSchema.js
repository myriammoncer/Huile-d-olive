/**
 * Migration douce : crée les tables manquantes et ajoute les colonnes
 * manquantes sans jamais toucher aux données existantes.
 *
 * Lancement :  npm run migrate  (depuis /backend)
 */
const db = require('../config/db');

// ─── Définition des tables ─────────────────────────────────
// Les tables déjà présentes ne sont pas recréées ; seules
// leurs colonnes manquantes sont ajoutées.

const TABLES = {
    users: {
        create: `CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(191) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role VARCHAR(30) NOT NULL DEFAULT 'admin',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        columns: {},
    },

    produits: {
        create: `CREATE TABLE IF NOT EXISTS produits (
            id INT AUTO_INCREMENT PRIMARY KEY,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        columns: {
            slug: 'VARCHAR(60) UNIQUE',       // identifiant URL (intense, balanced, delicate, hp)
            nom_fr: 'VARCHAR(255)',
            nom_en: 'VARCHAR(255)',
            subtitle_fr: 'VARCHAR(255)',      // ex: "L'Ardente Sauvage"
            subtitle_en: 'VARCHAR(255)',
            lead_short_fr: 'TEXT',            // teaser bref pour cards
            lead_short_en: 'TEXT',
            description_fr: 'TEXT',
            description_en: 'TEXT',
            harvest_fr: 'VARCHAR(255)',       // ex: "Fin octobre — olives vertes"
            harvest_en: 'VARCHAR(255)',
            profil_aromatique_fr: 'VARCHAR(255)',
            profil_aromatique_en: 'VARCHAR(255)',
            suggestions_fr: 'TEXT',            // pairings / idéal sur
            suggestions_en: 'TEXT',
            variete: 'VARCHAR(120)',           // ⚠ à confirmer client
            gamme: 'VARCHAR(40)',              // intense / balanced / delicate / hp
            format: 'VARCHAR(40)',             // 50cl / 3L / 5L / coffret
            image_url: 'VARCHAR(500)',
            image_public_id: 'VARCHAR(255)',
            accent_color: 'VARCHAR(20)',
            actif: 'TINYINT(1) NOT NULL DEFAULT 1',
        },
    },

    messages: {
        create: `CREATE TABLE IF NOT EXISTS messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nom VARCHAR(120) NOT NULL,
            email VARCHAR(191) NOT NULL,
            message TEXT NOT NULL,
            lu TINYINT(1) NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_messages_created (created_at),
            INDEX idx_messages_lu (lu)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        columns: {
            sujet: 'VARCHAR(255)',
        },
    },

    visites: {
        create: `CREATE TABLE IF NOT EXISTS visites (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ip VARCHAR(64),
            pays VARCHAR(80),
            ville VARCHAR(120),
            page VARCHAR(255),
            appareil VARCHAR(80),
            navigateur VARCHAR(120),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_visites_created (created_at),
            INDEX idx_visites_page (page)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        columns: {},
    },

};

// ─── Helpers ────────────────────────────────────────────────
async function existingColumns(table) {
    const [rows] = await db.query(
        `SELECT COLUMN_NAME FROM information_schema.columns
         WHERE table_schema = DATABASE() AND table_name = ?`,
        [table],
    );
    return rows.map((r) => r.COLUMN_NAME);
}

async function addMissingColumns(table, cols) {
    const existing = await existingColumns(table);
    let added = 0;
    for (const [name, type] of Object.entries(cols)) {
        if (existing.includes(name)) continue;
        await db.query(`ALTER TABLE ${table} ADD COLUMN ${name} ${type}`);
        console.log(`     ＋ ${table}.${name} (${type})`);
        added++;
    }
    return added;
}

// ─── Runner ─────────────────────────────────────────────────
(async () => {
    console.log('▶ Migration du schéma…\n');
    try {
        for (const [tableName, { create, columns }] of Object.entries(TABLES)) {
            console.log(`• Table ${tableName}`);
            await db.query(create);
            const added = await addMissingColumns(tableName, columns);
            if (added === 0) console.log('     ✓ déjà à jour');
        }
        console.log('\n✅ Migration terminée avec succès.');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Erreur migration :', err.message);
        process.exit(1);
    }
})();
