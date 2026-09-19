const db = require('../config/db');
const cloudinary = require('../config/cloudinary');
const asyncHandler = require('../middleware/asyncHandler');

// Colonnes gérées (schéma bilingue étendu)
const FIELDS = [
    'slug',
    'nom_fr', 'nom_en',
    'subtitle_fr', 'subtitle_en',
    'lead_short_fr', 'lead_short_en',
    'description_fr', 'description_en',
    'harvest_fr', 'harvest_en',
    'profil_aromatique_fr', 'profil_aromatique_en',
    'suggestions_fr', 'suggestions_en',
    'variete', 'gamme', 'format',
    'image_url', 'image_public_id', 'accent_color', 'actif',
];

const pickValues = (body) => FIELDS.map((f) => {
    if (f === 'actif') return body.actif === undefined ? 1 : (body.actif ? 1 : 0);
    return body[f] !== undefined ? body[f] : null;
});

/** Projette un produit selon ?lang=fr|en */
function projectByLang(row, lang) {
    if (!lang || (lang !== 'fr' && lang !== 'en')) return row;
    return {
        ...row,
        nom:                 row[`nom_${lang}`],
        subtitle:            row[`subtitle_${lang}`],
        lead_short:          row[`lead_short_${lang}`],
        description:         row[`description_${lang}`],
        harvest:             row[`harvest_${lang}`],
        profil_aromatique:   row[`profil_aromatique_${lang}`],
        suggestions:         row[`suggestions_${lang}`],
    };
}

// GET /api/produits (public : uniquement actif=1)
const getAllProduitsPublic = asyncHandler(async (req, res) => {
    const lang = req.query.lang;
    const [rows] = await db.query(
        'SELECT * FROM produits WHERE actif = 1 ORDER BY id ASC',
    );
    res.json(rows.map((r) => projectByLang(r, lang)));
});

// GET /api/produits/all (admin : tout)
const getAllProduitsAdmin = asyncHandler(async (req, res) => {
    const [rows] = await db.query('SELECT * FROM produits ORDER BY id ASC');
    res.json(rows);
});

// GET /api/produits/:id (par ID numérique)
const getProduitById = asyncHandler(async (req, res) => {
    const lang = req.query.lang;
    const [rows] = await db.query('SELECT * FROM produits WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Produit non trouvé' });
    res.json(projectByLang(rows[0], lang));
});

// GET /api/produits/slug/:slug (par slug — utilisé par le frontend)
const getProduitBySlug = asyncHandler(async (req, res) => {
    const lang = req.query.lang;
    const [rows] = await db.query(
        'SELECT * FROM produits WHERE slug = ? AND actif = 1',
        [req.params.slug.toLowerCase().trim()],
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Produit non trouvé' });
    res.json(projectByLang(rows[0], lang));
});

// POST /api/produits (admin)
const createProduit = asyncHandler(async (req, res) => {
    const cols = FIELDS.join(', ');
    const placeholders = FIELDS.map(() => '?').join(', ');
    try {
        const [result] = await db.query(
            `INSERT INTO produits (${cols}) VALUES (${placeholders})`,
            pickValues(req.body),
        );
        res.status(201).json({ message: 'Produit ajouté', id: result.insertId });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Ce slug existe déjà' });
        }
        throw err;
    }
});

// PUT /api/produits/:id (admin)
const updateProduit = asyncHandler(async (req, res) => {
    const setClause = FIELDS.map((f) => `${f} = ?`).join(', ');
    const values = [...pickValues(req.body), req.params.id];
    try {
        const [result] = await db.query(`UPDATE produits SET ${setClause} WHERE id = ?`, values);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Produit non trouvé' });
        res.json({ message: 'Produit modifié' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Ce slug existe déjà' });
        }
        throw err;
    }
});

// DELETE /api/produits/:id
const deleteProduit = asyncHandler(async (req, res) => {
    const [rows] = await db.query('SELECT image_public_id FROM produits WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Produit non trouvé' });

    const publicId = rows[0].image_public_id;
    if (publicId) {
        try { await cloudinary.uploader.destroy(publicId); }
        catch (e) { console.error('Cloudinary destroy:', e.message); }
    }
    await db.query('DELETE FROM produits WHERE id = ?', [req.params.id]);
    res.json({ message: 'Produit supprimé' });
});

// POST /api/produits/upload (admin)
const uploadImage = asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier reçu' });

    const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'village1800/produits', resource_type: 'image' },
            (error, uploaded) => (error ? reject(error) : resolve(uploaded)),
        );
        stream.end(req.file.buffer);
    });
    res.status(201).json({ url: result.secure_url, public_id: result.public_id });
});

module.exports = {
    getAllProduitsPublic, getAllProduitsAdmin, getProduitById, getProduitBySlug,
    createProduit, updateProduit, deleteProduit, uploadImage,
};
