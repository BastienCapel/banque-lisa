# Banque de l'été - Pocket Money & Compound Interest Tracker

Une application web mobile-first interactive conçue pour Lisa (16 ans) afin de suivre son argent de poche d'été tout en comprenant concrètement le pouvoir des intérêts composés et l'impact à long terme des dépenses.

---

## 🎯 Objectif Pédagogique

* **Intérêts Cumulés** : Faire ressentir que l'argent placé produit des intérêts et que ces intérêts produisent à leur tour des intérêts.
* **Coût Réel des Dépenses** : Démontrer qu'un retrait ne coûte pas seulement le montant retiré, mais aussi les intérêts futurs qu'il aurait générés.
* **Simulations d'Épargne** : Permettre à Lisa de simuler ses choix de dépenses (ex: retirer 5 € par semaine) avant de les réaliser, et comparer les scénarios en temps réel.
* **Sécurité Budgétaire** : Aider le parent (banquier) à maîtriser son budget d'argent de poche (plafond de 200 €) grâce à des projections claires.

---

## 🛠️ Stack Technique

* **Framework** : Next.js 15 (App Router, React 19, TypeScript)
* **Design** : Tailwind CSS (mobile-first, thématique ado moderne, gradients, icônes Lucide)
* **Base de Données** : Google Sheets (via un Service Account côté serveur)
* **Graphiques** : Recharts (tracé d'évolution et comparaison de courbes)
* **Tests** : Vitest (validation rigoureuse du moteur financier)
* **Déploiement** : Vercel / GitHub

---

## 🗃️ Structure de la Base de Données (Google Sheets)

Pour lier l'application à votre Google Sheet, créez un classeur contenant les 4 onglets suivants :

### 1. `Parametres`
Permet de configurer les règles financières depuis l'espace parent.
* **Colonnes** : `key` | `value` | `type` | `label` | `updatedAt`
* **Lignes attendues** (initialisées par l'application si l'onglet est vide) :
  * `startDate` : `2026-07-13` (Date de début)
  * `endDate` : `2026-08-10` (Date de fin)
  * `initialCapital` : `10` (Capital de départ)
  * `dailyAllowance` : `2.10` (Argent de poche quotidien)
  * `dailyInterestRate` : `0.05` (Taux d'intérêt de 5 % par jour)
  * `finalBonusRate` : `0.10` (Bonus final de 10 %)
  * `maxBudget` : `200` (Seuil budgétaire de sécurité)
  * `currency` : `EUR` (Devise)
  * `appName` : `Banque de l'été` (Titre)

### 2. `Transactions`
Stocke les demandes de retrait et les ajustements manuels.
* **Colonnes** : `id` | `date` | `type` | `amount` | `label` | `note` | `status` | `createdBy` | `createdAt` | `updatedAt`
* **Types** : `withdrawal` (retrait initié par Lisa, montant négatif) ou `adjustment` (ajustement parent, positif/négatif)
* **Statuts** : `pending` (en attente), `approved` (approuvé par le parent), `rejected` (rejeté), `deleted` (supprimé)

### 3. `Scenarios`
Enregistre les simulations enregistrées par Lisa.
* **Colonnes** : `id` | `name` | `description` | `withdrawalsJson` | `resultFinalBalance` | `resultInterestLost` | `createdAt`

### 4. `AuditLog`
Journalise les actions importantes du parent ou de Lisa pour des raisons de transparence.
* **Colonnes** : `id` | `action` | `entityType` | `entityId` | `previousValueJson` | `newValueJson` | `createdAt`

---

## 🔑 Configuration de Google Cloud & Service Account

Pour connecter Next.js à Google Sheets de manière sécurisée et sans clé exposée sur le client :

1. Allez sur la [Google Cloud Console](https://console.cloud.google.com/).
2. Créez un nouveau projet (ex: `Banque de l'été`).
3. Activez l'API **Google Sheets API** dans la bibliothèque des API.
4. Allez dans **IHM IAM & admin** > **Comptes de service** et cliquez sur **Créer un compte de service**.
5. Renseignez un nom et terminez la création.
6. Cliquez sur le compte créé, allez dans l'onglet **Clés** > **Ajouter une clé** > **Créer une nouvelle clé** au format **JSON**.
7. Téléchargez le fichier de clé de manière sécurisée. Copiez :
   * L'adresse email du compte de service (ex: `sheets-access@project.iam.gserviceaccount.com`).
   * La clé privée (`private_key`) présente dans le JSON.
8. **Partage du Google Sheets** : Ouvrez votre fichier Google Sheet dans le navigateur, cliquez sur **Partager** (en haut à droite) et ajoutez l'email de votre compte de service avec le rôle **Éditeur**.

---

## ⚙️ Variables d'Environnement

Créez un fichier `.env.local` à la racine de votre projet pour le développement local :

```env
# Accès Base de données Google Sheets
GOOGLE_SERVICE_ACCOUNT_EMAIL=votre-compte-service@projet.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=votre_identifiant_de_sheet_depuis_l_url

# Codes d'accès de l'application
APP_PARENT_PIN=1234
APP_PRIVATE_ACCESS_TOKEN=Lisa2026
```

> [!NOTE]
> En cas d'absence des variables Google Sheets dans `.env.local`, l'application **bascule automatiquement en mode Mock de Secours** local (elle enregistre les données dans `data/db.json`). Cela vous permet de tester immédiatement l'application en local sans aucune clé Google !

---

## 💻 Installation & Lancement Local

### 1. Cloner et installer les dépendances
```bash
npm install
```

### 2. Lancer les tests unitaires
Nous utilisons Vitest pour valider l'intégrité des calculs d'intérêts et de bonus :
```bash
npm run test
```

### 3. Lancer le serveur de développement
```bash
npm run dev
```
Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

---

## 🚀 Déploiement sur Vercel

1. Créez un repository GitHub et poussez votre code :
   ```bash
   git init
   git add .
   git commit -m "Initial commit Banque de l'ete"
   git remote add origin git@github.com:votre-nom/banque-lisa.git
   git branch -M main
   git push -u origin main
   ```
2. Rendez-vous sur [Vercel](https://vercel.com/) et connectez votre compte GitHub.
3. Importez le projet `Banque de l'été`.
4. Renseignez les **Variables d'environnement** définies dans la section précédente.
5. Cliquez sur **Deploy**.

---

## 🛡️ Sécurité & Fonctionnalités PWA

* **Sécurité** : L'accès Lisa est protégé par le token privé fourni dans l'URL (`?token=Lisa2026`), persisté sous forme de cookie `lisa_session` HTTP-Only. L'administration parent est protégée par `APP_PARENT_PIN` vérifié côté serveur et stocké de manière sécurisée en cookie de session admin.
* **PWA** : L'application est installable sur smartphone (iPhone / Android) sous forme d'application native indépendante grâce à son manifest PWA complet et ses icônes.
