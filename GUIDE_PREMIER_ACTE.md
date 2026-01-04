# Guide : Créer votre premier acte médical

## 📋 Prérequis

1. **Créer la table dans Supabase** :
   - Exécutez le script SQL `supabase-medical-acts-setup.sql` dans l'éditeur SQL de votre projet Supabase
   - Cela créera la table `medical_acts` avec les politiques RLS appropriées

2. **Vérifier votre connexion** :
   - Assurez-vous d'être connecté à votre compte MediLink
   - Votre profil doit être complété (nom, spécialité, etc.)

## 🚀 Étapes pour créer votre premier acte

### Étape 1 : Accéder au formulaire

1. Connectez-vous à votre Dashboard MediLink
2. Vous verrez une **Checklist de Bienvenue** en haut de la page avec l'étape "Créer votre premier acte"
3. Cliquez sur le bouton **"Ajouter un acte"** (soit dans la checklist, soit dans l'en-tête du dashboard)

### Étape 2 : Remplir le formulaire

Le formulaire s'ouvre dans une modal avec 3 champs :

1. **Nom de l'acte** (requis) :
   - Exemples : "Consultation", "Bilan", "Soin", "Contrôle", etc.
   - Vous pouvez saisir n'importe quel nom d'acte médical

2. **Nom du patient** (optionnel) :
   - Exemple : "Jean Dupont"
   - Ce champ peut être laissé vide si vous ne souhaitez pas associer de patient

3. **Date** (requis) :
   - La date du jour est pré-remplie par défaut
   - Vous pouvez la modifier en cliquant sur le champ date

### Étape 3 : Enregistrer

1. Cliquez sur le bouton **"Enregistrer"**
2. Un message de succès apparaîtra : "Acte médical créé avec succès !"
3. La modal se fermera automatiquement après 1.5 secondes

### Étape 4 : Vérification

Après l'enregistrement :

1. ✅ La **Checklist de Bienvenue** se met à jour automatiquement
2. ✅ L'étape "Créer votre premier acte" est marquée comme terminée (icône verte ✓)
3. ✅ Les graphiques et statistiques se mettent à jour automatiquement
4. ✅ La checklist disparaît une fois le premier acte créé

## 💡 Exemples d'actes médicaux

Voici quelques exemples d'actes que vous pouvez créer :

- **Consultation** (sans patient spécifique)
- **Bilan Podologique Initial** (avec patient : "Marie Martin")
- **Soin de Pédicurie** (date : aujourd'hui)
- **Contrôle Post-Opératoire** (avec patient : "Jean Dupont")
- **Consultation de Suivi** (date : hier)

## 🔧 Dépannage

### Le bouton "Ajouter un acte" ne fonctionne pas

- Vérifiez que vous êtes bien connecté
- Actualisez la page (F5)
- Vérifiez la console du navigateur pour les erreurs

### Erreur lors de l'enregistrement

- Vérifiez que la table `medical_acts` existe dans Supabase
- Vérifiez que les politiques RLS sont bien configurées
- Vérifiez que le champ "Nom de l'acte" est rempli (requis)

### La checklist ne se met pas à jour

- Attendez quelques secondes (rafraîchissement automatique toutes les 10 secondes)
- Cliquez sur "Actualiser" si disponible
- Vérifiez que l'acte a bien été créé dans Supabase

## 📊 Où voir vos actes médicaux ?

Une fois créés, vos actes médicaux sont :
- Enregistrés dans la table `medical_acts` de Supabase
- Accessibles via les graphiques et statistiques du dashboard
- Utilisables pour générer des rapports et analyses

---

**Besoin d'aide ?** Contactez le support MediLink ou consultez la documentation.



