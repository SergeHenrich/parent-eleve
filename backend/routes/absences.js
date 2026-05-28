const express = require('express');
const { query } = require('../models/database');
const { authenticateToken, requireRole, checkEleveAccess } = require('../middleware/auth');

const router = express.Router();

// Middleware d'authentification pour toutes les routes
router.use(authenticateToken);
router.use(requireRole(['parent', 'eleve']));

// Route pour obtenir toutes les absences d'un élève
router.get('/eleve/:eleveId', checkEleveAccess, async (req, res) => {
  try {
    const { eleveId } = req.params;
    const { page = 1, limit = 20, justifiee, mois, annee } = req.query;

    // Construction de la requête avec filtres
    let whereClause = 'WHERE a.eleve_id = $1';
    let params = [eleveId];
    let paramIndex = 2;

    if (justifiee !== undefined) {
      whereClause += ` AND a.justifiee = $${paramIndex}`;
      params.push(justifiee === 'true');
      paramIndex++;
    }

    if (mois && annee) {
      whereClause += ` AND EXTRACT(MONTH FROM a.date_absence) = $${paramIndex} AND EXTRACT(YEAR FROM a.date_absence) = $${paramIndex + 1}`;
      params.push(parseInt(mois), parseInt(annee));
      paramIndex += 2;
    } else if (annee) {
      whereClause += ` AND EXTRACT(YEAR FROM a.date_absence) = $${paramIndex}`;
      params.push(parseInt(annee));
      paramIndex++;
    }

    // Compter le total d'absences
    const countResult = await query(
      `SELECT COUNT(*) as total FROM absences a ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].total);

    // Récupérer les absences avec pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const absencesResult = await query(
      `SELECT a.id, a.date_absence, a.heure_debut, a.heure_fin, a.motif, 
              a.justifiee, a.justificatif_url, a.created_at, a.updated_at
       FROM absences a
       ${whereClause}
       ORDER BY a.date_absence DESC, a.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    // Statistiques des absences
    const statsResult = await query(
      `SELECT 
         COUNT(*) as total_absences,
         COUNT(CASE WHEN justifiee = true THEN 1 END) as absences_justifiees,
         COUNT(CASE WHEN justifiee = false THEN 1 END) as absences_non_justifiees,
         COUNT(CASE WHEN date_absence >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as absences_30_jours
       FROM absences
       WHERE eleve_id = $1`,
      [eleveId]
    );

    const stats = statsResult.rows[0];

    res.json({
      success: true,
      absences: absencesResult.rows.map(absence => ({
        id: absence.id,
        date_absence: absence.date_absence,
        heure_debut: absence.heure_debut,
        heure_fin: absence.heure_fin,
        motif: absence.motif,
        justifiee: absence.justifiee,
        justificatif_url: absence.justificatif_url,
        created_at: absence.created_at,
        updated_at: absence.updated_at
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / parseInt(limit))
      },
      statistiques: {
        total_absences: parseInt(stats.total_absences) || 0,
        absences_justifiees: parseInt(stats.absences_justifiees) || 0,
        absences_non_justifiees: parseInt(stats.absences_non_justifiees) || 0,
        absences_30_jours: parseInt(stats.absences_30_jours) || 0,
        taux_justification: stats.total_absences > 0 
          ? ((parseInt(stats.absences_justifiees) / parseInt(stats.total_absences)) * 100).toFixed(1)
          : 0
      }
    });

  } catch (error) {
    console.error('Erreur récupération absences:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

// Route pour obtenir les détails d'une absence spécifique
router.get('/:absenceId', async (req, res) => {
  try {
    const { absenceId } = req.params;

    const absenceResult = await query(
      `SELECT a.id, a.date_absence, a.heure_debut, a.heure_fin, a.motif,
              a.justifiee, a.justificatif_url, a.created_at, a.updated_at,
              e.id as eleve_id, e.matricule, e.classe,
              u.nom, u.prenom
       FROM absences a
       JOIN eleves e ON a.eleve_id = e.id
       JOIN users u ON e.user_id = u.id
       WHERE a.id = $1`,
      [absenceId]
    );

    if (absenceResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Absence non trouvée'
      });
    }

    const absence = absenceResult.rows[0];

    // Vérifier l'accès à cette absence
    let hasAccess = false;
    if (req.user.role === 'parent') {
      const accessResult = await query(
        'SELECT id FROM eleves WHERE id = $1 AND parent_id = $2',
        [absence.eleve_id, req.user.id]
      );
      hasAccess = accessResult.rows.length > 0;
    } else if (req.user.role === 'eleve') {
      const accessResult = await query(
        'SELECT id FROM eleves WHERE id = $1 AND user_id = $2',
        [absence.eleve_id, req.user.id]
      );
      hasAccess = accessResult.rows.length > 0;
    }

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Accès non autorisé à cette absence'
      });
    }

    res.json({
      success: true,
      absence: {
        id: absence.id,
        date_absence: absence.date_absence,
        heure_debut: absence.heure_debut,
        heure_fin: absence.heure_fin,
        motif: absence.motif,
        justifiee: absence.justifiee,
        justificatif_url: absence.justificatif_url,
        created_at: absence.created_at,
        updated_at: absence.updated_at,
        eleve: {
          id: absence.eleve_id,
          matricule: absence.matricule,
          classe: absence.classe,
          nom: absence.nom,
          prenom: absence.prenom
        }
      }
    });

  } catch (error) {
    console.error('Erreur récupération détails absence:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

// Route pour obtenir les statistiques d'absences par mois
router.get('/eleve/:eleveId/statistiques', checkEleveAccess, async (req, res) => {
  try {
    const { eleveId } = req.params;
    const { annee = new Date().getFullYear() } = req.query;

    // Statistiques par mois
    const statsParMoisResult = await query(
      `SELECT 
         EXTRACT(MONTH FROM date_absence) as mois,
         COUNT(*) as total,
         COUNT(CASE WHEN justifiee = true THEN 1 END) as justifiees,
         COUNT(CASE WHEN justifiee = false THEN 1 END) as non_justifiees
       FROM absences
       WHERE eleve_id = $1 AND EXTRACT(YEAR FROM date_absence) = $2
       GROUP BY EXTRACT(MONTH FROM date_absence)
       ORDER BY mois`,
      [eleveId, annee]
    );

    // Évolution des absences (6 derniers mois)
    const evolutionResult = await query(
      `SELECT 
         DATE_TRUNC('month', date_absence) as mois,
         COUNT(*) as total_absences
       FROM absences
       WHERE eleve_id = $1 
       AND date_absence >= CURRENT_DATE - INTERVAL '6 months'
       GROUP BY DATE_TRUNC('month', date_absence)
       ORDER BY mois`,
      [eleveId]
    );

    // Répartition par type de justification
    const repartitionResult = await query(
      `SELECT 
         justifiee,
         COUNT(*) as nombre,
         ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 1) as pourcentage
       FROM absences
       WHERE eleve_id = $1 AND EXTRACT(YEAR FROM date_absence) = $2
       GROUP BY justifiee`,
      [eleveId, annee]
    );

    // Absences par jour de la semaine
    const joursSemaineResult = await query(
      `SELECT 
         EXTRACT(DOW FROM date_absence) as jour_semaine,
         COUNT(*) as nombre_absences
       FROM absences
       WHERE eleve_id = $1 AND EXTRACT(YEAR FROM date_absence) = $2
       GROUP BY EXTRACT(DOW FROM date_absence)
       ORDER BY jour_semaine`,
      [eleveId, annee]
    );

    // Mapper les jours de la semaine
    const joursNoms = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const absencesParJour = joursSemaineResult.rows.map(row => ({
      jour: joursNoms[row.jour_semaine],
      nombre: parseInt(row.nombre_absences)
    }));

    // Mois en français
    const moisNoms = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const statsParMois = statsParMoisResult.rows.map(row => ({
      mois: moisNoms[row.mois - 1],
      mois_numero: parseInt(row.mois),
      total: parseInt(row.total),
      justifiees: parseInt(row.justifiees),
      non_justifiees: parseInt(row.non_justifiees),
      taux_justification: ((parseInt(row.justifiees) / parseInt(row.total)) * 100).toFixed(1)
    }));

    res.json({
      success: true,
      statistiques: {
        annee: parseInt(annee),
        par_mois: statsParMois,
        evolution_6_mois: evolutionResult.rows.map(row => ({
          mois: row.mois,
          total: parseInt(row.total_absences)
        })),
        repartition_justification: repartitionResult.rows.map(row => ({
          type: row.justifiee ? 'Justifiées' : 'Non justifiées',
          nombre: parseInt(row.nombre),
          pourcentage: parseFloat(row.pourcentage)
        })),
        par_jour_semaine: absencesParJour
      }
    });

  } catch (error) {
    console.error('Erreur récupération statistiques absences:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

// Route pour justifier une absence (pour les parents)
router.put('/:absenceId/justifier', requireRole(['parent']), async (req, res) => {
  try {
    const { absenceId } = req.params;
    const { motif, justificatif_url } = req.body;

    // Vérifier que l'absence existe et appartient à un élève du parent
    const absenceResult = await query(
      `SELECT a.id, a.eleve_id, a.justifiee
       FROM absences a
       JOIN eleves e ON a.eleve_id = e.id
       WHERE a.id = $1 AND e.parent_id = $2`,
      [absenceId, req.user.id]
    );

    if (absenceResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Absence non trouvée ou accès non autorisé'
      });
    }

    const absence = absenceResult.rows[0];

    if (absence.justifiee) {
      return res.status(400).json({
        error: 'Cette absence est déjà justifiée'
      });
    }

    // Mettre à jour l'absence
    await query(
      `UPDATE absences 
       SET justifiee = true, motif = $1, justificatif_url = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [motif, justificatif_url, absenceId]
    );

    // Créer une notification pour confirmer la justification
    await query(
      `INSERT INTO notifications (user_id, type, titre, message)
       VALUES ($1, 'absence_justifiee', 'Absence justifiée', 'L''absence du ${absence.date_absence} a été justifiée avec succès.')`,
      [req.user.id]
    );

    res.json({
      success: true,
      message: 'Absence justifiée avec succès'
    });

  } catch (error) {
    console.error('Erreur justification absence:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

// Route pour obtenir le récapitulatif mensuel des absences
router.get('/eleve/:eleveId/recapitulatif/:annee/:mois', checkEleveAccess, async (req, res) => {
  try {
    const { eleveId, annee, mois } = req.params;

    const recapResult = await query(
      `SELECT 
         date_absence,
         heure_debut,
         heure_fin,
         motif,
         justifiee,
         EXTRACT(DOW FROM date_absence) as jour_semaine
       FROM absences
       WHERE eleve_id = $1 
       AND EXTRACT(YEAR FROM date_absence) = $2 
       AND EXTRACT(MONTH FROM date_absence) = $3
       ORDER BY date_absence`,
      [eleveId, annee, mois]
    );

    const joursNoms = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const moisNoms = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    const absences = recapResult.rows.map(row => ({
      date: row.date_absence,
      jour_semaine: joursNoms[row.jour_semaine],
      heure_debut: row.heure_debut,
      heure_fin: row.heure_fin,
      motif: row.motif,
      justifiee: row.justifiee
    }));

    const statistiques = {
      total: absences.length,
      justifiees: absences.filter(a => a.justifiee).length,
      non_justifiees: absences.filter(a => !a.justifiee).length
    };

    res.json({
      success: true,
      recapitulatif: {
        periode: {
          mois: moisNoms[parseInt(mois) - 1],
          mois_numero: parseInt(mois),
          annee: parseInt(annee)
        },
        absences: absences,
        statistiques: {
          ...statistiques,
          taux_justification: statistiques.total > 0 
            ? ((statistiques.justifiees / statistiques.total) * 100).toFixed(1)
            : 0
        }
      }
    });

  } catch (error) {
    console.error('Erreur récapitulatif mensuel:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

module.exports = router;