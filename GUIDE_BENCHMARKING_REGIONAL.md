# Guide : Benchmarking Régional et Score de Performance

Ce guide explique comment utiliser la fonctionnalité de benchmarking régional dans la page Analytics.

## 📊 Vue d'ensemble

La fonctionnalité de benchmarking régional permet de comparer votre score de satisfaction moyen avec :
- **La moyenne régionale** : Tous les cabinets situés dans la même région (même code postal)
- **La moyenne nationale** : Tous les cabinets de la plateforme

## 🚀 Configuration Initiale

### 1. Ajouter la colonne `code_postal` à la table `profiles`

Exécutez le script SQL suivant dans l'éditeur SQL de Supabase :

```sql
-- Fichier : supabase-add-postal-code.sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS code_postal TEXT;

CREATE INDEX IF NOT EXISTS profiles_code_postal_idx ON profiles(code_postal) 
WHERE code_postal IS NOT NULL;
```

### 2. Créer les fonctions RPC Supabase

Exécutez le script SQL suivant pour créer les fonctions de calcul :

```sql
-- Fichier : supabase-benchmarking-functions.sql
-- Ce script crée 3 fonctions :
-- 1. get_own_satisfaction_score : Calcule votre score moyen
-- 2. get_regional_satisfaction_average : Calcule la moyenne régionale
-- 3. get_national_satisfaction_average : Calcule la moyenne nationale
```

### 3. Configurer votre code postal

1. Allez dans **Paramètres** (`/dashboard/settings`)
2. Remplissez le champ **Code Postal** (ex: `75001`)
3. Cliquez sur **Enregistrer les modifications**

> **Note** : Le code postal est nécessaire pour activer le benchmarking régional. Sans code postal, seule la comparaison nationale sera disponible.

## 📈 Utilisation

### Accéder à la page Analytics

1. Naviguez vers **Analytics** (`/dashboard/analytics`)
2. La page charge automatiquement :
   - Votre score de satisfaction moyen
   - La moyenne régionale (si code postal configuré)
   - La moyenne nationale

### Comprendre les indicateurs

#### Carte "Performance Régionale"

- **Jauge de Performance** : Affiche votre position relative (0-100%)
- **Message Dynamique** :
  - ✨ **Top 10%** : Votre score est supérieur à la moyenne
  - 📈 **Aligné** : Votre score est égal à la moyenne
  - 💡 **À améliorer** : Votre score est inférieur à la moyenne

#### Statistiques Détaillées

- **Votre Score** : Score moyen calculé sur vos questionnaires de satisfaction
- **Moyenne Régionale** : Score moyen des autres cabinets de votre région
- **Moyenne Nationale** : Score moyen de tous les cabinets

#### Graphique Comparatif

Le graphique en barres compare visuellement :
- **Mon Cabinet** (bleu)
- **Moyenne Régionale** (vert) - si disponible
- **Moyenne Nationale** (violet)

## 🔒 Confidentialité

- **Aucun nom de cabinet n'est révélé** : Seules les moyennes agrégées sont affichées
- **Données anonymisées** : Les calculs sont effectués sur des données agrégées
- **Exclusion automatique** : Votre cabinet est exclu des calculs régionaux/nationaux

## 📝 Critères de Calcul

Les scores sont calculés uniquement pour les questionnaires :
- Marqués avec le tag `#Satisfaction` dans `community_templates`
- OU dont la pathologie contient "satisfaction" (insensible à la casse)

## ⚠️ Conditions d'Affichage

### Données insuffisantes

Si vous n'avez pas encore de réponses de satisfaction :
- Un message s'affiche : "Aucune donnée de satisfaction disponible"
- Vous devez envoyer des questionnaires de satisfaction à vos patients

### Code postal manquant

Si votre code postal n'est pas configuré :
- Un avertissement s'affiche dans Analytics
- Seule la comparaison nationale sera disponible
- Le benchmarking régional sera désactivé

## 🛠️ Dépannage

### Le benchmarking ne s'affiche pas

1. **Vérifiez votre code postal** : Allez dans Paramètres et ajoutez votre code postal
2. **Vérifiez les fonctions RPC** : Assurez-vous que les fonctions SQL ont été créées
3. **Vérifiez vos questionnaires** : Utilisez le modèle "Suivi de Satisfaction" ou un questionnaire avec le tag `#Satisfaction`

### Erreur "Fonction non trouvée"

Si vous voyez une erreur concernant les fonctions RPC :
1. Allez dans l'éditeur SQL de Supabase
2. Exécutez le script `supabase-benchmarking-functions.sql`
3. Vérifiez que les fonctions apparaissent dans la liste des fonctions

### Score à 0

Si votre score est à 0 :
- Vérifiez que vous avez envoyé des questionnaires de satisfaction
- Vérifiez que les patients ont répondu
- Vérifiez que les réponses ont un `score_total` calculé

## 📚 Fichiers Associés

- `app/dashboard/analytics/page.tsx` : Page principale du benchmarking
- `app/dashboard/settings/page.tsx` : Configuration du code postal
- `supabase-add-postal-code.sql` : Script pour ajouter la colonne code_postal
- `supabase-benchmarking-functions.sql` : Script pour créer les fonctions RPC

## 🎯 Prochaines Étapes

1. Configurez votre code postal dans les Paramètres
2. Envoyez des questionnaires de satisfaction à vos patients
3. Consultez régulièrement votre performance dans Analytics
4. Utilisez les insights pour améliorer votre service


