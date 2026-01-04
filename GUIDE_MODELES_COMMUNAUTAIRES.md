# Guide : Bibliothèque de Modèles Communautaires

## 🌐 Fonctionnalité de Modèles Partagés

La bibliothèque de modèles communautaires permet de partager et d'importer des questionnaires entre praticiens.

## 🚀 Configuration initiale

### Étape 1 : Créer la table `community_templates` dans Supabase

1. Allez dans votre projet Supabase
2. Ouvrez l'éditeur SQL
3. Exécutez le script `supabase-community-templates.sql`
4. Vérifiez que la table a bien été créée avec toutes les colonnes

### Étape 2 : Insérer les 3 premiers modèles standards

Exécutez le script SQL suivant dans Supabase pour insérer les modèles de base :

```sql
-- Modèle 1 : Premier Bilan
INSERT INTO community_templates (
  title, 
  description, 
  pathologie, 
  questions, 
  tags, 
  category, 
  is_approved, 
  is_system_template
) VALUES (
  'Premier Bilan',
  'Questionnaire standard pour le premier rendez-vous avec un nouveau patient',
  'Premier Bilan',
  '[
    {"question": "Comment évaluez-vous votre état général depuis votre arrivée ?", "type": "scale", "label1": "Très mauvais", "label5": "Excellent"},
    {"question": "Avez-vous des questions ou des préoccupations particulières ?", "type": "text"},
    {"question": "Comment avez-vous entendu parler de notre cabinet ?", "type": "text"}
  ]'::jsonb,
  ARRAY['Premier Bilan', 'Bien-être'],
  'Premier Bilan',
  true,
  true
);

-- Modèle 2 : Suivi de Douleur
INSERT INTO community_templates (
  title, 
  description, 
  pathologie, 
  questions, 
  tags, 
  category, 
  is_approved, 
  is_system_template
) VALUES (
  'Suivi de Douleur',
  'Questionnaire pour évaluer l''évolution de la douleur après traitement',
  'Suivi de Douleur',
  '[
    {"question": "Sur une échelle de 1 à 5, comment évaluez-vous votre douleur actuelle ?", "type": "scale", "label1": "Aucune douleur", "label5": "Douleur intense"},
    {"question": "La douleur a-t-elle diminué depuis la dernière séance ?", "type": "yesno"},
    {"question": "Y a-t-il des moments où la douleur est plus intense ?", "type": "text"},
    {"question": "Les exercices ou conseils donnés vous aident-ils ?", "type": "scale", "label1": "Pas du tout", "label5": "Énormément"}
  ]'::jsonb,
  ARRAY['Douleur', 'Suivi', 'Post-opératoire'],
  'Suivi de Douleur',
  true,
  true
);

-- Modèle 3 : Satisfaction Globale
INSERT INTO community_templates (
  title, 
  description, 
  pathologie, 
  questions, 
  tags, 
  category, 
  is_approved, 
  is_system_template
) VALUES (
  'Satisfaction Globale',
  'Questionnaire général pour évaluer la satisfaction du patient',
  'Satisfaction Globale',
  '[
    {"question": "Comment évaluez-vous globalement votre expérience avec notre cabinet ?", "type": "scale", "label1": "Très insatisfait", "label5": "Très satisfait"},
    {"question": "Recommanderiez-vous notre cabinet à un proche ?", "type": "yesno"},
    {"question": "Quels sont les points forts de notre accompagnement ?", "type": "text"},
    {"question": "Avez-vous des suggestions pour améliorer nos services ?", "type": "text"}
  ]'::jsonb,
  ARRAY['Satisfaction', 'Bien-être'],
  'Satisfaction Globale',
  true,
  true
);
```

## 📖 Comment utiliser la bibliothèque

### Naviguer entre les onglets

1. Allez dans **Dashboard > Questionnaire**
2. Dans la section **"Bibliothèque de Modèles"**, vous avez deux onglets :
   - **Mes Modèles** : Vos questionnaires favoris
   - **Modèles de la Communauté** : Modèles partagés par tous les praticiens

### Importer un modèle communautaire

