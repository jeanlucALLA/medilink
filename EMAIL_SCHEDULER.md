# Système d'Envoi d'Email Différé

## Architecture

### Stockage en Mémoire
- **Map JavaScript** : `scheduledEmailsMap` stocke les emails programmés
- **Chiffrement AES-256-CBC** : Email et lien chiffrés avant stockage
- **Auto-suppression** : Tâche supprimée après envoi

### Cycle de Vie

```
1. Praticien programme l'envoi
   ↓
2. Email et lien chiffrés avec AES-256-CBC
   ↓
3. Stockage en Map avec scheduledFor (timestamp)
   ↓
4. setTimeout programmé pour la date d'envoi
   ↓
5. À l'heure programmée :
   - Déchiffrement des données
   - Envoi de l'email
   - Suppression de la tâche
```

## Sécurité

### Chiffrement
- **Algorithme** : AES-256-CBC
- **IV unique** : Chaque donnée a son propre Initialization Vector
- **Clé** : Variable d'environnement `EMAIL_ENCRYPTION_KEY` (32 bytes en hex)

### Non-Persistance
- ✅ Stockage uniquement en mémoire (Map)
- ✅ Suppression automatique après envoi
- ✅ Annulation si questionnaire supprimé avant envoi
- ❌ Aucune base de données
- ❌ Aucun fichier écrit

## Configuration

### Variables d'Environnement

Ajoutez dans `.env.local` :

```env
# Clé de chiffrement (64 caractères hex = 32 bytes)
EMAIL_ENCRYPTION_KEY=votre_cle_hexadecimale_de_64_caracteres_ici

# Optionnel : Pour utiliser Resend en production
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@votredomaine.com
```

### Générer une Clé de Chiffrement

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Intégration Email

### Mode Développement (Simulation)
Par défaut, les emails sont loggés dans la console.

### Mode Production (Resend)
1. Créer un compte sur [Resend.com](https://resend.com)
2. Obtenir une clé API
3. Ajouter `RESEND_API_KEY` dans `.env.local`
4. Configurer `EMAIL_FROM` avec votre domaine vérifié

### Alternative : Nodemailer
Pour utiliser Nodemailer au lieu de Resend, modifiez `lib/email-scheduler.ts` :

```typescript
// Remplacer la fonction sendEmail
async function sendEmail(email: string, link: string, questionnaireId: string): Promise<void> {
  const nodemailer = await import('nodemailer')
  const transporter = nodemailer.createTransport({
    // Configuration SMTP
  })
  
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Questionnaire médical',
    html: `...`,
  })
}
```

## Fonctionnalités

### Programmation
- Date sélectionnable (par défaut J+14)
- Validation : date doit être dans le futur
- Chiffrement automatique avant stockage

### Annulation
- Suppression manuelle du questionnaire → Annulation automatique
- Suppression de la tâche programmée
- Nettoyage immédiat

### Notification
- Confirmation avec date programmée
- Message : "Envoi programmé pour le [Date]. Aucune donnée ne sera conservée après l'envoi."

## Limitations

### ⚠️ Redémarrage Serveur
Si le serveur redémarre, les tâches programmées sont perdues.

**Mitigation :**
- Utiliser un service externe (Resend scheduled emails, Upstash Workflow)
- Implémenter une persistance temporaire (Redis avec TTL)

### ⚠️ setTimeout Limite
JavaScript setTimeout a une limite de ~2^31-1 ms (~24 jours).

**Pour envois > 24 jours :**
- Utiliser un service externe
- Implémenter un système de vérification périodique

## Test

1. Créer un questionnaire
2. Remplir l'email et sélectionner une date (J+1 pour test rapide)
3. Programmer l'envoi
4. Vérifier la console (mode dev) ou la boîte email (mode prod)
5. Vérifier que la tâche est supprimée après envoi

---

**Version :** 1.0  
**Conforme :** RGPD, HDS, Zero-Data



