require('dotenv').config();
const { query } = require('../models/database');
const bcrypt = require('bcryptjs');

async function createTables() {
  try {
    console.log('🔄 Création des tables...');

    // Table des utilisateurs (parents, élèves, enseignants, admin)
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'parent',
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        telephone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )
    `);

    // Mettre à jour la contrainte de rôle si la table existait déjà
    await query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`);
    await query(`ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('parent', 'eleve', 'enseignant', 'admin'))`);

    // Table des élèves
    await query(`
      CREATE TABLE IF NOT EXISTS eleves (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        matricule VARCHAR(50) UNIQUE NOT NULL,
        classe VARCHAR(50) NOT NULL,
        niveau VARCHAR(50) NOT NULL,
        etablissement VARCHAR(200) NOT NULL,
        annee_scolaire VARCHAR(20) DEFAULT '2025-2026',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table des matières
    await query(`
      CREATE TABLE IF NOT EXISTS matieres (
        id SERIAL PRIMARY KEY,
        nom VARCHAR(100) NOT NULL,
        code VARCHAR(20) UNIQUE NOT NULL,
        coefficient INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table des notes
    await query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        eleve_id INTEGER REFERENCES eleves(id) ON DELETE CASCADE,
        matiere_id INTEGER REFERENCES matieres(id) ON DELETE CASCADE,
        note DECIMAL(4,2) NOT NULL CHECK (note >= 0 AND note <= 20),
        type_evaluation VARCHAR(50) NOT NULL,
        trimestre INTEGER NOT NULL CHECK (trimestre IN (1, 2, 3)),
        annee_scolaire VARCHAR(20) DEFAULT '2025-2026',
        date_evaluation DATE NOT NULL,
        commentaire TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table des absences
    await query(`
      CREATE TABLE IF NOT EXISTS absences (
        id SERIAL PRIMARY KEY,
        eleve_id INTEGER REFERENCES eleves(id) ON DELETE CASCADE,
        date_absence DATE NOT NULL,
        heure_debut TIME,
        heure_fin TIME,
        motif TEXT,
        justifiee BOOLEAN DEFAULT false,
        justificatif_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table des messages
    await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        expediteur_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        destinataire_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        sujet VARCHAR(200) NOT NULL,
        contenu TEXT NOT NULL,
        lu BOOLEAN DEFAULT false,
        date_lecture TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        eleve_concerne_id INTEGER REFERENCES eleves(id) ON DELETE SET NULL
      )
    `);

    // Table des notifications
    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        titre VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        lu BOOLEAN DEFAULT false,
        envoye_sms BOOLEAN DEFAULT false,
        envoye_email BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Tables créées avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des tables:', error);
    throw error;
  }
}

