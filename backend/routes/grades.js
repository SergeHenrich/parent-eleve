const express = require('express');
const { query } = require('../models/database');
const { authenticateToken, requireRole, checkEleveAccess } = require('../middleware/auth');

const router = express.Router();

// Middleware d'authentification pour toutes les routes
router.use(authenticateToken);
router.use(requireRole(['parent', 'eleve']));

// Route pour obtenir toutes les notes d'un élève
router.get('/eleve/:eleveId', checkEleveAccess, async (req, res) => {
  try {
    const { eleveId } = req.params;
    const { trimestre, matiere } = req.query;

    // Construction de la requête avec filtres optionnels
    let whereClause = 'WHERE n.eleve_id = $1';
    let params = [eleveId];
    let paramIndex = 2;

    if (trimestre) {
      whereClause += ` AND n.trimestre = $${paramIndex}`;
      params.push(parseInt(trimestre));
      paramIndex++;
    }

    if (matiere) {
      whereClause += ` AND mat.id = $${paramIndex}`;
      params.push(parseInt(matiere));
      paramIndex++;
    }

    const notesResult = await query(
      `SELECT n.id, n.note, n.type_evaluation, n.trimestre, n.date_evaluation, n.commentaire,
              mat.nom as matiere, mat.code as matiere_code, mat.coefficient,
              n.annee_scolaire
       FROM notes n
       JOIN matieres mat ON n.matiere_id = mat.id
       ${whereClause}
       ORDER BY n.trimestre, mat.nom, n.date_evaluation DESC`,
      params
    );

    // Grouper les notes par trimestre et matière
    const notesGroupees = {};
    
    notesResult.rows.forEach(note => {
      const trimestre = note.trimestre;
      const matiere = note.matiere;
      
      if (!notesGroupees[trimestre]) {
        notesGroupees[trimestre] = {};
      }
      
      if (!notesGroupees[trimestre][matiere]) {
        notesGroupees[trimestre][matiere] = {
          matiere_info: {
            nom: note.matiere,
            code: note.matiere_code,
            coefficient: note.coefficient
          },
          notes: []
        };
      }
      
      notesGroupees[trimestre][matiere].notes.push({
        id: note.id,
        note: parseFloat(note.note),
        type_evaluation: note.type_evaluation,
        date_evaluation: note.date_evaluation,
        commentaire: note.commentaire
      });
    });

    // Calculer les moyennes par matière et trimestre
    const moyennes = {};
    
    Object.keys(notesGroupees).forEach(trimestre => {
      moyennes[trimestre] = {};
      let sommeCoefficients = 0;
      let sommePonderee = 0;
      
      Object.keys(notesGroupees[trimestre]).forEach(matiere => {
        const matiereData = notesGroupees[trimestre][matiere];
        const notes = matiereData.notes.map(n => n.note);
        const coefficient = matiereData.matiere_info.coefficient;
        
        if (notes.length > 0) {
          const moyenneMatiere = notes.reduce((sum, note) => sum + note, 0) / notes.length;
          moyennes[trimestre][matiere] = {
            moyenne: parseFloat(moyenneMatiere.toFixed(2)),
            coefficient: coefficient,
            nombre_notes: notes.length
          };
          
          sommeCoefficients += coefficient;
          sommePonderee += moyenneMatiere * coefficient;
        }
      });
      
      // Moyenne générale du trimestre
      if (sommeCoefficients > 0) {
        moyennes[trimestre].moyenne_generale = parseFloat((sommePonderee / sommeCoefficients).toFixed(2));
      }
    });

    res.json({
      success: true,
      notes: notesGroupees,
      moyennes: moyennes,
      statistiques: {
        total_notes: notesResult.rows.length,
        trimestres: Object.keys(notesGroupees).map(t => parseInt(t)).sort(),
        matieres: [...new Set(notesResult.rows.map(n => n.matiere))].sort()
      }
    });

  } catch (error) {
    console.error('Erreur récupération notes:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

// Route pour obtenir les moyennes d'un élève
router.get('/eleve/:eleveId/moyennes', checkEleveAccess, async (req, res) => {
  try {
    const { eleveId } = req.params;
    const { trimestre } = req.query;

    let whereClause = 'WHERE n.eleve_id = $1';
    let params = [eleveId];

    if (trimestre) {
      whereClause += ' AND n.trimestre = $2';
      params.push(parseInt(trimestre));
    }

    const moyennesResult = await query(
      `SELECT n.trimestre,
              mat.nom as matiere, mat.coefficient,
              AVG(n.note) as moyenne,
              COUNT(n.id) as nombre_notes,
              MIN(n.note) as note_min,
              MAX(n.note) as note_max
       FROM notes n
       JOIN matieres mat ON n.matiere_id = mat.id
       ${whereClause}
       GROUP BY n.trimestre, mat.id, mat.nom, mat.coefficient
       ORDER BY n.trimestre, mat.nom`,
      params
    );

    // Calculer les moyennes générales par trimestre
    const moyennesGenerales = {};
    const moyennesParMatiere = {};

    moyennesResult.rows.forEach(row => {
      const trimestre = row.trimestre;
      
      if (!moyennesParMatiere[trimestre]) {
        moyennesParMatiere[trimestre] = [];
      }
      
      const moyenneMatiere = {
        matiere: row.matiere,
        moyenne: parseFloat(row.moyenne).toFixed(2),
        coefficient: row.coefficient,
        nombre_notes: parseInt(row.nombre_notes),
        note_min: parseFloat(row.note_min),
        note_max: parseFloat(row.note_max)
      };
      
      moyennesParMatiere[trimestre].push(moyenneMatiere);
    });

    // Calculer les moyennes générales
    Object.keys(moyennesParMatiere).forEach(trimestre => {
      let sommeCoefficients = 0;
      let sommePonderee = 0;
      
      moyennesParMatiere[trimestre].forEach(matiere => {
        sommeCoefficients += matiere.coefficient;
        sommePonderee += parseFloat(matiere.moyenne) * matiere.coefficient;
      });
      
      if (sommeCoefficients > 0) {
        moyennesGenerales[trimestre] = parseFloat((sommePonderee / sommeCoefficients).toFixed(2));
      }
    });

    res.json({
      success: true,
      moyennes_par_matiere: moyennesParMatiere,
      moyennes_generales: moyennesGenerales,
      statistiques: {
        trimestres_disponibles: Object.keys(moyennesParMatiere).map(t => parseInt(t)).sort(),
        total_matieres: moyennesResult.rows.length > 0 ? moyennesParMatiere[Object.keys(moyennesParMatiere)[0]].length : 0
      }
    });

  } catch (error) {
    console.error('Erreur récupération moyennes:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

// Route pour obtenir le bulletin d'un élève
router.get('/eleve/:eleveId/bulletin/:trimestre', checkEleveAccess, async (req, res) => {
  try {
    const { eleveId, trimestre } = req.params;

    // Informations de l'élève
    const eleveResult = await query(
      `SELECT e.matricule, e.classe, e.niveau, e.etablissement, e.annee_scolaire,
              u.nom, u.prenom
       FROM eleves e
       JOIN users u ON e.user_id = u.id
       WHERE e.id = $1`,
      [eleveId]
    );

    if (eleveResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Élève non trouvé'
      });
    }

    const eleve = eleveResult.rows[0];

    // Notes et moyennes du trimestre
    const notesResult = await query(
      `SELECT mat.nom as matiere, mat.coefficient,
              AVG(n.note) as moyenne,
              COUNT(n.id) as nombre_notes,
              STRING_AGG(n.note::text || ' (' || n.type_evaluation || ')', ', ' ORDER BY n.date_evaluation) as detail_notes
       FROM notes n
       JOIN matieres mat ON n.matiere_id = mat.id
       WHERE n.eleve_id = $1 AND n.trimestre = $2
       GROUP BY mat.id, mat.nom, mat.coefficient
       ORDER BY mat.nom`,
      [eleveId, trimestre]
    );

    // Calcul de la moyenne générale
    let sommeCoefficients = 0;
    let sommePonderee = 0;
    
    const matieres = notesResult.rows.map(row => {
      const moyenne = parseFloat(row.moyenne);
      const coefficient = row.coefficient;
      
      sommeCoefficients += coefficient;
      sommePonderee += moyenne * coefficient;
      
      return {
        matiere: row.matiere,
        coefficient: coefficient,
        moyenne: moyenne.toFixed(2),
        nombre_notes: parseInt(row.nombre_notes),
        detail_notes: row.detail_notes,
        appreciation: getAppreciation(moyenne)
      };
    });

    const moyenneGenerale = sommeCoefficients > 0 ? (sommePonderee / sommeCoefficients).toFixed(2) : null;

    // Absences du trimestre
    const absencesResult = await query(
      `SELECT COUNT(*) as total_absences,
              COUNT(CASE WHEN justifiee = false THEN 1 END) as absences_non_justifiees
       FROM absences
       WHERE eleve_id = $1 
       AND date_absence >= (CASE 
         WHEN $2 = 1 THEN '2025-09-01'
         WHEN $2 = 2 THEN '2026-01-01'
         ELSE '2026-04-01'
       END)::date
       AND date_absence < (CASE 
         WHEN $2 = 1 THEN '2025-12-31'
         WHEN $2 = 2 THEN '2026-03-31'
         ELSE '2026-07-31'
       END)::date`,
      [eleveId, trimestre]
    );

    const absences = absencesResult.rows[0];

    res.json({
      success: true,
      bulletin: {
        eleve: {
          nom: eleve.nom,
          prenom: eleve.prenom,
          matricule: eleve.matricule,
          classe: eleve.classe,
          niveau: eleve.niveau,
          etablissement: eleve.etablissement,
          annee_scolaire: eleve.annee_scolaire
        },
        trimestre: parseInt(trimestre),
        matieres: matieres,
        moyenne_generale: moyenneGenerale,
        appreciation_generale: moyenneGenerale ? getAppreciationGenerale(parseFloat(moyenneGenerale)) : null,
        absences: {
          total: parseInt(absences.total_absences) || 0,
          non_justifiees: parseInt(absences.absences_non_justifiees) || 0
        },
        date_generation: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erreur génération bulletin:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

// Route pour obtenir la liste des matières
router.get('/matieres', async (req, res) => {
  try {
    const matieresResult = await query(
      'SELECT id, nom, code, coefficient FROM matieres ORDER BY nom'
    );

    res.json({
      success: true,
      matieres: matieresResult.rows
    });

  } catch (error) {
    console.error('Erreur récupération matières:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

// Fonctions utilitaires pour les appréciations
function getAppreciation(moyenne) {
  if (moyenne >= 16) return 'Très bien';
  if (moyenne >= 14) return 'Bien';
  if (moyenne >= 12) return 'Assez bien';
  if (moyenne >= 10) return 'Passable';
  return 'Insuffisant';
}

function getAppreciationGenerale(moyenne) {
  if (moyenne >= 16) return 'Excellent travail, continuez ainsi !';
  if (moyenne >= 14) return 'Bon travail, quelques efforts à maintenir.';
  if (moyenne >= 12) return 'Travail satisfaisant, peut mieux faire.';
  if (moyenne >= 10) return 'Travail acceptable, des efforts sont nécessaires.';
  return 'Travail insuffisant, redoublement d\'efforts requis.';
}

module.exports = router;