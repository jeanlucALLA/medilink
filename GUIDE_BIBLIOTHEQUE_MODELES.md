# Guide : Bibliothèque de Modèles de Questionnaires

## 📚 Fonctionnalité de Bibliothèque de Modèles

La bibliothèque de modèles permet de sauvegarder vos questionnaires les plus fréquents comme favoris pour un accès rapide.

## 🚀 Configuration initiale

### Étape 1 : Créer la colonne `is_favorite` dans Supabase

1. Allez dans votre projet Supabase
2. Ouvrez l'éditeur SQL
3. Exécutez le script `supabase-questionnaires-add-favorite.sql` :

```sql
-- Ajouter la colonne is_favorite si elle n'existe pas
ALTER TABLE questionnaires 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS questionnaires_is_favorite_idx 
ON questionnaires(user_id, is_favorite) 
WHERE is_favorite = TRUE;
```

4. Vérifiez que la colonne a bien été créée dans la table `questionnaires`

## 📖 Comment utiliser la bibliothèque

### Marquer un questionnaire comme favori

#### Méthode 1 : Depuis la liste des questionnaires

1. Allez dans **Dashboard > Questionnaire**
2. Descendez jusqu'à la section **"Questionnaires créés"**
3. Pour chaque questionnaire, cliquez sur l'icône **étoile** (⭐) à gauche du titre
   - Étoile vide (☆) = Pas favori
   - Étoile pleine (⭐) = Favori
4. Le questionnaire apparaît automatiquement dans la section **"Mes Modèles Favoris"** en haut de la page

#### Méthode 2 : Depuis la bibliothèque

1. Si un modèle est déjà dans la bibliothèque, cliquez sur l'étoile dans la carte pour le retirer des favoris

### Utiliser un modèle favori

1. Dans la section **"Mes Modèles Favoris"** (en haut de la page)
2. Cliquez sur **"Utiliser ce modèle"** sur la carte du modèle souhaité
3. Le formulaire de création se pré-remplit automatiquement avec :
   - La pathologie
   - Les questions
4. La page défile automatiquement jusqu'au formulaire
5. Vous pouvez modifier les questions si nécessaire
6. Cliquez sur **"Créer le questionnaire"** pour générer le lien

### Pré-remplir l'envoi instantané

1. Dans **"Envoi Instantané"**, sélectionnez une pathologie depuis le menu déroulant
2. Les pathologies des modèles favoris apparaissent automatiquement dans la liste
3. Saisissez l'email du patient
4. Cliquez sur **"Envoyer maintenant"**

## 🎨 Design et Interface

- **Section "Mes Modèles Favoris"** :
  - Affichée uniquement si au moins un modèle est marqué comme favori
  - Cartes en grille responsive (1 colonne mobile, 2 tablette, 3 desktop)
  - Icône étoile jaune en haut à gauche
  - Nombre de questions affiché sous le titre

- **Bouton étoile dans la liste** :
  - Étoile vide (gris) = Pas favori
  - Étoile pleine (jaune) = Favori
  - Mise à jour instantanée sans rechargement

## 🔄 Mise à jour dynamique

- La bibliothèque se met à jour automatiquement quand :
  - Vous marquez un questionnaire comme favori
  - Vous retirez un questionnaire des favoris
  - Vous créez un nouveau questionnaire marqué comme favori

- Aucun rechargement de page nécessaire

## 📊 Limites

- Maximum **6 modèles favoris** affichés dans la bibliothèque
- Les modèles sont triés par date de création (plus récents en premier)
- Si vous avez plus de 6 favoris, seuls les 6 plus récents sont affichés

## ✅ Checklist de test

- [ ] J'ai exécuté le script SQL pour créer la colonne `is_favorite`
- [ ] J'ai créé au moins un questionnaire
- [ ] J'ai marqué un questionnaire comme favori depuis la liste
- [ ] Le questionnaire apparaît dans "Mes Modèles Favoris"
- [ ] J'ai cliqué sur "Utiliser ce modèle" et le formulaire s'est pré-rempli
- [ ] J'ai pu modifier et créer un nouveau questionnaire à partir du modèle
- [ ] J'ai retiré un modèle des favoris et il a disparu de la bibliothèque

## 🐛 Dépannage

### "La fonctionnalité favoris nécessite la création de la colonne is_favorite"
- **Solution** : Exécutez le script `supabase-questionnaires-add-favorite.sql` dans Supabase

### La bibliothèque ne s'affiche pas
- **Vérifiez** : Que vous avez au moins un questionnaire marqué comme favori
- **Vérifiez** : Que la colonne `is_favorite` existe dans Supabase

### Le bouton étoile ne fonctionne pas
- **Vérifiez** : Que vous êtes bien connecté
- **Vérifiez** : Les logs de la console pour voir les erreurs
- **Vérifiez** : Que la colonne `is_favorite` existe dans Supabase

### Le pré-remplissage ne fonctionne pas
- **Vérifiez** : Que le modèle a bien des questions
- **Vérifiez** : Que le formulaire est visible (défilement automatique)

## 🎯 Prochaines étapes

Une fois la bibliothèque configurée :
- Marquez vos 3-4 questionnaires les plus utilisés comme favoris
- Utilisez-les pour créer rapidement de nouveaux questionnaires
- Personnalisez les questions avant de créer le questionnaire final


