# Troubleshooting Guide

## 🔴 Backend Issues

### Le serveur backend ne démarre pas

**Symptôme:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Cause:** PostgreSQL non connecté ou non en cours d'exécution

**Solution:**

```bash
# Vérifier l'état de PostgreSQL
sudo service postgresql status

# Démarrer PostgreSQL
sudo service postgresql start

# Windows
net start postgresql-x64-15

# Vérifier la connexion
psql -h localhost -U postgres
```

---

### `Error: ENOENT: no such file or directory`

**Symptôme:** Erreur lors de npm start

**Cause:** node_modules manquants

**Solution:**

```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

### `Error: JWT_SECRET is not defined`

**Symptôme:** Le serveur démarre mais rejette toutes les connexions

**Cause:** Variables d'environnement manquantes

**Solution:**

```bash
# Créer .env dans backend/
echo 'JWT_SECRET=your_secret_key_here' >> .env
echo 'DB_HOST=localhost' >> .env
echo 'DB_USER=postgres' >> .env
# ... autres variables
```

---

### `EADDRINUSE: address already in use :::5000`

**Symptôme:** Port déjà utilisé

**Solution:**

```bash
# Linux/Mac
lsof -i :5000
kill -9 <PID>

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Ou changer de port
PORT=5001 npm run dev
```

---

## 🟡 Frontend Issues

### `VITE_API_URL is not defined`

**Symptôme:** L'app ne peut pas atteindre l'API

**Cause:** Fichier .env manquant dans frontend/

**Solution:**

```bash
cd frontend
echo 'VITE_API_URL=http://localhost:5000/api' > .env
npm run dev
```

---

### `Error: Cannot find module 'react'`

**Symptôme:** Module introuvable après npm install

**Solution:**

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

### Connexion API échoue (ERR_CONNECTION_REFUSED)

**Cause:** Backend non lancé ou port différent

**Solution:**

```bash
# 1. Vérifier que backend est lancé
curl http://localhost:5000/api/health

# 2. Vérifier VITE_API_URL
cat frontend/.env

# 3. Relancer les deux serveurs
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

---

### Login échoue: "Email ou mot de passe incorrect"

**Cause:** Compte inexistant ou migrations non exécutées

**Solution:**

```bash
# Exécuter les migrations
cd backend
npm run migrate

# Tester avec les comptes de démo
# parent@edusmart.cm / parent123
# eleve@edusmart.cm / eleve123
```

---

### Dashboard affiche "Erreur lors du chargement"

**Symptôme:** Page vide ou erreur API

**Cause:** Token expiré ou utilisateur non lié à un élève

**Solution:**

```bash
# 1. Se reconnecter
# 2. Vérifier les données en DB
psql edusmart_parent
SELECT * FROM users;
SELECT * FROM eleves;

# 3. Vérifier les logs
# Voir la console du navigateur (F12)
# Voir les logs du serveur backend
```

---

## 🟠 Database Issues

### `psql: error: FATAL: authentication failed`

**Cause:** Mot de passe PostgreSQL incorrect

**Solution:**

```bash
# Réinitialiser le mot de passe
sudo -u postgres psql
ALTER USER postgres PASSWORD 'newpassword';
\q

# Mettre à jour .env
DB_PASSWORD=newpassword
```

---

### `database "edusmart_parent" does not exist`

**Cause:** Base de données non créée

**Solution:**

```bash
# Créer la base
createdb edusmart_parent

# Ou avec psql
psql -U postgres
CREATE DATABASE edusmart_parent;
\q

# Exécuter les migrations
npm run migrate
```

---

### `relation "users" does not exist`

**Cause:** Tables non créées (migrations non exécutées)

**Solution:**

```bash
# Exécuter les migrations
cd backend
npm run migrate

# Vérifier
psql edusmart_parent
\dt  # Lister les tables
```

---

### Error: `column "password_hash" does not exist`

**Cause:** Schema BD incompatible avec le code

**Solution:**

```bash
# Recréer la DB proprement
dropdb edusmart_parent
createdb edusmart_parent
npm run migrate

# Ou mettre à jour le schema
psql edusmart_parent < migrations/001_init.sql
```

---

## 🔵 Performance Issues

### L'app est lente au démarrage

**Diagnostic:**

```bash
# 1. Vérifier la taille des bundles
cd frontend
npm run build
# Vérifier la taille de dist/

# 2. Utiliser Chrome DevTools
# F12 > Network > Recharger
# F12 > Performance > Enregistrer
```

**Solutions:**

- Réduire la taille des assets
- Utiliser lazy loading
- Compresser les images
- Vérifier la performance DB

---

### API lente (>1000ms par requête)

**Diagnostic:**

```bash
# Vérifier les logs
# Ajouter du timing dans les routes

// Backend route
const start = Date.now();
const result = await query(...);
console.log(`Query time: ${Date.now() - start}ms`);
```

**Solutions:**

- Ajouter des indexes DB
- Optimiser les requêtes
- Ajouter du caching
- Utiliser la pagination

---

## 🟣 Authentication Issues

### Login page: "Erreur interne du serveur"

**Cause:** Erreur serveur non gérée

**Solution:**

```bash
# Vérifier les logs backend
# Vérifier la structure des données POST
# Tester l'endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"parent@edusmart.cm","password":"parent123"}'
```

---

### Token non accepté: "Token invalide"

**Cause:** Token expiré ou secret incorrect

**Solution:**

```bash
# Vérifier JWT_SECRET dans .env
# Format du token: Bearer eyJhbGc...
# Vérifier les headers: Authorization: Bearer {token}
```

---

## 📊 Logs et Debugging

### Activer les logs détaillés

**Backend:**

```javascript
// backend/server.js
if (process.env.DEBUG) {
  console.log('DEBUG MODE ON');
  // Logs détaillés
}

// Lancer avec DEBUG
DEBUG=true npm run dev
```

**Frontend:**

```javascript
// Partout
if (process.env.VITE_DEBUG) {
  console.log('Data:', data);
}

// Lancer avec
VITE_DEBUG=true npm run dev
```

---

### Déboguer avec VS Code

**.vscode/launch.json:**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Backend",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/backend/server.js",
      "cwd": "${workspaceFolder}/backend"
    }
  ]
}
```

---

## 🆘 Si tout échoue

1. **Nettoyer complètement:**

```bash
# Backend
cd backend
rm -rf node_modules .env package-lock.json
npm install
npm run migrate

# Frontend
cd frontend
rm -rf node_modules .env.local dist package-lock.json
npm install
```

2. **Redémarrer les services:**

```bash
# Redémarrer PostgreSQL
sudo service postgresql restart

# Redémarrer les serveurs Node
npm run dev
```

3. **Vérifier les logs:**

```bash
# Frontend: F12 > Console
# Backend: Terminal où npm run dev est lancé
# Database: psql et commandes SQL
```

4. **Contacter le support:**

- Email: support@nexatec-solutions.cm
- Inclure:
  - Version Node/npm
  - Message d'erreur complet
  - Commandes exécutées
  - Logs pertinents

---

## 📝 Checklist de vérification

- [ ] Node.js 16+ installé
- [ ] PostgreSQL en cours d'exécution
- [ ] .env configurés (backend et frontend)
- [ ] npm install exécuté (backend et frontend)
- [ ] Migrations exécutées
- [ ] Backend démarre sans erreurs
- [ ] Frontend se charge
- [ ] Login fonctionne
- [ ] API accessible (http://localhost:5000/api/health)
- [ ] Base de données contient les données
