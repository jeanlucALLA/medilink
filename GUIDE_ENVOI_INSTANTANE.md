# Guide : Envoi Instantané de Questionnaire

## 📧 Fonctionnalité d'Envoi Instantané

La fonctionnalité d'envoi instantané permet d'envoyer un questionnaire à un patient immédiatement, sans programmation.

## 🚀 Comment utiliser l'envoi instantané

### Étape 1 : Créer et sauvegarder un questionnaire

1. Allez dans **Dashboard > Questionnaire**
2. Créez un nouveau questionnaire :
   - Saisissez une pathologie (ex: "Suivi post-opératoire", "Kinésithérapie", etc.)
   - Ajoutez vos questions
   - Cliquez sur **"Générer le lien"** pour créer le questionnaire
3. Le questionnaire est automatiquement sauvegardé dans Supabase avec sa pathologie
4. La pathologie devient disponible dans le menu déroulant "Envoi Instantané"

### Étape 2 : Envoyer instantanément

1. Dans la section **"Envoi Instantané"** (en haut de la page)
2. Sélectionnez une pathologie dans le menu déroulant
3. Saisissez l'email du patient
4. Cliquez sur **"Envoyer maintenant"** (bouton bleu avec icône d'avion)

### Étape 3 : Vérifier l'envoi

- ✅ Un message de succès s'affiche : "Questionnaire envoyé avec succès à [email]"
- 📧 L'email est envoyé immédiatement via Resend
- 📊 Le questionnaire apparaît dans le **Tableau de bord** dans la section "Suivi des envois automatiques"

## 🧪 Tester sur votre propre email

### Option 1 : Via l'envoi instantané

1. Créez et sauvegardez un questionnaire (voir Étape 1)
2. Dans "Envoi Instantané", sélectionnez la pathologie
3. Entrez **votre propre adresse email**
4. Cliquez sur "Envoyer maintenant"
5. Vérifiez votre boîte de réception (et le dossier spam si nécessaire)

### Option 2 : Via les paramètres (test du template)

1. Allez dans **Dashboard > Paramètres**
2. Dans la section **"Test d'Email de Suivi"**
3. Entrez votre email
4. Cliquez sur **"Envoyer un email de test"**
5. Vérifiez votre boîte de réception

## 📋 Ce qui se passe lors de l'envoi

1. **Création du questionnaire** : Le questionnaire est créé dans Supabase avec le statut "envoyé"
2. **Envoi de l'email** : L'email professionnel est envoyé via Resend avec :
   - Le nom du patient (extrait de l'email)
   - Le nom du cabinet
   - La date de séance (date actuelle)
   - Le lien vers le questionnaire
3. **Mise à jour du dashboard** : Le questionnaire apparaît dans :
   - La liste des questionnaires récents
   - Le suivi des envois automatiques
   - Les statistiques (compteur "Questionnaires envoyés")

## ⚙️ Configuration requise

### Variables d'environnement

Assurez-vous que votre fichier `.env.local` contient :

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=Medi.Link <noreply@medilink.app>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Vérification de la configuration

1. Vérifiez que `RESEND_API_KEY` est bien configurée
2. Testez l'envoi via les paramètres (voir Option 2 ci-dessus)
3. Si une erreur apparaît, consultez `RESEND_SETUP_GUIDE.md`

## 🎨 Design et Interface

- **Bloc "Envoi Instantané"** : Carte blanche avec bordure légère, icône d'avion bleue
- **Menu déroulant** : Liste des pathologies sauvegardées
- **Champ email** : Validation automatique du format
- **Bouton "Envoyer maintenant"** : Bleu (#3b82f6) avec icône d'avion
- **Notifications** : Messages de succès (vert) ou d'erreur (rouge)

## 🔍 Dépannage

### "Aucune pathologie sauvegardée"
- **Solution** : Créez et sauvegardez d'abord un questionnaire (voir Étape 1)

### "Erreur lors de l'envoi de l'email"
- **Vérifiez** : Que `RESEND_API_KEY` est bien configurée dans `.env.local`
- **Vérifiez** : Que votre clé API Resend est valide
- **Consultez** : Les logs de la console pour plus de détails

### L'email n'arrive pas
- **Vérifiez** : Votre dossier spam
- **Vérifiez** : Les logs dans le dashboard Resend
- **Vérifiez** : Que l'adresse email est correcte

### Le questionnaire n'apparaît pas dans le dashboard
- **Attendez** : Quelques secondes pour le rafraîchissement automatique
- **Rechargez** : La page du dashboard
- **Vérifiez** : Que le questionnaire a bien été créé (statut "envoyé" dans Supabase)

## 📊 Suivi dans le Dashboard

Une fois envoyé, le questionnaire apparaît dans :

1. **Tableau de bord principal** :
   - Section "Questionnaires récents"
   - Statut : "envoyé" (badge vert)

2. **Suivi des envois automatiques** :
   - Liste des questionnaires avec email
   - Date d'envoi : Date actuelle
   - Statut : "envoyé"

3. **Statistiques** :
   - Compteur "Questionnaires envoyés" incrémenté automatiquement

## ✅ Checklist de test

- [ ] J'ai créé et sauvegardé au moins un questionnaire
- [ ] J'ai configuré ma clé API Resend dans `.env.local`
- [ ] J'ai testé l'envoi sur mon propre email
- [ ] J'ai reçu l'email dans ma boîte de réception
- [ ] Le questionnaire apparaît dans le dashboard
- [ ] Le compteur de statistiques est mis à jour

## 🎯 Prochaines étapes

Une fois l'envoi instantané testé et validé, vous pouvez :
- Envoyer des questionnaires à vos patients en temps réel
- Suivre les retours dans le Centre de Résolution
- Analyser les statistiques dans le Dashboard

