# Guide de déploiement

## 🌐 Environnements

### Development (Local)

```bash
npm run dev  # Backend et Frontend en mode développement
```

### Production (VPS/Cloud)

## 📦 Préparation

### 1. Build Backend

```bash
cd backend

# Optionnel: Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install --production

# Vérifier les erreurs
npm run lint  # si disponible
```

### 2. Build Frontend

```bash
cd frontend

# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install --production

# Build production
npm run build

# Résultat dans ./dist/
```

### 3. Variables d'environnement

**Backend (.env)**

```env
NODE_ENV=production
PORT=5000

# Base de données (production)
DB_HOST=<rds-endpoint>
DB_PORT=5432
DB_USER=<secure-username>
DB_PASSWORD=<strong-password>
DB_NAME=edusmart_parent
DB_SSL=true

# Sécurité
JWT_SECRET=<generate-with-openssl-rand-hex-32>
BCRYPT_ROUNDS=12
JWT_EXPIRES_IN=24h

# Rate limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# CORS
CORS_ORIGIN=https://edusmart-cm.com

# Email (Twilio, SendGrid, etc.)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<sendgrid-api-key>

# SMS (Twilio)
TWILIO_ACCOUNT_SID=<account-sid>
TWILIO_AUTH_TOKEN=<auth-token>
TWILIO_FROM_NUMBER=+1234567890
```

**Frontend (.env.production)**

```env
VITE_API_URL=https://api.edusmart-cm.com
VITE_APP_NAME=EduSmart
VITE_APP_VERSION=1.0.0
```

## 🚀 Déploiement sur différentes plateformes

### Heroku (Recommandé pour MVP)

#### Procfile

```
web: node backend/server.js
```

#### Buildpack

```bash
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add https://github.com/mars/create-react-app-buildpack.git
```

#### Déploiement

```bash
# Variables d'environnement
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=<secret>
# ... autres variables

# Database
heroku addons:create heroku-postgresql:standard-0
heroku run npm run migrate

# Deploy
git push heroku main
```

### AWS (Architecture recommandée)

#### Architecture EC2 + RDS

1. **Créer une instance EC2**
   - Ubuntu 22.04 LTS
   - Type: t3.medium (minimum)
   - Security group: ports 80, 443, 5000

2. **Installer Node.js et PostgreSQL**

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install -y postgresql postgresql-contrib
```

3. **Cloner et déployer**

```bash
cd /app
git clone <repo>
cd edusmart-portail-parent

# Backend
cd backend
npm install --production
npm run migrate

# Frontend
cd ../frontend
npm install --production
npm run build
```

4. **Utiliser Nginx comme reverse proxy**

```nginx
server {
    listen 80;
    server_name edusmart-cm.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }

    location /api {
        proxy_pass http://localhost:5000;
    }
}
```

5. **Configurer PM2** (process manager)

```bash
npm install -g pm2

# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'edusmart-backend',
    script: './backend/server.js',
    env: {
      NODE_ENV: 'production',
      DB_HOST: process.env.DB_HOST
    },
    instances: 'max',
    exec_mode: 'cluster'
  }]
};

pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Digital Ocean / Linode

Similaire à AWS, mais avec droplet au lieu d'instance EC2.

### Vercel (Frontend only)

```bash
npm install -g vercel

vercel --prod
```

Configurer les variables d'environnement dans les paramètres Vercel.

## 🔒 Sécurité en production

### SSL/TLS

```bash
# Let's Encrypt avec Nginx
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d edusmart-cm.com
```

### Firewall

```bash
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### Backups

```bash
# Database backup
pg_dump -U postgres edusmart_parent > backup_$(date +%Y%m%d).sql

# Backup automated
0 2 * * * /usr/bin/pg_dump -U postgres edusmart_parent | gzip > /backups/edusmart_$(date +\%Y\%m\%d).sql.gz
```

### Monitoring

- Mettre en place Sentry pour les erreurs
- CloudWatch/Datadog pour la performance
- Notifications Slack pour les alertes

```javascript
// Sentry (Backend)
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://<key>@sentry.io/<project>",
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.errorHandler());
```

## 📊 Monitoring et Logs

### PM2 Monitoring

```bash
pm2 monit
pm2 logs
pm2 save
```

### Logs d'application

```bash
# Backend logs
tail -f /app/logs/backend.log

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## 🔄 CI/CD Pipeline

### GitHub Actions exemple

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci --prefix backend && npm ci --prefix frontend

      - name: Build frontend
        run: npm run build --prefix frontend

      - name: Deploy
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
        run: |
          mkdir -p ~/.ssh
          echo "$DEPLOY_KEY" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh -i ~/.ssh/deploy_key user@server 'cd /app && git pull && npm install && npm run migrate && pm2 restart all'
```

## 🧪 Checklist de déploiement

- [ ] Toutes les variables d'env configurées
- [ ] Database migrated
- [ ] SSL certificate installé
- [ ] Tests passés
- [ ] Performance vérifiée
- [ ] Backups configurés
- [ ] Monitoring activé
- [ ] Erreurs logging configuré
- [ ] Cache invalidé (CDN)
- [ ] DNS pointé
- [ ] Email fonctionnel
- [ ] SMS fonctionnel
- [ ] Santé de l'API vérifiée

## 🚨 Rollback d'urgence

```bash
# Git
git revert <commit-hash>
git push

# PM2
pm2 restart all

# Database
psql < backup_20240101.sql
```

## 📞 Support en production

- Mettre en place une page de maintenance
- Alertes pour downtimes
- Support 24/7 si possible
- Communication utilisateurs en cas d'incident