1. Cliquez sur l'onglet **"Modèles de la Communauté"**
2. Utilisez les filtres pour trouver un modèle :
   - **Catégorie** : Premier Bilan, Suivi de Douleur, Satisfaction Globale, etc.
   - **Tags** : Post-opératoire, Bien-être, Rééducation, etc.
3. Cliquez sur **"Importer et Adapter"** sur le modèle souhaité
4. Le formulaire de création se pré-remplit automatiquement avec :
   - La pathologie
   - Les questions
5. **Modifiez** les questions si nécessaire pour les adapter à votre pratique
6. Cliquez sur **"Créer le questionnaire"** pour générer le lien

### Partager un modèle avec la communauté

1. Dans la section **"Questionnaires créés"**
2. Cliquez sur l'icône **"Partager"** (📤) à côté d'un questionnaire
3. Remplissez les informations :
   - **Titre** : Nom du modèle (ex: "Premier Bilan", "Suivi de Douleur")
   - **Description** : Description optionnelle
   - **Catégorie** : Choisissez une catégorie existante ou créez-en une
   - **Tags** : Séparez les tags par des virgules (ex: "Post-opératoire, Bien-être")
4. Cliquez sur **"OK"**
5. Le modèle sera soumis à modération avant d'apparaître dans la bibliothèque communautaire

### Voter pour un modèle

1. Dans **"Modèles de la Communauté"**
2. Cliquez sur le bouton **👍** (pouce levé) sous chaque modèle
3. Le compteur de votes s'incrémente
4. Les modèles les plus votés apparaissent en haut de la liste

## 🎨 Design et Interface

- **Onglets** : Navigation claire entre "Mes Modèles" et "Modèles de la Communauté"
- **Filtres** : Catégories et tags pour trouver rapidement un modèle
- **Cartes** : Design cohérent avec le reste de l'application
- **Statistiques** : Nombre d'utilisations et votes affichés sur chaque modèle

## 🔄 Système de votes et utilisations

- **Utilisations** : Compteur automatique quand un modèle est importé
- **Votes** : Bouton 👍 pour voter manuellement
- **Tri** : Les modèles sont triés par nombre d'utilisations puis par votes

## 📊 Catégories et Tags disponibles

### Catégories
- Premier Bilan
- Suivi de Douleur
- Satisfaction Globale
- Post-opératoire
- Bien-être
- Rééducation

### Tags
- Post-opératoire
- Bien-être
- Rééducation
- Douleur
- Satisfaction

## ✅ Checklist de test

- [ ] J'ai exécuté le script SQL pour créer la table `community_templates`
- [ ] J'ai inséré les 3 modèles standards
- [ ] Je peux voir les modèles dans l'onglet "Modèles de la Communauté"
- [ ] Je peux filtrer par catégorie et tags
- [ ] J'ai importé un modèle et le formulaire s'est pré-rempli
- [ ] J'ai partagé un de mes questionnaires avec la communauté
- [ ] J'ai voté pour un modèle communautaire
- [ ] Le compteur d'utilisations s'incrémente lors de l'import

## 🐛 Dépannage

### "La table community_templates n'existe pas"
- **Solution** : Exécutez le script `supabase-community-templates.sql` dans Supabase

### Les modèles ne s'affichent pas
- **Vérifiez** : Que les modèles ont `is_approved = true` ou `is_system_template = true`
- **Vérifiez** : Que vous êtes bien connecté
- **Vérifiez** : Les logs de la console pour voir les erreurs

### Le bouton "Partager" ne fonctionne pas
- **Vérifiez** : Que vous êtes bien connecté
- **Vérifiez** : Que le questionnaire existe et vous appartient
- **Vérifiez** : Les logs de la console pour voir les erreurs

### Les filtres ne fonctionnent pas
- **Vérifiez** : Que les catégories et tags correspondent exactement à ceux dans la base
- **Vérifiez** : Que les modèles ont bien des catégories/tags renseignés

## 🎯 Prochaines étapes

Une fois la bibliothèque configurée :
- Importez les modèles standards pour tester
- Partagez vos propres modèles avec la communauté
- Utilisez les filtres pour trouver rapidement les modèles adaptés à vos besoins
- Votez pour les modèles les plus utiles


