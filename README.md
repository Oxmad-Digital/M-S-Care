# M&S Care — Site catalogue & administration

Site vitrine et catalogue produits pour le laboratoire pharmaceutique **M&S Care**, avec un espace d'administration pour gérer les produits et les messages de contact. Construit avec **Next.js** (App Router), **Tailwind CSS**, **Prisma** et **Neon** (Postgres), authentification admin via **Auth.js (NextAuth v5)**.

## Stack

- Next.js 16 (App Router, TypeScript, Turbopack)
- Tailwind CSS v4
- Prisma ORM + Neon (Postgres)
- NextAuth v5 (Credentials, JWT)

## 1. Créer la base Neon

1. Créer un compte / projet sur [console.neon.tech](https://console.neon.tech).
2. Dans l'onglet **Connect** du projet, copier :
   - la **Pooled connection string** → variable `DATABASE_URL`
   - la **Direct connection string** (non poolée) → variable `DIRECT_URL` (nécessaire pour les migrations Prisma)

## 2. Configurer les variables d'environnement

Copier `.env.example` vers `.env` et renseigner :

```bash
cp .env.example .env
```

- `DATABASE_URL` / `DIRECT_URL` : connection strings Neon récupérées à l'étape 1.
- `AUTH_SECRET` : générer avec `openssl rand -base64 32`.

## 3. Installer les dépendances

```bash
npm install
```

## 4. Lancer les migrations

```bash
npx prisma migrate deploy
```

(La première migration `prisma/migrations/20260911163528_init` crée les tables `User`, `Product` et `ContactMessage`.)

## 5. Créer le compte admin et les produits de démonstration

Définir `ADMIN_EMAIL` et `ADMIN_PASSWORD` (dans `.env` ou en variables d'environnement), puis lancer le seed :

```bash
ADMIN_EMAIL="admin@exemple.mg" ADMIN_PASSWORD="motdepasse-solide" npm run seed
```

Cela crée le compte admin et importe les 9 produits de la maquette d'origine. **Pensez à changer le mot de passe** (ou recréer un utilisateur) après la première connexion — il n'y a pas encore d'écran "changer mon mot de passe" dans l'admin, cela se fait en relançant le seed avec un nouveau mot de passe, ou directement en base.

## 6. Lancer le site en local

```bash
npm run dev
```

- Site public : [http://localhost:3000](http://localhost:3000)
- Espace admin : [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

## Espace admin

- `/admin/produits` : liste, création, édition, suppression et publication/dépublication des produits.
- `/admin/messages` : consultation des messages envoyés depuis le formulaire de contact du site public.

Toutes les routes `/admin/*` (hors `/admin/login`) sont protégées par un middleware qui exige une session valide.

## Déploiement (Vercel)

1. Connecter le repo à Vercel.
2. Renseigner les variables d'environnement `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET` dans les réglages du projet Vercel.
3. Déployer — Vercel lance automatiquement `next build`. Penser à exécuter `npx prisma migrate deploy` (depuis un environnement ayant accès à `DIRECT_URL`) avant ou après le premier déploiement pour créer les tables.

## Notes techniques

- Les images du catalogue et des sections du site sont stockées en local dans `public/images/`.
- Le contenu du catalogue (produits) est entièrement piloté par la base de données — toute modification se fait depuis `/admin/produits`.
- Les messages du formulaire de contact sont enregistrés en base et consultables depuis `/admin/messages`.
