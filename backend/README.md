# Village 1800 — Backend API

API Node.js/Express + MySQL pour le site vitrine Village 1800.

## 🎯 Périmètre (strict cahier des charges client)

1. **CRUD produits** (nom, description, photos, bilingue)
2. **Authentification sécurisée** (JWT, bcrypt, protection routes admin)
3. **Messages contact** (réception, sauvegarde, consultation, badge non-lus)
4. **Stats visiteurs** (pays, ville, page, appareil, navigateur — dashboard admin)

## 🚀 Stack

- **Runtime :** Node 18+
- **Framework :** Express 4
- **DB :** MySQL 8 (via `mysql2`)
- **Auth :** JWT (`jsonwebtoken` + `bcryptjs`)
- **Sécurité :** Helmet, CORS whitelist, rate limiting, validation `express-validator`
- **Uploads :** Multer (mémoire) + Cloudinary
- **Géolocalisation :** ip-api.com (cache 24h)

## 📁 Structure

```
backend/
├── src/
│   ├── index.js               # Entry point + middlewares globaux
│   ├── config/
│   │   ├── db.js              # Pool MySQL
│   │   └── cloudinary.js      # Upload images
│   ├── middleware/
│   │   ├── auth.js            # JWT + requireAdmin
│   │   ├── validate.js        # Wrapper express-validator
│   │   ├── asyncHandler.js    # Wrapper async controllers
│   │   └── rateLimits.js      # Rate limiters (login/contact/tracking)
│   ├── routes/                # authRoutes, produitRoutes,
│   │                          # contactRoutes, trackingRoutes
│   ├── controllers/           # Un par domaine
│   └── scripts/
│       ├── migrateSchema.js   # Migration idempotente
│       ├── createAdmin.js     # Bootstrap admin (interactif ou via env)
│       └── dropUnusedTables.js # One-shot : supprime les tables héritées
├── .env.example
├── .gitignore                 # .env est IGNORÉ
└── package.json
```

## 🛠 Setup local

```bash
# 1. Installer les dépendances
cd backend
npm install

# 2. Configurer l'environnement
cp .env.example .env
# → éditer .env avec tes valeurs (DB, JWT, Cloudinary…)

# 3. Créer les tables (idempotent)
npm run migrate

# 4. Créer le premier admin (prompt interactif sécurisé)
npm run create-admin

# 5. Lancer en dev
npm run dev
```

Le serveur démarre sur `http://localhost:3000` avec logs :

```
✅ Connexion MySQL réussie !
🚀 Serveur démarré sur le port 3000 (development)
🌍 CORS autorisé pour : http://localhost:4200
```

## 🔌 Endpoints

### Publics (aucune auth)

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check (retourne 503 si DB down) |
| POST | `/api/auth/login` | Login admin — rate limit 5/15min |
| GET | `/api/produits` | Liste produits actifs (support `?lang=fr\|en`) |
| GET | `/api/produits/:id` | Détail produit |
| POST | `/api/contact` | Envoyer message — rate limit 3/h + honeypot |
| POST | `/api/tracking` | Log visite (auto géoloc) |

