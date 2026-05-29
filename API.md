# Documentation API EDUSMART-CM

## Vue d'ensemble

API REST pour le Portail Parent/Élève de la plateforme EDUSMART-CM.
Hébergée sur `http://localhost:5000/api` en développement.

## Authentication

### Endpoints d'authentification

#### POST /auth/login

Connexion utilisateur (parent ou élève).

**Request:**

```json
{
  "email": "parent@edusmart.cm",
  "password": "parent123"
}
```

**Response (200):**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "parent@edusmart.cm",
    "nom": "Mballa",
    "prenom": "Jean-Pierre",
    "role": "parent"
  }
}
```

**Comptes de test:**

- Parent: `parent@edusmart.cm` / `parent123`
- Élève: `eleve@edusmart.cm` / `eleve123`

---

#### GET /auth/verify

Vérifier la validité du token JWT.

**Headers:**

```
Authorization: Bearer {token}
```

**Response (200):**

```json
{
  "valid": true,
  "user": { ... }
}
```

---

#### POST /auth/logout

Déconnexion de l'utilisateur.

**Response (200):**

```json
{
  "success": true,
  "message": "Déconnexion réussie"
}
```

---

## Élèves

### GET /api/students

Récupérer la liste des élèves (pour un parent) ou les infos de l'élève connecté.

**Response (200):**

```json
{
  "eleves": [
    {
      "id": 1,
      "matricule": "MAT2026001",
      "nom": "Mballa",
      "prenom": "Sarah",
      "classe": "3ème A",
      "niveau": "Troisième",
      "etablissement": "Lycée Bilingue de Yaoundé",
      "annee_scolaire": "2025-2026"
    }
  ]
}
```

---

## Notes

### GET /api/grades/eleve/:eleveId

Récupérer les notes d'un élève avec filtres optionnels.

**Query Parameters:**

- `trimestre` (number): 1, 2 ou 3
- `matiere` (number): ID de la matière

**Response (200):**

```json
{
  "notes": [
    {
      "id": 1,
      "matiere": "Mathématiques",
      "note": 15.5,
      "type_evaluation": "Composition",
      "trimestre": 1,
      "date_evaluation": "2025-12-10",
      "commentaire": "Bon travail",
      "coefficient": 4
    }
  ],
  "moyennes": {
    "1": {
      "Mathématiques": {
        "moyenne": 13.75,
        "coefficient": 4,
        "nombre_notes": 2
      }
    }
  }
}
```

---

## Absences

### GET /api/absences/eleve/:eleveId

Récupérer les absences d'un élève.

**Query Parameters:**

- `page` (number, default: 1)
- `limit` (number, default: 20)
- `justifiee` (boolean)
- `mois` (number)
- `annee` (number)

**Response (200):**

```json
{
  "absences": [
    {
      "id": 1,
      "eleve_id": 1,
      "date_absence": "2025-11-20",
      "heure_debut": "08:00",
      "heure_fin": "12:00",
      "motif": "Rendez-vous médical",
      "justifiee": false,
      "justificatif_url": null
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20
}
```

---

### PUT /api/absences/:absenceId/justifier

Justifier une absence.

**Request:**

```json
{
  "motif": "Certificat médical",
  "justificatif_url": "https://..."
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Absence justifiée avec succès"
}
```

---

## Messages

### GET /api/messages

Récupérer les messages de l'utilisateur.

**Query Parameters:**

- `type`: 'all', 'received', 'sent', 'unread'
- `page` (number, default: 1)
- `limit` (number, default: 20)

**Response (200):**

```json
{
  "messages": [
    {
      "id": 1,
      "expediteur_id": 2,
      "expediteur_nom": "Dupont",
      "destinataire_id": 1,
      "destinataire_nom": "Martin",
      "sujet": "Résultats trimestriels",
      "contenu": "Les résultats de votre enfant...",
      "lu": false,
      "created_at": "2025-12-15T10:30:00Z"
    }
  ],
  "total": 10,
  "page": 1
}
```

---

### POST /api/messages

Envoyer un nouveau message.

**Request:**

```json
{
  "destinataire_id": 2,
  "sujet": "Question sur le devoir",
  "contenu": "Je voudrais clarifier...",
  "eleve_concerne_id": 1
}
```

**Response (201):**

```json
{
  "success": true,
  "message": {
    "id": 5,
    "expediteur_id": 1,
    "destinataire_id": 2,
    "sujet": "Question sur le devoir",
    "contenu": "Je voudrais clarifier...",
    "lu": false,
    "created_at": "2025-12-15T14:00:00Z"
  }
}
```

---

### PUT /api/messages/:messageId/marquer-lu

Marquer un message comme lu.

**Response (200):**

```json
{
  "success": true,
  "message": "Message marqué comme lu"
}
```

---

### DELETE /api/messages/:messageId

Supprimer un message.

**Response (200):**

```json
{
  "success": true,
  "message": "Message supprimé"
}
```

---

## Notifications

### GET /api/notifications

Récupérer les notifications de l'utilisateur.

**Query Parameters:**

- `lu` (boolean)
- `type`: 'absence', 'note', 'message', 'reunion', 'general'
- `page` (number, default: 1)
- `limit` (number, default: 20)

**Response (200):**

```json
{
  "notifications": [
    {
      "id": 1,
      "user_id": 1,
      "type": "absence",
      "titre": "Absence injustifiée",
      "message": "Sarah a une absence injustifiée le 15/12/2025",
      "lu": false,
      "envoye_sms": true,
      "envoye_email": true,
      "created_at": "2025-12-15T09:00:00Z"
    }
  ],
  "total": 5,
  "page": 1
}
```

---

### GET /api/notifications/resume/statistiques

Récupérer un résumé des notifications.

**Response (200):**

```json
{
  "resume": {
    "non_lues": 3,
    "dernieres_non_lues": [
      {
        "id": 1,
        "titre": "Absence injustifiée",
        "created_at": "2025-12-15T09:00:00Z"
      }
    ]
  }
}
```

---

### PUT /api/notifications/:notificationId/marquer-lue

Marquer une notification comme lue.

**Response (200):**

```json
{
  "success": true,
  "message": "Notification marquée comme lue"
}
```

---

## Santé de l'API

### GET /api/health

Vérifier l'état de l'API.

**Response (200):**

```json
{
  "status": "OK",
  "timestamp": "2025-12-15T14:00:00Z",
  "environment": "development",
  "version": "1.0.0"
}
```

---

## Codes d'erreur

| Code | Description                    |
| ---- | ------------------------------ |
| 200  | Succès                         |
| 201  | Créé                           |
| 400  | Requête invalide               |
| 401  | Non authentifié / Token expiré |
| 403  | Non autorisé                   |
| 404  | Non trouvé                     |
| 429  | Trop de requêtes               |
| 500  | Erreur serveur                 |

---

## Limites de taux (Rate Limiting)

- **Fenêtre**: 15 minutes
- **Limite**: 100 requêtes par fenêtre

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1639568400
```

---

## Notes pour le développement

### Variables d'environnement

Backend (.env):

```
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=edusmart_parent
JWT_SECRET=edusmart_super_secret_key_2026
```

Frontend (.env):

```
VITE_API_URL=http://localhost:5000/api
```

### Démarrage

**Backend:**

```bash
cd backend
npm install
npm run dev
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

### Migrations

```bash
cd backend
npm run migrate
```

---

## Support et Contact

Pour toute question technique, veuillez contacter l'équipe de développement.
