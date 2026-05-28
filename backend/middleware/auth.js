const jwt = require('jsonwebtoken');
const { query } = require('../models/database');

// Middleware d'authentification JWT
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Token d\'accès requis',
      code: 'NO_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérifier que l'utilisateur existe toujours et est actif
    const userResult = await query(
      'SELECT id, email, role, nom, prenom, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Utilisateur non trouvé',
        code: 'USER_NOT_FOUND'
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(401).json({
        error: 'Compte désactivé',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // Ajouter les informations utilisateur à la requête
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      nom: user.nom,
      prenom: user.prenom
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expiré',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token invalide',
        code: 'INVALID_TOKEN'
      });
    }

    console.error('Erreur authentification:', error);
    return res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
};

// Middleware pour vérifier le rôle
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentification requise'
      });
    }

    const userRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!userRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Accès non autorisé pour ce rôle',
        required: userRoles,
        current: req.user.role
      });
    }

    next();
  };
};

// Middleware pour vérifier l'accès aux données d'un élève
const checkEleveAccess = async (req, res, next) => {
  try {
    const eleveId = req.params.eleveId || req.body.eleveId || req.query.eleveId;
    
    if (!eleveId) {
      return res.status(400).json({
        error: 'ID élève requis'
      });
    }

    let hasAccess = false;

    if (req.user.role === 'parent') {
      // Vérifier que le parent a accès à cet élève
      const accessResult = await query(
        'SELECT id FROM eleves WHERE id = $1 AND parent_id = $2',
        [eleveId, req.user.id]
      );
      hasAccess = accessResult.rows.length > 0;
    } else if (req.user.role === 'eleve') {
      // Vérifier que l'élève accède à ses propres données
      const accessResult = await query(
        'SELECT id FROM eleves WHERE id = $1 AND user_id = $2',
        [eleveId, req.user.id]
      );
      hasAccess = accessResult.rows.length > 0;
    }

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Accès non autorisé à ces données'
      });
    }

    req.eleveId = eleveId;
    next();
  } catch (error) {
    console.error('Erreur vérification accès élève:', error);
    return res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  checkEleveAccess
};