/**
 * Script one-shot : supprime les tables créées par erreur pendant l'itération
 * (recettes, lots, newsletter_subscribers) — non demandées par le client.
 *
 * ⚠ Détruit les tables ET leurs données. À exécuter une seule fois.
 *
 * Lancement :  node src/scripts/dropUnusedTables.js
 */
const db = require('../config/db');

const TABLES_TO_DROP = ['recettes', 'lots', 'newsletter_subscribers'];

(async () => {
    console.log('▶ Suppression des tables non utilisées…\n');
    try {
        for (const table of TABLES_TO_DROP) {
            const [rows] = await db.query(
                `SELECT COUNT(*) AS n FROM information_schema.tables
                 WHERE table_schema = DATABASE() AND table_name = ?`,
                [table],
            );
            if (rows[0].n === 0) {
                console.log(`  ✓ ${table} : n'existe pas (rien à faire)`);
                continue;
            }
            await db.query(`DROP TABLE \`${table}\``);
            console.log(`  🗑 ${table} : supprimée`);
        }
        console.log('\n✅ Nettoyage terminé.');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Erreur :', err.message);
        process.exit(1);
    }
})();
