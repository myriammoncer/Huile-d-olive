const express = require('express');
const multer = require('multer');
const { body } = require('express-validator');
const router = express.Router();
const {
    getAllProduitsPublic, getAllProduitsAdmin, getProduitById, getProduitBySlug,
    createProduit, updateProduit, deleteProduit, uploadImage,
} = require('../controllers/produitController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');

const GAMMES = ['intense', 'balanced', 'delicate', 'hp'];

// Multer en mémoire → Cloudinary (Railway/Vercel friendly)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Format de fichier non supporté (image attendue)'));
    },
});

// Validation admin create/update
const produitValidators = [
    body('slug').optional({ nullable: true }).isString().trim()
        .matches(/^[a-z0-9-]+$/).withMessage('Slug invalide (a-z, 0-9, - uniquement)')
        .isLength({ max: 60 }),
    body('nom_fr').optional({ nullable: true }).isString().isLength({ max: 255 }),
    body('nom_en').optional({ nullable: true }).isString().isLength({ max: 255 }),
    body('gamme').optional({ nullable: true }).isIn(GAMMES)
        .withMessage(`Gamme invalide (attendu : ${GAMMES.join(' | ')})`),
    body('format').optional({ nullable: true }).isString().isLength({ max: 40 }),
    body('image_url').optional({ nullable: true }).isString().isLength({ max: 500 }),
    body('accent_color').optional({ nullable: true }).isString().isLength({ max: 20 }),
    body('actif').optional().isBoolean().toBoolean(),
];

// ─── PUBLIC ─────────────────────────────────────────────────
router.get('/', getAllProduitsPublic);
router.get('/slug/:slug', getProduitBySlug);
router.get('/:id(\\d+)', getProduitById);

// ─── ADMIN ──────────────────────────────────────────────────
router.get('/all', authenticate, requireAdmin, getAllProduitsAdmin);
router.post('/upload', authenticate, requireAdmin, upload.single('image'), uploadImage);
router.post('/', authenticate, requireAdmin, produitValidators, validate, createProduit);
router.put('/:id', authenticate, requireAdmin, produitValidators, validate, updateProduit);
router.delete('/:id', authenticate, requireAdmin, deleteProduit);

module.exports = router;
