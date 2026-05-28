const express = require('express');
const { query } = require('../models/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Middleware d'authentification pour toutes les routes
router.use(authenticateToken);
router.use(requireRole(['parent', 'eleve']));

// Route pour obtenir toutes les notifications de l'utilisateur
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, lu, type } = req.query;

    // Construction de la requête avec filtres
    let whereClause = 'WHERE n.user_id = $1';
    let params = [req.user.id];
    let paramIndex = 2;

    if (lu !== undefined) {
      whereClause += ` AND n.lu = $${paramIndex}`;
      params.push(lu === 'true');
      paramIndex++;
    }

    if (type) {
      whereClause += ` AND n.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    // Compter le total de notifications
    const countResult = await query(
      `SELECT COUNT(*) as total FROM notifications n ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].total);

    // Récupérer les notifications avec pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const notificationsResult = await query(
      `SELECT n.id, n.type, n.titre, n.message, n.lu, n.envoye_sms, n.envoye_email, n.created_at
       FROM notifications n
       ${whereClause}
       ORDER BY n.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    // Statistiques des notifications
    const statsResult = await query(
      `SELECT 
         COUNT(*) as total_notifications,
         COUNT(CASE WHEN lu = false THEN 1 END) as non_lues,
         COUNT(CASE WHEN type = 'absence' THEN 1 END) as absences,
         COUNT(CASE WHEN type = 'note' THEN 1 END) as notes,
         COUNT(CASE WHEN type = 'nouveau_message' THEN 1 END) as messages,
         COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as cette_semaine
       FROM notifications
       WHERE user_id = $1`,
      [req.user.id]
    );

    const stats = statsResult.rows[0];

    res.json({
      success: true,
      notifications: notificationsResult.rows.map(notif => ({
        id: notif.id,
        type: notif.type,
        titre: notif.titre,
        message: notif.message,
        lu: notif.lu,
        envoye_sms: notif.envoye_sms,
        envoye_email: notif.envoye_email,
        created_at: notif.created_at,
        icone: getNotificationIcon(notif.type),
        couleur: getNotificationColor(notif.type)
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / parseInt(limit))
      },
      statistiques: {
        total_notifications: parseInt(stats.total_notifications) || 0,
        non_lues: parseInt(stats.non_lues) || 0,
        par_type: {
          absences: parseInt(stats.absences) || 0,
          notes: parseInt(stats.notes) || 0,
          messages: parseInt(stats.messages) || 0
        },
        cette_semaine: parseInt(stats.cette_semaine) || 0
      }
    });

  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

// Route pour obtenir une notification spécifique
router.get('/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notificationResult = await query(
      `SELECT n.id, n.type, n.titre, n.message, n.lu, n.envoye_sms, n.envoye_email, n.created_at
       FROM notifications n
       WHERE n.id = $1 AND n.user_id = $2`,
      [notificationId, req.user.id]
    );

    if (notificationResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Notification non trouvée'
      });
    }

    const notification = notificationResult.rows[0];

    // Marquer comme lue si ce n'est pas déjà fait
    if (!notification.lu) {
      await query(
        'UPDATE notifications SET lu = true WHERE id = $1',
        [notificationId]
      );
      notification.lu = true;
    }

    res.json({
      success: true,
      notification: {
        id: notification.id,
        type: notification.type,
        titre: notification.titre,
        message: notification.message,
        lu: notification.lu,
        envoye_sms: notification.envoye_sms,
        envoye_email: notification.envoye_email,
        created_at: notification.created_at,
        icone: getNotificationIcon(notification.type),
        couleur: getNotificationColor(notification.type)
      }
    });

  } catch (error) {
    console.error('Erreur récupération notification:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

// Route pour marquer une notification comme lue
router.put('/:notificationId/marquer-lue', async (req, res) => {
  try {
    const { notificationId } = req.params;

    const result = await query(
      'UPDATE notifications SET lu = true WHERE id = $1 AND user_id = $2 RETURNING id',
      [notificationId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Notification non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Notification marquée comme lue'
    });

  } catch (error) {
    console.error('Erreur marquage notification lue:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

// Route pour marquer toutes les notifications comme lues
router.put('/marquer-toutes-lues', async (req, res) => {
  try {
    const result = await query(
      'UPDATE notifications SET lu = true WHERE user_id = $1 AND lu = false RETURNING id',
      [req.user.id]
    );

    res.json({
      success: true,
      message: `${result.rows.length} notification(s) marquée(s) comme lue(s)`
    });

  } catch (error) {
    console.error('Erreur marquage toutes notifications lues:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

// Route pour supprimer une notification
router.delete('/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;

    const result = await query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [notificationId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Notification non trouvée'
      });
    }

    res.json({
      success: true,
      message: 'Notification supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression notification:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

// Route pour obtenir le résumé des notifications
router.get('/resume/statistiques', async (req, res) => {
  try {
    const resumeResult = await query(
      `SELECT 
         COUNT(*) as total,
         COUNT(CASE WHEN lu = false THEN 1 END) as non_lues,
         COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as aujourd_hui,
         COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as cette_semaine,
         COUNT(CASE WHEN type = 'absence' AND lu = false THEN 1 END) as absences_non_lues,
         COUNT(CASE WHEN type = 'note' AND lu = false THEN 1 END) as notes_non_lues,
         COUNT(CASE WHEN type = 'nouveau_message' AND lu = false THEN 1 END) as messages_non_lus
       FROM notifications
       WHERE user_id = $1`,
      [req.user.id]
    );

    const resume = resumeResult.rows[0];

    // Dernières notifications non lues
    const dernieresResult = await query(
      `SELECT id, type, titre, message, created_at
       FROM notifications
       WHERE user_id = $1 AND lu = false
       ORDER BY created_at DESC
       LIMIT 5`,
      [req.user.id]
    );

    res.json({
      success: true,
      resume: {
        total: parseInt(resume.total) || 0,
        non_lues: parseInt(resume.non_lues) || 0,
        aujourd_hui: parseInt(resume.aujourd_hui) || 0,
        cette_semaine: parseInt(resume.cette_semaine) || 0,
        par_type_non_lues: {
          absences: parseInt(resume.absences_non_lues) || 0,
          notes: parseInt(resume.notes_non_lues) || 0,
          messages: parseInt(resume.messages_non_lus) || 0
        },
        dernieres_non_lues: dernieresResult.rows.map(notif => ({
          id: notif.id,
          type: notif.type,
          titre: notif.titre,
          message: notif.message.substring(0, 100) + (notif.message.length > 100 ? '...' : ''),
          created_at: notif.created_at,
          icone: getNotificationIcon(notif.type)
        }))
      }
    });

  } catch (error) {
    console.error('Erreur résumé notifications:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

// Route pour créer une notification (usage interne/test)
router.post('/test', async (req, res) => {
  try {
    const { type, titre, message } = req.body;

    if (!type || !titre || !message) {
      return res.status(400).json({
        error: 'Type, titre et message requis'
      });
    }

    const result = await query(
      `INSERT INTO notifications (user_id, type, titre, message)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at`,
      [req.user.id, type, titre, message]
    );

    // Simuler l'envoi SMS/Email (en mode développement)
    if (process.env.NODE_ENV === 'development') {
      console.log(`📧 Email simulé pour ${req.user.email}: ${titre}`);
      console.log(`📱 SMS simulé: ${message.substring(0, 160)}`);
    }

    res.status(201).json({
      success: true,
      message: 'Notification créée avec succès',
      notification_id: result.rows[0].id,
      created_at: result.rows[0].created_at
    });

  } catch (error) {
    console.error('Erreur création notification test:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

// Fonctions utilitaires pour les icônes et couleurs
function getNotificationIcon(type) {
  const icons = {
    'absence': '🏃‍♂️',
    'note': '📊',
    'nouveau_message': '💬',
    'bulletin': '📋',
    'reunion': '👥',
    'absence_justifiee': '✅',
    'rappel': '⏰',
    'urgent': '🚨'
  };
  return icons[type] || '📢';
}

function getNotificationColor(type) {
  const colors = {
    'absence': 'orange',
    'note': 'blue',
    'nouveau_message': 'green',
    'bulletin': 'purple',
    'reunion': 'indigo',
    'absence_justifiee': 'green',
    'rappel': 'yellow',
    'urgent': 'red'
  };
  return colors[type] || 'gray';
}

module.exports = router;