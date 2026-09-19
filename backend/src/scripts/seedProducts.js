/**
 * Seed initial des 4 produits Village 1800.
 * ─────────────────────────────────────────────────────────────
 * - Supprime les produits de test existants (SI présents et vides d'info)
 * - Insère (ou met à jour via slug) les 4 cuvées : Intense, Balanced, Délicate, HP
 * - Idempotent : peut être lancé plusieurs fois
 *
 * Lancement :  npm run seed-products
 */
const db = require('../config/db');

const PRODUCTS = [
    {
        slug: 'intense',
        nom_fr: 'Cuvée Intense', nom_en: 'Intense Cuvée',
        subtitle_fr: "L'Ardente Sauvage", subtitle_en: 'The Wild Ardent',
        lead_short_fr: 'Ardente, herbacée, poivrée — l\'huile des connaisseurs.',
        lead_short_en: 'Ardent, herbal, peppery — the connoisseurs\' oil.',
        description_fr: 'Notre huile d\'olive extra vierge monovariétale Intense est issue d\'une récolte précoce d\'olives vertes Chaïbi, cueillies délicatement à la main fin octobre. Elle révèle une puissance aromatique remarquable et une richesse naturelle en polyphénols.',
        description_en: 'Our extra-virgin monovarietal Intense is crafted from early-harvest green Chaïbi olives, hand-picked in late October. It delivers a remarkable aromatic power and a natural richness in polyphenols.',
        harvest_fr: 'Fin octobre — récolte précoce, olives vertes',
        harvest_en: 'End of October — early harvest, green olives',
        profil_aromatique_fr: 'Fruité puissant, artichaut sauvage, amertume noble, finish poivré',
        profil_aromatique_en: 'Powerful fruity, wild artichoke, noble bitterness, peppery finish',
        suggestions_fr: 'Viande grillée, salade de tomates anciennes, soupe chaude, carpaccios, pain chaud',
        suggestions_en: 'Grilled meats, heirloom tomato salad, hot soup, carpaccios, warm bread',
        variete: 'Chaïbi',
        gamme: 'intense',
        format: '500 ml',
        accent_color: '#4E2422',
        actif: 1,
    },
    {
        slug: 'balanced',
        nom_fr: 'Cuvée Balanced', nom_en: 'Balanced Cuvée',
        subtitle_fr: "L'Équilibre Absolu", subtitle_en: 'Absolute Balance',
        lead_short_fr: 'Fluide, équilibrée, harmonieuse — l\'huile de tous les jours.',
        lead_short_en: 'Fluid, balanced, harmonious — the everyday oil.',
        description_fr: 'Notre huile d\'olive extra vierge monovariétale Balanced est issue d\'une récolte de mi-saison où les fruits, vert et violets, sont cueillis délicatement à la main fin novembre. Elle révèle une texture soyeuse et une palette aromatique parfaitement équilibrée.',
        description_en: 'Our monovarietal Balanced comes from a mid-season harvest of green and purple fruits, gently hand-picked in late November. It reveals a silky texture and a perfectly balanced aromatic palette.',
        harvest_fr: 'Fin novembre — mi-saison, olives vertes et violettes',
        harvest_en: 'End of November — mid-season, green and purple olives',
        profil_aromatique_fr: 'Fruité rond, notes douces, herbes fraîches',
        profil_aromatique_en: 'Rounded fruity, soft notes, fresh herbs',
        suggestions_fr: 'Poulet rôti ou grillé, poissons blancs, légumes vapeur, pâtes légères, salades composées',
        suggestions_en: 'Roast or grilled chicken, white fish, steamed vegetables, light pasta, composed salads',
        variete: 'Chaïbi',
        gamme: 'balanced',
        format: '500 ml',
        accent_color: '#1D2936',
        actif: 1,
    },
    {
        slug: 'delicate',
        nom_fr: 'Cuvée Délicate', nom_en: 'Delicate Cuvée',
        subtitle_fr: 'La Sérénité Florale', subtitle_en: 'Floral Serenity',
        lead_short_fr: 'Douce, florale, beurrée — la caresse de Korba.',
        lead_short_en: 'Sweet, floral, buttery — the caress of Korba.',
        description_fr: 'Notre huile d\'olive extra vierge monovariétale Délicate est issue d\'une récolte tardive, fin décembre, où les olives violettes ont atteint leur pleine maturité. Elle offre une rondeur douce et des notes florales subtiles.',
        description_en: 'Our monovarietal Delicate comes from a late harvest in late December, when purple olives have reached full maturity. It offers a sweet roundness and subtle floral notes.',
        harvest_fr: 'Fin décembre — récolte tardive, olives violettes',
        harvest_en: 'End of December — late harvest, purple olives',
        profil_aromatique_fr: 'Fruité mûr, floral, notes rondes et légèrement beurrées',
        profil_aromatique_en: 'Ripe fruity, floral, rounded and slightly buttery notes',
        suggestions_fr: 'Pâtisseries fines, fruits frais, sauces délicates, fromages frais, desserts',
        suggestions_en: 'Fine pastries, fresh fruit, delicate sauces, fresh cheeses, desserts',
        variete: 'Chaïbi',
        gamme: 'delicate',
        format: '500 ml',
        accent_color: '#4E2422',
        actif: 1,
    },
    {
        slug: 'hp',
        nom_fr: 'High Polyphenols', nom_en: 'High Polyphenols',
        subtitle_fr: "L'Élixir Moléculaire", subtitle_en: 'The Molecular Elixir',
        lead_short_fr: 'Riche en hydroxytyrosol — santé cardiovasculaire & longévité.',
        lead_short_en: 'Rich in hydroxytyrosol — cardiovascular health & longevity.',
        description_fr: 'Fruit de l\'alliance entre la nature et la science, notre High Polyphenols est issue de la variété autochtone Chaïbi du Cap Bon. Sous la direction de notre docteur en biologie, nous sélectionnons des olives récoltées précocement (Green Harvest), au moment où leur concentration en antioxydants est maximale.',
        description_en: 'Fruit of the alliance between nature and science, our High Polyphenols comes from the native Chaïbi variety of Cap Bon. Under the guidance of our biologist, we select olives harvested early (Green Harvest), when antioxidant concentration is at its peak.',
        harvest_fr: 'Mi-octobre — Green Harvest, olives précoces',
        harvest_en: 'Mid-October — Green Harvest, early olives',
        profil_aromatique_fr: 'Intensité polyphénolique élevée, amertume marquée, notes végétales',
        profil_aromatique_en: 'High polyphenolic intensity, marked bitterness, vegetal notes',
        suggestions_fr: 'À froid uniquement — cuillère à jeun, filet sur légume vapeur, poisson grillé, salade',
        suggestions_en: 'Cold use only — spoon on empty stomach, drizzle on steamed vegetable, grilled fish, salad',
        variete: 'Chaïbi',
        gamme: 'hp',
        format: '500 ml',
        accent_color: '#0A3A1C',
        actif: 1,
    },
];

