# Guide : Publier votre Premier Modèle vers la Communauté

## 🚀 Publier votre premier modèle personnel

Ce guide vous explique étape par étape comment partager un de vos questionnaires avec la communauté Medi.Link.

## 📋 Prérequis

1. ✅ Avoir créé au moins un questionnaire dans votre compte
2. ✅ Avoir exécuté le script `supabase-community-templates.sql` dans Supabase
3. ✅ Être connecté à votre compte Medi.Link

## 🎯 Étapes pour publier un modèle

### Étape 1 : Préparer votre questionnaire

1. Allez dans **Dashboard > Questionnaire**
2. Descendez jusqu'à la section **"Questionnaires créés"**
3. Identifiez le questionnaire que vous souhaitez partager
4. **Important** : Assurez-vous que :
   - Le questionnaire contient des questions pertinentes et réutilisables
   - La pathologie/titre est claire et descriptive
   - Les questions sont bien formulées et agnostiques (pas de références trop spécifiques)

### Étape 2 : Cliquer sur "Partager"

1. Dans la liste des questionnaires, trouvez celui que vous voulez partager
2. Cliquez sur l'icône **"Partager"** (📤) à côté du questionnaire
3. Une fenêtre de dialogue s'ouvre pour saisir les informations

### Étape 3 : Remplir les informations du modèle

#### Titre du modèle (obligatoire)
- **Exemples** : "Premier Bilan", "Suivi de Douleur", "Satisfaction Globale"
- **Conseil** : Utilisez un titre court et descriptif qui indique clairement l'usage

#### Description (optionnel mais recommandé)
- **Exemples** : 
  - "Questionnaire standard pour le premier rendez-vous avec un nouveau patient"
  - "Évaluation de l'évolution de la douleur après traitement"
- **Conseil** : Expliquez brièvement à quoi sert ce questionnaire

#### Catégorie (recommandé)
- **Options disponibles** :
  - `Premier Bilan`
  - `Suivi de Douleur`
  - `Satisfaction Globale`
  - `Post-opératoire`
  - `Bien-être`
  - `Rééducation`
- **Conseil** : Choisissez la catégorie la plus proche, ou créez-en une nouvelle si nécessaire

#### Tags (recommandé)
- **Format** : Séparez les tags par des virgules
- **Exemples** : `Post-opératoire, Bien-être, Rééducation`
- **Tags disponibles** :
  - `Post-opératoire`
  - `Bien-être`
  - `Rééducation`
  - `Douleur`
  - `Satisfaction`
  - `Bilan`
  - `Suivi`
- **Conseil** : Utilisez 2-4 tags pertinents pour faciliter la recherche

### Étape 4 : Confirmer la publication

1. Vérifiez toutes les informations saisies
2. Cliquez sur **"OK"** pour publier
3. Un message de confirmation s'affiche : *"Modèle partagé avec succès ! Il sera visible après modération par un administrateur."*

## ⏳ Modération

- Votre modèle est soumis à modération avant d'apparaître dans la bibliothèque communautaire
- Le statut `is_approved` est défini à `false` par défaut
- Un administrateur doit approuver votre modèle pour qu'il soit visible par tous

## 🔍 Vérifier que votre modèle est publié

### Option 1 : Via l'interface (après modération)

1. Allez dans **Dashboard > Questionnaire**
2. Cliquez sur l'onglet **"Modèles de la Communauté"**
3. Utilisez les filtres pour trouver votre modèle
4. Si approuvé, il apparaîtra dans la liste

### Option 2 : Via Supabase (pour les administrateurs)

1. Connectez-vous à Supabase
2. Allez dans **Table Editor > community_templates**
3. Recherchez votre modèle par titre ou `created_by`
4. Vérifiez le statut `is_approved`

## ✅ Bonnes pratiques pour publier un modèle

### ✅ À faire

- **Titres clairs** : Utilisez des noms descriptifs et agnostiques
- **Questions génériques** : Évitez les références trop spécifiques à votre pratique
- **Tags pertinents** : Utilisez les tags standards pour faciliter la recherche
- **Description utile** : Expliquez brièvement l'usage du questionnaire
- **Testez d'abord** : Assurez-vous que votre questionnaire fonctionne bien avant de le partager

### ❌ À éviter

- **Informations personnelles** : Ne partagez pas de données patient
- **Termes trop spécifiques** : Évitez les noms de pathologies très spécialisés
- **Questions incomplètes** : Vérifiez que toutes les questions sont bien formulées
- **Duplication** : Vérifiez qu'un modèle similaire n'existe pas déjà

## 🎨 Exemple complet

### Questionnaire à partager
- **Pathologie** : "Suivi post-opératoire"
- **Questions** :
  1. "Comment évaluez-vous votre amélioration depuis l'opération ?"
  2. "Avez-vous ressenti des douleurs ?"
  3. "Les exercices recommandés vous aident-ils ?"

### Informations de publication
- **Titre** : `Suivi Post-opératoire`
- **Description** : `Questionnaire pour évaluer la récupération après une intervention chirurgicale`
- **Catégorie** : `Post-opératoire`
- **Tags** : `Post-opératoire, Suivi, Douleur`

## 🔧 Dépannage

### "La table community_templates n'existe pas"
- **Solution** : Exécutez le script `supabase-community-templates.sql` dans Supabase

### Le bouton "Partager" ne fonctionne pas
- **Vérifiez** : Que vous êtes bien connecté
- **Vérifiez** : Que le questionnaire existe et vous appartient
- **Vérifiez** : Les logs de la console pour voir les erreurs

### Le modèle n'apparaît pas après publication
- **Raison** : Le modèle est en attente de modération
- **Solution** : Contactez un administrateur pour approuver le modèle
- **Vérification** : Vérifiez dans Supabase que `is_approved = false`

### Erreur lors de la saisie des tags
- **Format** : Séparez les tags par des virgules, sans espaces superflus
- **Exemple correct** : `Post-opératoire, Bien-être, Rééducation`
- **Exemple incorrect** : `Post-opératoire , Bien-être , Rééducation` (espaces avant les virgules)

## 📊 Après la publication

Une fois votre modèle approuvé et publié :

1. **Visibilité** : Il apparaîtra dans l'onglet "Modèles de la Communauté"
2. **Statistiques** : Vous pourrez voir le nombre d'utilisations et de votes
3. **Impact** : D'autres praticiens pourront importer et adapter votre modèle
4. **Reconnaissance** : Votre contribution aide toute la communauté !

## 🎯 Prochaines étapes

Après avoir publié votre premier modèle :

1. Partagez d'autres questionnaires utiles
2. Encouragez vos collègues à utiliser vos modèles
3. Votez pour les modèles de la communauté que vous trouvez utiles
4. Adaptez les modèles communautaires à vos besoins spécifiques

## 💡 Conseils avancés

### Créer des modèles populaires

- **Écoutez les besoins** : Identifiez les questionnaires les plus demandés
- **Améliorez les modèles existants** : Créez des variantes améliorées
- **Documentation** : Ajoutez des descriptions claires pour faciliter l'utilisation

### Collaborer avec la communauté

- **Feedback** : Encouragez les retours sur vos modèles
- **Amélioration continue** : Mettez à jour vos modèles basés sur les retours
- **Partage de bonnes pratiques** : Partagez vos meilleurs questionnaires

---

**Besoin d'aide ?** Consultez `GUIDE_MODELES_COMMUNAUTAIRES.md` pour plus d'informations sur l'utilisation de la bibliothèque communautaire.


