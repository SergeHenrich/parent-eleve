
```markdown
# EDUSMART-CM – Portail Parent/Élève

## Contexte du projet

NEXATEC SOLUTIONS SARL, ESN camerounaise, développe la plateforme **EDUSMART-CM** pour le Ministère des Enseignements Secondaires (MINESEC).  
Cette plateforme permet de gérer les résultats scolaires, les absences et les communications entre établissements, enseignants, élèves et parents.

Votre équipe est responsable du **Portail Parent/Élève**.  
Ce module permet aux parents et aux élèves de consulter les résultats, les bulletins, le suivi des absences, d’échanger des messages avec les enseignants et la direction, et de recevoir des notifications (SMS/e-mail).

Le projet doit être livré en **12 mois** (budget 210 M FCFA). Pour cette mise en situation (2 jours), vous devez produire un **MVP fonctionnel** respectant les contraintes ci-dessous.

## Fonctionnalités attendues (module Parent/Élève)

| Fonctionnalité | Description |
|----------------|-------------|
| Authentification sécurisée | Connexion par email/mot de passe. Rôle Parent ou Élève. |
| Consultation des résultats | Affichage des notes par matière, trimestre, moyenne générale. |
| Visualisation des bulletins | Affichage des bulletins trimestriels (PDF ou générés HTML/CSS). |
| Suivi des absences | Liste des absences (dates, justifiées / non justifiées). |
| Messagerie interne | Envoi et réception de messages avec les enseignants et l’administration. |
| Notifications | Alerte par SMS ou e-mail lors d’une absence injustifiée, résultat disponible, réunion parents. |
| Tableau de bord personnel | Vue d’ensemble des dernières notes, absences, messages non lus. |

## Contraintes techniques à respecter

| Contrainte | Exigence |
|------------|----------|
| **Performance (connexion 3G)** | Temps de chargement des pages critiques < 3 secondes. |
| **Taille des pages** | Première charge < 500 Ko. |
| **Compatibilité mobile** | Fonctionne sur smartphones Android d’entrée de gamme (50 000–80 000 FCFA). |
| **Sécurité** | HTTPS obligatoire, chiffrement AES-256 des données personnelles au repos, journalisation des actions critiques. |
| **Base de données** | Hébergement autorisé sur VPS Afrique du Sud (en attendant datacenter local). |
| **Pas d’offline-first** | Ce module n’a pas l’obligation de fonctionner hors ligne (contrairement aux modules Enseignant et Admin). |

## Stack technique à utiliser

| Couche | Technologie |
|--------|--------------|
| **Front-end** | React.js (avec Vite pour un démarrage rapide) |
| **UI / Responsive** | Tailwind CSS (ou Bootstrap 5) |
| **State management** | React Context (ou Redux Toolkit si besoin) |
| **Back-end API** | Node.js + Express.js |
| **Base de données** | PostgreSQL (ou SQLite pour prototypage rapide) |
| **Authentification** | JWT (JSON Web Token) + bcrypt |
| **Notifications** | Service externe simulé (console log) ou intégration Twilio/SendGrid (mode test) |
| **Versionnement** | Git + GitHub (branche principale : `main`) |
| **Environnement** | Variables d’environnement avec `.env` |

## Installation et démarrage rapide

### 1. Cloner le dépôt
```bash
git clone https://github.com/votre-equipe/edusmart-portail-parent.git
cd edusmart-portail-parent
```

### 2. Installer les dépendances

#### Back-end
```bash
cd backend
npm install
```

#### Front-end
```bash
cd ../frontend
npm install
```

### 3. Configurer les variables d’environnement

Créez un fichier `.env` dans le dossier `backend` :

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=edusmart_parent
JWT_SECRET=unsupermotdepasse
SMTP_HOST=smtp.ethereal.email   # pour tests email
SMTP_PORT=587
SMTP_USER=test@exemple.com
SMTP_PASS=secret
SMS_API_KEY=dummykey
```

### 4. Créer la base de données (PostgreSQL)

```sql
CREATE DATABASE edusmart_parent;
```

Puis exécutez les migrations (voir dossier `backend/migrations` – à créer).

### 5. Démarrer les serveurs

#### Back-end
```bash
cd backend
npm run dev
```

#### Front-end
```bash
cd frontend
npm run dev
```

Le front-end sera accessible sur `http://localhost:5173` et l’API sur `http://localhost:5000`.

## Structure de projet suggérée

```
edusmart-portail-parent/
├── backend/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── utils/
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── contexts/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env
│   └── package.json
└── README.md
```

## Mock des données (en attendant les vrais modules)

Puisque les autres modules (Admin, Enseignant) ne sont pas encore disponibles, vous pouvez **mocker** les données suivantes dans l’API :

- Liste des élèves liés à un parent
- Notes et bulletins
- Absences
- Messages

Exemple de mock pour un parent connecté (retour JSON) :

```json
{
  "eleves": [
    { "id": 1, "nom": "Njike Tom", "classe": "3ème" }
  ],
  "notes": [
    { "eleve_id": 1, "matiere": "Maths", "note": 15, "trimestre": 1 }
  ],
  "absences": [
    { "eleve_id": 1, "date": "2026-05-20", "justifiee": false }
  ]
}
```

## Critères de succès pour la soutenance (2 jours)

- [ ] Authentification parent/élève fonctionnelle (au moins 2 comptes mockés)
- [ ] Dashboard affichant les dernières notes et absences
- [ ] Page “Résultats” avec les notes par trimestre
- [ ] Page “Absences” avec motif et justification
- [ ] Envoi d’un message (stocké en base, pas besoin de WebSocket)
- [ ] Interface responsive (testée sur mobile virtuel)
- [ ] Temps de chargement < 3s sur réseau 3G (simulé dans DevTools)
- [ ] Code versionné avec commits réguliers (au moins 10 commits par membre)
- [ ] Documentation API minimale (dans le README ou `api.md`)

## Ressources utiles

- [React + Vite](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs/installation)
- [Express + PostgreSQL](https://expressjs.com/en/guide/database-integration.html#postgresql)
- [JWT avec Node.js](https://jwt.io/introduction)

---

**Bon développement !** Pensez à respecter les contraintes de sécurité et de performance. Le jury évaluera également votre gestion de projet (Kanban, commits, revues de code) et votre capacité à justifier vos choix techniques.
```