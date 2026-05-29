const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

const updateValidation = [
  body('nom')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Nom requis (max 100 caractères)'),
  body('prenom')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Prénom requis (max 100 caractères)'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email valide requis'),
  body('telephone')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Téléphone trop long (max 20 caractères)')
];

// Route pour obtenir le profil utilisateur
router.get('/profile', async (req, res) => {
  try {
    const userResult = await query(
      `SELECT id, email, role, nom, prenom, telephone, created_at, last_login
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({
      success: true,
      user: userResult.rows[0]
    });
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Route pour mettre à jour le profil
router.patch('/profile', updateValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { nom, prenom, email, telephone } = req.body;
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (nom !== undefined) {
      updates.push(`nom = $${paramIndex++}`);
      params.push(nom);
    }
    if (prenom !== undefined) {
      updates.push(`prenom = $${paramIndex++}`);
      params.push(prenom);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      params.push(email);
    }
    if (telephone !== undefined) {
      updates.push(`telephone = $${paramIndex++}`);
      params.push(telephone);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(req.user.id);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, email, role, nom, prenom, telephone`,
      params
    );

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;