async function insertMockData() {
  try {
    console.log('🔄 Insertion des données de test...');

    // Hachage des mots de passe
    const parentPassword = await bcrypt.hash('parent123', 12);
    const elevePassword = await bcrypt.hash('eleve123', 12);
    const adminPassword = await bcrypt.hash('admin123', 12);
    const enseignantPassword = await bcrypt.hash('enseignant123', 12);

    // Insertion des utilisateurs
    const parentResult = await query(`
      INSERT INTO users (email, password_hash, role, nom, prenom, telephone)
      VALUES ($1, $2, 'parent', 'Mballa', 'Jean-Pierre', '+237677123456')
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `, ['parent@edusmart.cm', parentPassword]);

    const eleveResult = await query(`
      INSERT INTO users (email, password_hash, role, nom, prenom, telephone)
      VALUES ($1, $2, 'eleve', 'Mballa', 'Sarah', '+237677123457')
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `, ['eleve@edusmart.cm', elevePassword]);

    await query(`
      INSERT INTO users (email, password_hash, role, nom, prenom)
      VALUES ($1, $2, 'admin', 'Administration', 'Lycée Bilingue')
      ON CONFLICT (email) DO NOTHING
    `, ['admin@edusmart.cm', adminPassword]);

    await query(`
      INSERT INTO users (email, password_hash, role, nom, prenom)
      VALUES ($1, $2, 'enseignant', 'Mbarga', 'Paul')
      ON CONFLICT (email) DO NOTHING
    `, ['paul.mbarga@edusmart.cm', enseignantPassword]);

    await query(`
      INSERT INTO users (email, password_hash, role, nom, prenom)
      VALUES ($1, $2, 'enseignant', 'Nkomo', 'Marie')
      ON CONFLICT (email) DO NOTHING
    `, ['marie.nkomo@edusmart.cm', enseignantPassword]);

    // Récupération des IDs
    let parentId, eleveUserId;
    if (parentResult.rows.length > 0) {
      parentId = parentResult.rows[0].id;
    } else {
      const existingParent = await query('SELECT id FROM users WHERE email = $1', ['parent@edusmart.cm']);
      parentId = existingParent.rows[0].id;
    }

    if (eleveResult.rows.length > 0) {
      eleveUserId = eleveResult.rows[0].id;
    } else {
      const existingEleve = await query('SELECT id FROM users WHERE email = $1', ['eleve@edusmart.cm']);
      eleveUserId = existingEleve.rows[0].id;
    }

    // Insertion de l'élève
    const eleveInsert = await query(`
      INSERT INTO eleves (user_id, parent_id, matricule, classe, niveau, etablissement)
      VALUES ($1, $2, 'MAT2026001', '3ème A', 'Troisième', 'Lycée Bilingue de Yaoundé')
      ON CONFLICT (matricule) DO NOTHING
      RETURNING id
    `, [eleveUserId, parentId]);

    let eleveId;
    if (eleveInsert.rows.length > 0) {
      eleveId = eleveInsert.rows[0].id;
    } else {
      const existingEleveRecord = await query('SELECT id FROM eleves WHERE matricule = $1', ['MAT2026001']);
      eleveId = existingEleveRecord.rows[0].id;
    }

    // Insertion des matières
    const matieres = [
      ['Mathématiques', 'MATH', 4],
      ['Français', 'FR', 4],
      ['Anglais', 'ANG', 3],
      ['Sciences Physiques', 'PC', 3],
      ['Sciences de la Vie et de la Terre', 'SVT', 3],
      ['Histoire-Géographie', 'HG', 3],
      ['Éducation Civique et Morale', 'ECM', 2],
      ['Informatique', 'INFO', 2]
    ];

    for (const [nom, code, coeff] of matieres) {
      await query(`
        INSERT INTO matieres (nom, code, coefficient)
        VALUES ($1, $2, $3)
        ON CONFLICT (code) DO NOTHING
      `, [nom, code, coeff]);
    }

    // Insertion des notes
    const notesData = [
      [1, 15.5, 'Devoir', 1, '2025-11-15'],
      [1, 12.0, 'Composition', 1, '2025-12-10'],
      [2, 14.0, 'Devoir', 1, '2025-11-20'],
      [2, 16.5, 'Composition', 1, '2025-12-12'],
      [3, 13.5, 'Devoir', 1, '2025-11-18'],
      [4, 11.0, 'Devoir', 1, '2025-11-22'],
      [5, 15.0, 'Devoir', 1, '2025-11-25']
    ];

    for (const [matiereId, note, type, trimestre, date] of notesData) {
      await query(`
        INSERT INTO notes (eleve_id, matiere_id, note, type_evaluation, trimestre, date_evaluation)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [eleveId, matiereId, note, type, trimestre, date]);
    }

    // Insertion des absences
    const absencesData = [
      ['2026-05-20', false, 'Absence non justifiée'],
      ['2026-05-15', true, 'Rendez-vous médical'],
      ['2026-05-10', false, 'Retard non justifié']
    ];

    for (const [date, justifiee, motif] of absencesData) {
      await query(`
        INSERT INTO absences (eleve_id, date_absence, justifiee, motif)
        VALUES ($1, $2, $3, $4)
      `, [eleveId, date, justifiee, motif]);
    }

    // Récupération de l'ID admin
    const adminResult = await query('SELECT id FROM users WHERE email = $1', ['admin@edusmart.cm']);
    const adminId = adminResult.rows[0]?.id;

    // Insertion d'un message de l'administration vers le parent
    if (adminId) {
      await query(`
        INSERT INTO messages (expediteur_id, destinataire_id, sujet, contenu, eleve_concerne_id)
        VALUES ($1, $2, 'Réunion parents d''élèves', 'Bonjour, nous organisons une réunion parents d''élèves le 30 mai 2026 à 15h. Votre présence est souhaitée.', $3)
      `, [adminId, parentId, eleveId]);
    }

    // Insertion d'une notification
    await query(`
      INSERT INTO notifications (user_id, type, titre, message)
      VALUES ($1, 'absence', 'Absence non justifiée', 'Votre enfant Sarah a été absent(e) le 20/05/2026 sans justification.')
    `, [parentId]);

    console.log('✅ Données de test insérées avec succès');
    console.log('📧 Comptes créés:');
    console.log('   Parent: parent@edusmart.cm / parent123');
    console.log('   Élève: eleve@edusmart.cm / eleve123');
    console.log('   Admin: admin@edusmart.cm / admin123');
    console.log('   Enseignant: paul.mbarga@edusmart.cm / enseignant123');
    console.log('   Enseignant: marie.nkomo@edusmart.cm / enseignant123');

  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion des données:', error);
    throw error;
  }
}

async function migrate() {
  try {
    await createTables();
    await insertMockData();
    console.log('🎉 Migration terminée avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Échec de la migration:', error);
    process.exit(1);
  }
}

// Exécution si appelé directement
if (require.main === module) {
  migrate();
}

module.exports = { createTables, insertMockData };