const FIELDS = [
    'slug', 'nom_fr', 'nom_en', 'subtitle_fr', 'subtitle_en',
    'lead_short_fr', 'lead_short_en', 'description_fr', 'description_en',
    'harvest_fr', 'harvest_en', 'profil_aromatique_fr', 'profil_aromatique_en',
    'suggestions_fr', 'suggestions_en', 'variete', 'gamme', 'format',
    'accent_color', 'actif',
];

(async () => {
    console.log('▶ Seed des produits Village 1800…\n');
    try {
        // 1. Nettoyage des produits de test (sans slug ou avec noms de test)
        const [beforeCount] = await db.query('SELECT COUNT(*) AS n FROM produits');
        console.log(`  Produits existants : ${beforeCount[0].n}`);

        const [testProducts] = await db.query(
            `SELECT id, nom_fr FROM produits
             WHERE slug IS NULL
                OR LOWER(nom_fr) IN ('test','tes','tesst','teste')`
        );
        if (testProducts.length > 0) {
            console.log(`  🗑 Suppression de ${testProducts.length} produit(s) de test :`, testProducts.map(p => p.nom_fr).join(', '));
            const ids = testProducts.map(p => p.id);
            await db.query('DELETE FROM produits WHERE id IN (?)', [ids]);
        }

        // 2. Upsert des 4 produits (INSERT ou UPDATE sur slug)
        for (const p of PRODUCTS) {
            const [existing] = await db.query('SELECT id FROM produits WHERE slug = ?', [p.slug]);
            const values = FIELDS.map(f => p[f] ?? null);

            if (existing.length > 0) {
                const setClause = FIELDS.map(f => `${f} = ?`).join(', ');
                await db.query(
                    `UPDATE produits SET ${setClause} WHERE id = ?`,
                    [...values, existing[0].id],
                );
                console.log(`  ✎ ${p.slug} : mis à jour (id ${existing[0].id})`);
            } else {
                const cols = FIELDS.join(', ');
                const placeholders = FIELDS.map(() => '?').join(', ');
                const [result] = await db.query(
                    `INSERT INTO produits (${cols}) VALUES (${placeholders})`,
                    values,
                );
                console.log(`  ＋ ${p.slug} : créé (id ${result.insertId})`);
            }
        }

        const [afterCount] = await db.query('SELECT COUNT(*) AS n FROM produits');
        console.log(`\n✅ Seed terminé. Produits en DB : ${afterCount[0].n}`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur seed :', err.message);
        process.exit(1);
    }
})();