### Admin (JWT + rôle admin)

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/auth/me` | Profil courant |
| GET | `/api/produits/all` | Tous les produits (incl. inactifs) |
| POST | `/api/produits` | Créer produit |
| POST | `/api/produits/upload` | Upload image → Cloudinary |
| PUT | `/api/produits/:id` | Modifier |
| DELETE | `/api/produits/:id` | Supprimer (+ image Cloudinary) |
| GET | `/api/contact` | Messages reçus |
| GET | `/api/contact/unread-count` | **Badge messages non lus** → `{ count: N }` |
| PUT | `/api/contact/:id/lu` | Marquer lu |
| DELETE | `/api/contact/:id` | Supprimer |
| GET | `/api/tracking` | Visites (`?limit=200`) |
| GET | `/api/tracking/stats` | Stats agrégées (pays, page, appareil, jour) |

## 🔒 Sécurité en place

- ✅ `.env` dans `.gitignore` (jamais commité)
- ✅ Fail-fast au boot si variables critiques manquantes
- ✅ Helmet (headers HTTP sécurisés)
- ✅ CORS whitelist (via `CORS_ORIGINS`)
- ✅ Rate limiting par IP (login 5/15min, contact 3/h, global 500/15min)
- ✅ Validation input systématique (`express-validator`)
- ✅ Honeypot anti-bot sur formulaire contact
- ✅ Vérification rôle admin sur toutes routes sensibles
- ✅ Sanitisation `err.message` en prod (masqué au client)
- ✅ bcrypt 12 rounds pour mots de passe admin
- ✅ Réponse générique sur login raté (anti-énumération d'emails)
- ✅ `trust proxy = 1` pour rate-limit correct derrière reverse proxy
- ✅ Graceful shutdown SIGTERM/SIGINT (Railway compatible)
- ✅ Body size limit 1 MB

## 🧹 Nettoyage tables héritées (à faire 1 fois)

Si tu vois encore les tables `recettes`, `lots`, `newsletter_subscribers` dans ta DB
(créées lors d'une itération précédente), lance :

```bash
npm run drop-unused
```

Ce script les supprime définitivement. À ne lancer qu'une seule fois.

## 📦 Déploiement Railway (production)

### 1. Push vers GitHub
```bash
git add backend/
git commit -m "chore: production-ready backend"
git push origin main
```

### 2. Créer le projet Railway
1. Se connecter sur [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. Sélectionner le repo → Railway détecte auto le backend Node.js
4. **Root directory :** `backend`

### 3. Ajouter une base MySQL
1. Dans le projet Railway : **+ New** → **Database** → **MySQL**
2. Railway crée automatiquement les variables :
   - `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`

### 4. Configurer les variables d'environnement
Dans **Variables** du service backend, ajouter :

```
NODE_ENV=production
JWT_SECRET=<générer via: openssl rand -hex 32>
JWT_EXPIRES_IN=7d
CORS_ORIGINS=https://village1800.vercel.app,https://www.village1800.com

DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}

CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

### 5. Lancer la migration & créer l'admin (première fois)
Dans Railway : **Settings → Deploy → Custom Start Command** temporairement :
```
node src/scripts/migrateSchema.js && node src/scripts/createAdmin.js && npm start
```
OU se connecter en SSH Railway :
```bash
railway run npm run migrate
railway run npm run create-admin
```
Puis retirer la commande custom, laisser `npm start`.

### 6. Configurer un domaine
- **Settings → Networking → Generate Domain** → obtient une URL `xxx.up.railway.app`
- Ou lier ton domaine perso (`api.village1800.com` par ex.)
- Mettre à jour `environment.prod.ts` du frontend Angular avec cette URL

## ✅ Checklist avant mise en ligne

- [ ] `JWT_SECRET` généré aléatoirement (32+ caractères)
- [ ] `CORS_ORIGINS` = URL prod du frontend Vercel
- [ ] Cloudinary configuré et testé (upload d'une image test)
- [ ] Migration exécutée (`/api/health` retourne 200)
- [ ] Admin créé, login testé
- [ ] `ADMIN_INITIAL_PASSWORD` vidé après première création
- [ ] Health check monitoré (UptimeRobot ou similaire)
- [ ] Backup MySQL automatique activé côté Railway
- [ ] `npm run drop-unused` lancé une fois (si tables héritées)

## 🧪 Tester les endpoints

```bash
# Health check
curl https://ton-api.up.railway.app/api/health

# Login
curl -X POST https://ton-api.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@village1800.com","password":"xxx"}'

# Produits (public)
curl https://ton-api.up.railway.app/api/produits?lang=fr

# Contact (public)
curl -X POST https://ton-api.up.railway.app/api/contact \
  -H "Content-Type: application/json" \
  -d '{"nom":"Test","email":"test@test.com","message":"Bonjour !"}'

# Badge messages non lus (admin)
curl https://ton-api.up.railway.app/api/contact/unread-count \
  -H "Authorization: Bearer TON_JWT_TOKEN"
```

## 📝 Notes

- **Rate limits** : ajustables dans `src/middleware/rateLimits.js`
- **Cache géoloc** : 24h en mémoire (redémarrage vide le cache — pas critique)
