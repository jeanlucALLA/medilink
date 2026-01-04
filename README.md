# Medi.Link - SaaS Médical

Application de gestion médicale pour les praticiens, construite avec Next.js, Tailwind CSS et Supabase.

## Installation

1. Installer les dépendances :
```bash
npm install
```

2. Configurer les variables d'environnement :
Créer un fichier `.env.local` à la racine du projet :
```
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon_supabase
```

3. Lancer le serveur de développement :
```bash
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## Structure

- `/app/login` - Page de connexion
- `/app/dashboard` - Vue d'ensemble
- `/app/dashboard/patients` - Gestion des patients
- `/app/dashboard/settings` - Paramètres

## Technologies

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase
- Lucide React (icônes)




