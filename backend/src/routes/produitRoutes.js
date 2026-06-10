const express = require('express');
const router = express.Router();
const { getAllProduits, getProduitById, createProduit, updateProduit, deleteProduit } = require('../controllers/produitController');
const auth = require('../middleware/auth');

// Routes publiques
router.get('/', getAllProduits);
router.get('/:id', getProduitById);

// Routes privées (admin seulement)
router.post('/', auth, createProduit);
router.put('/:id', auth, updateProduit);
router.delete('/:id', auth, deleteProduit);

module.exports = router;