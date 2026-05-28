const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation des données de connexion
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email valide requis'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Mot de passe requis (min 6 caractères)')
];

// Route de connexion
router.post('/login', loginValidation, async (req, res) => {
  try {
    // Vérification des erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Recherche de l'utilisateur
    const userResult = await query(
      `SELECT u.id, u.email, u.password_hash, u.role, u.nom, u.prenom, u.is_active,
              e.id as eleve_id, e.matricule, e.classe, e.niveau, e.etablissement
       FROM users u
       LEFT JOIN eleves e ON u.id = e.user_id OR u.id = e.parent_id
       WHERE u.email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Email ou mot de passe incorrect',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = userResult.rows[0];

    // Vérification du compte actif
    if (!user.is_active) {
      return res.status(401).json({
        error: 'Compte désactivé. Contactez l\'administration.',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // Vérification du mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Email ou mot de passe incorrect',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Mise à jour de la dernière connexion
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Génération du token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Récupération des élèves associés (pour les parents)
    let eleves = [];
    if (user.role === 'parent') {
      const elevesResult = await query(
        `SELECT e.id, e.matricule, e.classe, e.niveau, e.etablissement,
                u.nom, u.prenom
         FROM eleves e
         JOIN users u ON e.user_id = u.id
         WHERE e.parent_id = $1`,
        [user.id]
      );
      eleves = elevesResult.rows;
    } else if (user.role === 'eleve' && user.eleve_id) {
      eleves = [{
        id: user.eleve_id,
        matricule: user.matricule,
        classe: user.classe,
        niveau: user.niveau,
        etablissement: user.etablissement,
        nom: user.nom,
        prenom: user.prenom
      }];
    }

    // Réponse de succès
    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        nom: user.nom,
        prenom: user.prenom,
        eleves
      }
    });

  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

// Route de vérification du token
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    // Récupération des élèves associés
    let eleves = [];
    if (req.user.role === 'parent') {
      const elevesResult = await query(
        `SELECT e.id, e.matricule, e.classe, e.niveau, e.etablissement,
                u.nom, u.prenom
         FROM eleves e
         JOIN users u ON e.user_id = u.id
         WHERE e.parent_id = $1`,
        [req.user.id]
      );
      eleves = elevesResult.rows;
    } else if (req.user.role === 'eleve') {
      const eleveResult = await query(
        `SELECT e.id, e.matricule, e.classe, e.niveau, e.etablissement,
                u.nom, u.prenom
         FROM eleves e
         JOIN users u ON e.user_id = u.id
         WHERE e.user_id = $1`,
        [req.user.id]
      );
      if (eleveResult.rows.length > 0) {
        eleves = [eleveResult.rows[0]];
      }
    }

    res.json({
      valid: true,
      user: {
        ...req.user,
        eleves
      }
    });
  } catch (error) {
    console.error('Erreur vérification token:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

// Route de déconnexion (côté client principalement)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
});

// Route de changement de mot de passe
router.post('/change-password', 
  authenticateToken,
  [
    body('currentPassword').notEmpty().withMessage('Mot de passe actuel requis'),
    body('newPassword').isLength({ min: 6 }).withMessage('Nouveau mot de passe requis (min 6 caractères)')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Données invalides',
          details: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;

      // Récupération du mot de passe actuel
      const userResult = await query(
        'SELECT password_hash FROM users WHERE id = $1',
        [req.user.id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Utilisateur non trouvé'
        });
      }

      // Vérification du mot de passe actuel
      const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
      if (!isValidPassword) {
        return res.status(400).json({
          error: 'Mot de passe actuel incorrect'
        });
      }

      // Hachage du nouveau mot de passe
      const newPasswordHash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS));

      // Mise à jour du mot de passe
      await query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newPasswordHash, req.user.id]
      );

      res.json({
        success: true,
        message: 'Mot de passe modifié avec succès'
      });

    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      res.status(500).json({
        error: 'Erreur interne du serveur'
      });
    }
  }
);

module.exports = router;