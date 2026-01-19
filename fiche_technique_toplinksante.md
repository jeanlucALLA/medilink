# Fiche Technique - TopLinkSante

**Date :** 18 Janvier 2026  
**Site :** www.toplinksante.com

---

## Présentation

**TopLinkSante** est une plateforme SaaS de suivi patient pour les praticiens de santé (podologues, kinésithérapeutes, chirurgiens orthopédiques).

---

## Stack Technologique

| Catégorie | Technologie | Version |
|-----------|-------------|---------|
| **Langage** | TypeScript / JavaScript (Node.js) | TS 5.3.3 |
| **Framework** | Next.js | 14.0.4 |
| **Frontend** | React | 18.2.0 |
| **CSS** | Tailwind CSS | 3.4.0 |
| **Base de données** | Supabase (PostgreSQL) | 2.90.0 |
| **Authentification** | Supabase Auth | SSR 0.8.0 |
| **Paiements** | Stripe | 20.1.0 |
| **Emails** | Resend | 2.1.0 |
| **Hébergement** | Vercel | - |

---

## Dépendances Principales

| Package | Usage |
|---------|-------|
| `@stripe/stripe-js` | Checkout paiement |
| `@supabase/supabase-js` | Base de données + Auth |
| `resend` | Envoi d'emails transactionnels |
| `lucide-react` | Icônes |
| `recharts` | Graphiques statistiques |
| `react-hot-toast` | Notifications toast |
| `jspdf` | Génération PDF |
| `zod` | Validation de données |

---

## URLs

| Environnement | URL |
|---------------|-----|
| **Production** | https://www.toplinksante.com |
| **GitHub** | https://github.com/jeanlucALLA/medilink |
| **Vercel Dashboard** | https://vercel.com/jeanlucallas-projects |

---

## Structure du Projet

```
c:\Users\HP\Documents\Medi.Link\
├── app/                    # Pages Next.js (App Router)
│   ├── dashboard/          # Tableau de bord praticien
│   ├── admin/              # Interface admin
│   ├── api/                # Routes API (Stripe, emails, etc.)
│   ├── abonnement/         # Page tarification
│   ├── register/           # Inscription
│   └── login/              # Connexion
├── components/             # Composants React réutilisables
├── lib/                    # Utilitaires (Supabase, Stripe, emails)
├── supabase/               # Migrations SQL
└── public/                 # Assets statiques
```

---

## Fonctionnalités Principales

### Pour les Praticiens
- ✅ Création de questionnaires de suivi personnalisés
- ✅ Programmation d'envoi différé (J+7, J+14, J+30...)
- ✅ Alertes en temps réel pour insatisfactions
- ✅ Redirection automatique vers Google Reviews (patients satisfaits)
- ✅ Tableau de bord statistique
- ✅ Système de parrainage

### Pour l'Administration
- ✅ Gestion des praticiens
- ✅ Suivi des abonnements (MRR)
- ✅ Messagerie support
- ✅ Notifications système

---

## Modèle Économique

| Offre | Prix | Caractéristiques |
|-------|------|------------------|
| **Essai gratuit** | 0€ | 5 jours, toutes fonctionnalités |
| **Abonnement Pro** | 9,99€/mois | Accès illimité, sans engagement |

---

## Sécurité & Conformité

- 🔒 **Zero-Data** : Aucune donnée de santé stockée
- 🔒 **RGPD** : Conforme aux réglementations européennes
- 🔒 **Supabase RLS** : Row Level Security pour les données
- 🔒 **Stripe** : Paiements sécurisés PCI-DSS

---

## Variables d'Environnement Requises

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
```

---

## Contact

**Email :** jeanlucallaa@yahoo.fr  
**Site :** www.toplinksante.com
