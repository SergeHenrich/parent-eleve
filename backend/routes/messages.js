const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../models/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Middleware d'authentification pour toutes les routes
router.use(authenticateToken);
router.use(requireRole(['parent', 'eleve']));

// Validation pour l'envoi de messages
const messageValidation = [
  body('destinataire_id')
    .isInt({ min: 1 })
    .withMessage('ID destinataire requis'),
  body('sujet')
    .isLength({ min: 1, max: 200 })
    .withMessage('Sujet requis (max 200 caractères)'),
  body('contenu')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Contenu requis (max 5000 caractères)'),
  body('eleve_concerne_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID élève concerné invalide')
];

// Route pour obtenir tous les messages de l'utilisateur
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, type = 'all', lu } = req.query;

    // Construction de la requête selon le type
    let whereClause = 'WHERE (m.expediteur_id = $1 OR m.destinataire_id = $1)';
    let params = [req.user.id];
    let paramIndex = 2;

    if (type === 'received') {
      whereClause = 'WHERE m.destinataire_id = $1';
    } else if (type === 'sent') {
      whereClause = 'WHERE m.expediteur_id = $1';
    }

    if (lu !== undefined) {
      whereClause += ` AND m.lu = $${paramIndex}`;
      params.push(lu === 'true');
      paramIndex++;
    }

    // Compter le total de messages
    const countResult = await query(
      `SELECT COUNT(*) as total FROM messages m ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].total);

    // Récupérer les messages avec pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const messagesResult = await query(
      `SELECT m.id, m.sujet, m.contenu, m.lu, m.created_at, m.date_lecture,
              exp.nom as expediteur_nom, exp.prenom as expediteur_prenom, exp.role as expediteur_role,
              dest.nom as destinataire_nom, dest.prenom as destinataire_prenom, dest.role as destinataire_role,
              e.nom as eleve_nom, e.prenom as eleve_prenom, el.classe as eleve_classe,
              CASE WHEN m.expediteur_id = $1 THEN 'sent' ELSE 'received' END as direction
       FROM messages m
       JOIN users exp ON m.expediteur_id = exp.id
       JOIN users dest ON m.destinataire_id = dest.id
       LEFT JOIN eleves el ON m.eleve_concerne_id = el.id
       LEFT JOIN users e ON el.user_id = e.id
       ${whereClause}
       ORDER BY m.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    // Statistiques des messages
    const statsResult = await query(
      `SELECT 
         COUNT(CASE WHEN destinataire_id = $1 THEN 1 END) as messages_recus,
         COUNT(CASE WHEN expediteur_id = $1 THEN 1 END) as messages_envoyes,
         COUNT(CASE WHEN destinataire_id = $1 AND lu = false THEN 1 END) as messages_non_lus
       FROM messages
       WHERE expediteur_id = $1 OR destinataire_id = $1`,
      [req.user.id]
    );

    const stats = statsResult.rows[0];

    res.json({
      success: true,
      messages: messagesResult.rows.map(msg => ({
        id: msg.id,
        sujet: msg.sujet,
        contenu: msg.contenu,
        lu: msg.lu,
        direction: msg.direction,
        created_at: msg.created_at,
        date_lecture: msg.date_lecture,
        expediteur: {
          nom: msg.expediteur_nom,
          prenom: msg.expediteur_prenom,
          role: msg.expediteur_role
        },
        destinataire: {
          nom: msg.destinataire_nom,
          prenom: msg.destinataire_prenom,
          role: msg.destinataire_role
        },
        eleve_concerne: msg.eleve_nom ? {
          nom: msg.eleve_nom,
          prenom: msg.eleve_prenom,
          classe: msg.eleve_classe
        } : null
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / parseInt(limit))
      },
      statistiques: {
        messages_recus: parseInt(stats.messages_recus) || 0,
        messages_envoyes: parseInt(stats.messages_envoyes) || 0,
        messages_non_lus: parseInt(stats.messages_non_lus) || 0
      }
    });

  } catch (error) {
    console.error('Erreur récupération messages:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

// Route pour obtenir un message spécifique
router.get('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;

    const messageResult = await query(
      `SELECT m.id, m.sujet, m.contenu, m.lu, m.created_at, m.date_lecture,
              m.expediteur_id, m.destinataire_id, m.eleve_concerne_id,
              exp.nom as expediteur_nom, exp.prenom as expediteur_prenom, exp.role as expediteur_role, exp.email as expediteur_email,
              dest.nom as destinataire_nom, dest.prenom as destinataire_prenom, dest.role as destinataire_role, dest.email as destinataire_email,
              e.nom as eleve_nom, e.prenom as eleve_prenom, el.classe as eleve_classe, el.matricule as eleve_matricule
       FROM messages m
       JOIN users exp ON m.expediteur_id = exp.id
       JOIN users dest ON m.destinataire_id = dest.id
       LEFT JOIN eleves el ON m.eleve_concerne_id = el.id
       LEFT JOIN users e ON el.user_id = e.id
       WHERE m.id = $1 AND (m.expediteur_id = $2 OR m.destinataire_id = $2)`,
      [messageId, req.user.id]
    );

    if (messageResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Message non trouvé ou accès non autorisé'
      });
    }

    const message = messageResult.rows[0];

    // Marquer comme lu si c'est le destinataire qui lit
    if (message.destinataire_id === req.user.id && !message.lu) {
      await query(
        'UPDATE messages SET lu = true, date_lecture = CURRENT_TIMESTAMP WHERE id = $1',
        [messageId]
      );
      message.lu = true;
      message.date_lecture = new Date();
    }

    res.json({
      success: true,
      message: {
        id: message.id,
        sujet: message.sujet,
        contenu: message.contenu,
        lu: message.lu,
        created_at: message.created_at,
        date_lecture: message.date_lecture,
        direction: message.expediteur_id === req.user.id ? 'sent' : 'received',
        expediteur: {
          id: message.expediteur_id,
          nom: message.expediteur_nom,
          prenom: message.expediteur_prenom,
          role: message.expediteur_role,
          email: message.expediteur_email
        },
        destinataire: {
          id: message.destinataire_id,
          nom: message.destinataire_nom,
          prenom: message.destinataire_prenom,
          role: message.destinataire_role,
          email: message.destinataire_email
        },
        eleve_concerne: message.eleve_nom ? {
          id: message.eleve_concerne_id,
          nom: message.eleve_nom,
          prenom: message.eleve_prenom,
          classe: message.eleve_classe,
          matricule: message.eleve_matricule
        } : null
      }
    });

  } catch (error) {
    console.error('Erreur récupération message:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

// Route pour envoyer un nouveau message
router.post('/', messageValidation, async (req, res) => {
  try {
    // Vérification des erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { destinataire_id, sujet, contenu, eleve_concerne_id } = req.body;

    // Vérifier que le destinataire existe
    const destinataireResult = await query(
      'SELECT id, role FROM users WHERE id = $1 AND is_active = true',
      [destinataire_id]
    );

    if (destinataireResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Destinataire non trouvé ou compte inactif'
      });
    }

    // Vérifier l'élève concerné si spécifié
    if (eleve_concerne_id) {
      let eleveAccessQuery;
      let eleveAccessParams;

      if (req.user.role === 'parent') {
        eleveAccessQuery = 'SELECT id FROM eleves WHERE id = $1 AND parent_id = $2';
        eleveAccessParams = [eleve_concerne_id, req.user.id];
      } else if (req.user.role === 'eleve') {
        eleveAccessQuery = 'SELECT id FROM eleves WHERE id = $1 AND user_id = $2';
        eleveAccessParams = [eleve_concerne_id, req.user.id];
      }

      const eleveAccessResult = await query(eleveAccessQuery, eleveAccessParams);
      if (eleveAccessResult.rows.length === 0) {
        return res.status(403).json({
          error: 'Accès non autorisé à cet élève'
        });
      }
    }

    // Insérer le message
    const messageResult = await query(
      `INSERT INTO messages (expediteur_id, destinataire_id, sujet, contenu, eleve_concerne_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at`,
      [req.user.id, destinataire_id, sujet, contenu, eleve_concerne_id || null]
    );

    const nouveauMessage = messageResult.rows[0];

    // Créer une notification pour le destinataire
    await query(
      `INSERT INTO notifications (user_id, type, titre, message)
       VALUES ($1, 'nouveau_message', 'Nouveau message', 'Vous avez reçu un nouveau message: ${sujet}')`,
      [destinataire_id]
    );

    res.status(201).json({
      success: true,
      message: 'Message envoyé avec succès',
      message_id: nouveauMessage.id,
      created_at: nouveauMessage.created_at
    });

  } catch (error) {
    console.error('Erreur envoi message:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

// Route pour marquer un message comme lu
router.put('/:messageId/marquer-lu', async (req, res) => {
  try {
    const { messageId } = req.params;

    // Vérifier que l'utilisateur est le destinataire
    const messageResult = await query(
      'SELECT id, lu FROM messages WHERE id = $1 AND destinataire_id = $2',
      [messageId, req.user.id]
    );

    if (messageResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Message non trouvé ou vous n\'êtes pas le destinataire'
      });
    }

    const message = messageResult.rows[0];

    if (message.lu) {
      return res.status(400).json({
        error: 'Message déjà marqué comme lu'
      });
    }

    // Marquer comme lu
    await query(
      'UPDATE messages SET lu = true, date_lecture = CURRENT_TIMESTAMP WHERE id = $1',
      [messageId]
    );

    res.json({
      success: true,
      message: 'Message marqué comme lu'
    });

  } catch (error) {
    console.error('Erreur marquage message lu:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

// Route pour supprimer un message
router.delete('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;

    // Vérifier que l'utilisateur a accès au message
    const messageResult = await query(
      'SELECT id FROM messages WHERE id = $1 AND (expediteur_id = $2 OR destinataire_id = $2)',
      [messageId, req.user.id]
    );

    if (messageResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Message non trouvé ou accès non autorisé'
      });
    }

    // Supprimer le message
    await query('DELETE FROM messages WHERE id = $1', [messageId]);

    res.json({
      success: true,
      message: 'Message supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression message:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

// Route pour obtenir les contacts (utilisateurs avec qui on peut échanger)
router.get('/contacts/liste', async (req, res) => {
  try {
    let contacts = [];

    // Récupérer les utilisateurs admin et enseignants (communs à tous)
    const etablissementResult = await query(
      `SELECT id, nom, prenom, role, email
       FROM users
       WHERE role IN ('admin', 'enseignant') AND is_active = true
       ORDER BY role, nom`
    );
    contacts.push(...etablissementResult.rows);

    if (req.user.role === 'parent') {
      // Pour un parent : ajouter ses enfants (élèves)
      const enfantsResult = await query(
        `SELECT u.id, u.nom, u.prenom, u.role, u.email
         FROM users u
         JOIN eleves e ON u.id = e.user_id
         WHERE e.parent_id = $1 AND u.is_active = true`,
        [req.user.id]
      );
      contacts.push(...enfantsResult.rows);

    } else if (req.user.role === 'eleve') {
      // Pour un élève : ajouter son parent
      const parentResult = await query(
        `SELECT u.id, u.nom, u.prenom, u.role, u.email
         FROM users u
         JOIN eleves e ON u.id = e.parent_id
         WHERE e.user_id = $1 AND u.is_active = true`,
        [req.user.id]
      );
      contacts.push(...parentResult.rows);
    }

    // Dédupliquer par id (un admin peut aussi être parent, etc.)
    const seen = new Set();
    contacts = contacts.filter(c => {
      const dup = seen.has(c.id);
      seen.add(c.id);
      return !dup;
    });

    res.json({
      success: true,
      contacts: contacts.map(contact => ({
        id: contact.id,
        nom: contact.nom,
        prenom: contact.prenom,
        role: contact.role,
        email: contact.email,
        nom_complet: `${contact.prenom} ${contact.nom}`
      }))
    });

  } catch (error) {
    console.error('Erreur récupération contacts:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

// Route pour obtenir les conversations groupées
router.get('/conversations', async (req, res) => {
  try {
    const conversationsResult = await query(
      `SELECT DISTINCT
         CASE 
           WHEN m.expediteur_id = $1 THEN m.destinataire_id 
           ELSE m.expediteur_id 
         END as contact_id,
         CASE 
           WHEN m.expediteur_id = $1 THEN dest.nom 
           ELSE exp.nom 
         END as contact_nom,
         CASE 
           WHEN m.expediteur_id = $1 THEN dest.prenom 
           ELSE exp.prenom 
         END as contact_prenom,
         CASE 
           WHEN m.expediteur_id = $1 THEN dest.role 
           ELSE exp.role 
         END as contact_role,
         MAX(m.created_at) as dernier_message_date,
         COUNT(CASE WHEN m.destinataire_id = $1 AND m.lu = false THEN 1 END) as messages_non_lus
       FROM messages m
       JOIN users exp ON m.expediteur_id = exp.id
       JOIN users dest ON m.destinataire_id = dest.id
       WHERE m.expediteur_id = $1 OR m.destinataire_id = $1
       GROUP BY contact_id, contact_nom, contact_prenom, contact_role
       ORDER BY dernier_message_date DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      conversations: conversationsResult.rows.map(conv => ({
        contact: {
          id: conv.contact_id,
          nom: conv.contact_nom,
          prenom: conv.contact_prenom,
          role: conv.contact_role,
          nom_complet: `${conv.contact_prenom} ${conv.contact_nom}`
        },
        dernier_message_date: conv.dernier_message_date,
        messages_non_lus: parseInt(conv.messages_non_lus) || 0
      }))
    });

  } catch (error) {
    console.error('Erreur récupération conversations:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

module.exports = router;