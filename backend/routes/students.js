const express = require('express');
const { query } = require('../models/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Middleware d'authentification pour toutes les routes
router.use(authenticateToken);

// Route pour obtenir les élèves d'un parent
router.get('/', requireRole(['parent', 'eleve']), async (req, res) => {
  try {
    let elevesResult;

    if (req.user.role === 'parent') {
      // Récupérer tous les élèves du parent
      elevesResult = await query(
        `SELECT e.id, e.matricule, e.classe, e.niveau, e.etablissement, e.annee_scolaire,
                u.nom, u.prenom, u.email,
                COUNT(DISTINCT n.id) as total_notes,
                COUNT(DISTINCT a.id) as total_absences,
                COUNT(DISTINCT CASE WHEN a.justifiee = false THEN a.id END) as absences_non_justifiees
         FROM eleves e
         JOIN users u ON e.user_id = u.id
         LEFT JOIN notes n ON e.id = n.eleve_id
         LEFT JOIN absences a ON e.id = a.eleve_id
         WHERE e.parent_id = $1
         GROUP BY e.id, u.nom, u.prenom, u.email
         ORDER BY u.nom, u.prenom`,
        [req.user.id]
      );
    } else if (req.user.role === 'eleve') {
      // Récupérer les informations de l'élève connecté
      elevesResult = await query(
        `SELECT e.id, e.matricule, e.classe, e.niveau, e.etablissement, e.annee_scolaire,
                u.nom, u.prenom, u.email,
                COUNT(DISTINCT n.id) as total_notes,
                COUNT(DISTINCT a.id) as total_absences,
                COUNT(DISTINCT CASE WHEN a.justifiee = false THEN a.id END) as absences_non_justifiees
         FROM eleves e
         JOIN users u ON e.user_id = u.id
         LEFT JOIN notes n ON e.id = n.eleve_id
         LEFT JOIN absences a ON e.id = a.eleve_id
         WHERE e.user_id = $1
         GROUP BY e.id, u.nom, u.prenom, u.email`,
        [req.user.id]
      );
    }

    const eleves = elevesResult.rows.map(eleve => ({
      id: eleve.id,
      matricule: eleve.matricule,
      nom: eleve.nom,
      prenom: eleve.prenom,
      email: eleve.email,
      classe: eleve.classe,
      niveau: eleve.niveau,
      etablissement: eleve.etablissement,
      annee_scolaire: eleve.annee_scolaire,
      statistiques: {
        total_notes: parseInt(eleve.total_notes),
        total_absences: parseInt(eleve.total_absences),
        absences_non_justifiees: parseInt(eleve.absences_non_justifiees)
      }
    }));

    res.json({
      success: true,
      eleves
    });

  } catch (error) {
    console.error('Erreur récupération élèves:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

// Route pour obtenir les détails d'un élève spécifique
router.get('/:eleveId', requireRole(['parent', 'eleve']), async (req, res) => {
  try {
    const { eleveId } = req.params;

    // Vérifier l'accès à l'élève
    let accessQuery;
    let accessParams;

    if (req.user.role === 'parent') {
      accessQuery = 'SELECT id FROM eleves WHERE id = $1 AND parent_id = $2';
      accessParams = [eleveId, req.user.id];
    } else if (req.user.role === 'eleve') {
      accessQuery = 'SELECT id FROM eleves WHERE id = $1 AND user_id = $2';
      accessParams = [eleveId, req.user.id];
    }

    const accessResult = await query(accessQuery, accessParams);
    if (accessResult.rows.length === 0) {
      return res.status(403).json({
        error: 'Accès non autorisé à ces données'
      });
    }

    // Récupérer les détails de l'élève
    const eleveResult = await query(
      `SELECT e.id, e.matricule, e.classe, e.niveau, e.etablissement, e.annee_scolaire,
              u.nom, u.prenom, u.email, u.telephone,
              p.nom as parent_nom, p.prenom as parent_prenom, p.email as parent_email, p.telephone as parent_telephone
       FROM eleves e
       JOIN users u ON e.user_id = u.id
       LEFT JOIN users p ON e.parent_id = p.id
       WHERE e.id = $1`,
      [eleveId]
    );

    if (eleveResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Élève non trouvé'
      });
    }

    const eleve = eleveResult.rows[0];

    // Récupérer les statistiques récentes
    const statsResult = await query(
      `SELECT 
         COUNT(DISTINCT n.id) as total_notes,
         AVG(n.note) as moyenne_generale,
         COUNT(DISTINCT a.id) as total_absences,
         COUNT(DISTINCT CASE WHEN a.justifiee = false THEN a.id END) as absences_non_justifiees,
         COUNT(DISTINCT m.id) as messages_non_lus
       FROM eleves e
       LEFT JOIN notes n ON e.id = n.eleve_id AND n.trimestre = 1
       LEFT JOIN absences a ON e.id = a.eleve_id
       LEFT JOIN messages m ON (e.user_id = m.destinataire_id OR e.parent_id = m.destinataire_id) AND m.lu = false
       WHERE e.id = $1`,
      [eleveId]
    );

    const stats = statsResult.rows[0];

    // Récupérer les dernières notes
    const dernieresNotesResult = await query(
      `SELECT n.note, n.type_evaluation, n.date_evaluation, n.trimestre,
              mat.nom as matiere, mat.coefficient
       FROM notes n
       JOIN matieres mat ON n.matiere_id = mat.id
       WHERE n.eleve_id = $1
       ORDER BY n.date_evaluation DESC
       LIMIT 5`,
      [eleveId]
    );

    // Récupérer les dernières absences
    const dernieresAbsencesResult = await query(
      `SELECT date_absence, justifiee, motif, created_at
       FROM absences
       WHERE eleve_id = $1
       ORDER BY date_absence DESC
       LIMIT 5`,
      [eleveId]
    );

    res.json({
      success: true,
      eleve: {
        id: eleve.id,
        matricule: eleve.matricule,
        nom: eleve.nom,
        prenom: eleve.prenom,
        email: eleve.email,
        telephone: eleve.telephone,
        classe: eleve.classe,
        niveau: eleve.niveau,
        etablissement: eleve.etablissement,
        annee_scolaire: eleve.annee_scolaire,
        parent: eleve.parent_nom ? {
          nom: eleve.parent_nom,
          prenom: eleve.parent_prenom,
          email: eleve.parent_email,
          telephone: eleve.parent_telephone
        } : null,
        statistiques: {
          total_notes: parseInt(stats.total_notes) || 0,
          moyenne_generale: stats.moyenne_generale ? parseFloat(stats.moyenne_generale).toFixed(2) : null,
          total_absences: parseInt(stats.total_absences) || 0,
          absences_non_justifiees: parseInt(stats.absences_non_justifiees) || 0,
          messages_non_lus: parseInt(stats.messages_non_lus) || 0
        },
        dernieres_notes: dernieresNotesResult.rows,
        dernieres_absences: dernieresAbsencesResult.rows
      }
    });

  } catch (error) {
    console.error('Erreur récupération détails élève:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

// Route pour obtenir le tableau de bord d'un élève
router.get('/:eleveId/dashboard', requireRole(['parent', 'eleve']), async (req, res) => {
  try {
    const { eleveId } = req.params;

    // Vérifier l'accès à l'élève
    let accessQuery;
    let accessParams;

    if (req.user.role === 'parent') {
      accessQuery = 'SELECT id FROM eleves WHERE id = $1 AND parent_id = $2';
      accessParams = [eleveId, req.user.id];
    } else if (req.user.role === 'eleve') {
      accessQuery = 'SELECT id FROM eleves WHERE id = $1 AND user_id = $2';
      accessParams = [eleveId, req.user.id];
    }

    const accessResult = await query(accessQuery, accessParams);
    if (accessResult.rows.length === 0) {
      return res.status(403).json({
        error: 'Accès non autorisé à ces données'
      });
    }

    // Récupérer les données du tableau de bord
    const dashboardData = await Promise.all([
      // Moyennes par matière (trimestre actuel)
      query(
        `SELECT mat.nom as matiere, AVG(n.note) as moyenne, mat.coefficient
         FROM notes n
         JOIN matieres mat ON n.matiere_id = mat.id
         WHERE n.eleve_id = $1 AND n.trimestre = 1
         GROUP BY mat.id, mat.nom, mat.coefficient
         ORDER BY mat.nom`,
        [eleveId]
      ),
      
      // Absences récentes (30 derniers jours)
      query(
        `SELECT COUNT(*) as total, 
                COUNT(CASE WHEN justifiee = false THEN 1 END) as non_justifiees
         FROM absences
         WHERE eleve_id = $1 AND date_absence >= CURRENT_DATE - INTERVAL '30 days'`,
        [eleveId]
      ),
      
      // Messages non lus
      query(
        `SELECT COUNT(*) as non_lus
         FROM messages m
         JOIN eleves e ON e.id = $1
         WHERE (m.destinataire_id = e.user_id OR m.destinataire_id = e.parent_id) 
         AND m.lu = false`,
        [eleveId]
      ),
      
      // Prochaines évaluations (mock data)
      Promise.resolve({ rows: [
        { matiere: 'Mathématiques', date: '2026-06-05', type: 'Composition' },
        { matiere: 'Français', date: '2026-06-08', type: 'Devoir' }
      ]})
    ]);

    const [moyennesResult, absencesResult, messagesResult, evaluationsResult] = dashboardData;

    res.json({
      success: true,
      dashboard: {
        moyennes_par_matiere: moyennesResult.rows.map(row => ({
          matiere: row.matiere,
          moyenne: row.moyenne ? parseFloat(row.moyenne).toFixed(2) : null,
          coefficient: row.coefficient
        })),
        absences_recentes: {
          total: parseInt(absencesResult.rows[0].total) || 0,
          non_justifiees: parseInt(absencesResult.rows[0].non_justifiees) || 0
        },
        messages_non_lus: parseInt(messagesResult.rows[0].non_lus) || 0,
        prochaines_evaluations: evaluationsResult.rows
      }
    });

  } catch (error) {
    console.error('Erreur récupération tableau de bord:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

module.exports = router;