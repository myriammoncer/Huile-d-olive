const db = require('../config/db');

// Récupérer tous les produits
const getAllProduits = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM produits ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
};

// Récupérer un produit par ID
const getProduitById = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM produits WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
};

// Ajouter un produit
const createProduit = async (req, res) => {
    const { nom_fr, nom_en, description_fr, description_en, prix, image } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO produits (nom_fr, nom_en, description_fr, description_en, prix, image) VALUES (?, ?, ?, ?, ?, ?)',
            [nom_fr, nom_en, description_fr, description_en, prix, image]
        );
        res.status(201).json({ message: 'Produit ajouté', id: result.insertId });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
};

// Modifier un produit
const updateProduit = async (req, res) => {
    const { nom_fr, nom_en, description_fr, description_en, prix, image } = req.body;
    try {
        const [result] = await db.query(
            'UPDATE produits SET nom_fr=?, nom_en=?, description_fr=?, description_en=?, prix=?, image=? WHERE id=?',
            [nom_fr, nom_en, description_fr, description_en, prix, image, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }
        res.json({ message: 'Produit modifié' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
};

// Supprimer un produit
const deleteProduit = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM produits WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }
        res.json({ message: 'Produit supprimé' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
};

module.exports = { getAllProduits, getProduitById, createProduit, updateProduit, deleteProduit };