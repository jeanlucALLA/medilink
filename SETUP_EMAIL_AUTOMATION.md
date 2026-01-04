# Configuration de l'automatisation d'envoi d'emails

Ce guide vous explique comment configurer l'envoi automatique d'emails aux patients X jours après la création du questionnaire.

## 📋 Prérequis

1. Un compte Resend avec une clé API
2. Un projet Supabase avec les droits Edge Functions
3. Un domaine email vérifié dans Resend (optionnel mais recommandé)

## 🔧 Étape 1 : Configuration des secrets Supabase

Allez dans votre projet Supabase : **Settings > Edge Functions > Secrets**

Ajoutez les secrets suivants :

### 1. RESEND_API_KEY
- **Valeur** : Votre clé API Resend
- **Où l'obtenir** : https://resend.com/api-keys
- **Format** : `re_xxxxxxxxxxxxx`

### 2. SUPABASE_SERVICE_ROLE_KEY
- **Valeur** : Votre clé service_role Supabase
- **Où l'obtenir** : Settings > API > service_role key
- ⚠️ **Important** : Ne jamais exposer cette clé côté client

### 3. SERVICE_KEY (optionnel mais recommandé)
- **Valeur** : Une clé aléatoire sécurisée (générez-en une avec `openssl rand -hex 32`)
- **Usage** : Protège l'appel de votre Edge Function

### 4. NEXT_PUBLIC_APP_URL
- **Valeur** : L'URL de votre application
- **Exemples** :
  - Production : `https://votre-domaine.com`
  - Développement : `http://localhost:3001`

## 🚀 Étape 2 : Déploiement de l'Edge Function

### Option A : Via Supabase CLI (recommandé)

```bash
# Installer Supabase CLI si ce n'est pas déjà fait
npm install -g supabase

# Se connecter à votre projet
supabase login

# Lier votre projet local
supabase link --project-ref votre-projet-ref

# Déployer la fonction
supabase functions deploy send-delayed-email
```

### Option B : Via le Dashboard Supabase

1. Allez dans **Edge Functions** dans votre dashboard
2. Créez une nouvelle fonction nommée `send-delayed-email`
3. Copiez le contenu de `supabase/functions/send-delayed-email/index.ts`
4. Déployez la fonction

## ⏰ Étape 3 : Configuration du Cron Job

### Option 1 : GitHub Actions (Gratuit, recommandé)

1. Créez un repository GitHub (ou utilisez celui existant)
2. Ajoutez les secrets dans **Settings > Secrets and variables > Actions** :
   - `SUPABASE_URL` : `https://[votre-projet-ref].supabase.co`
   - `SERVICE_KEY` : Votre clé de service générée
3. Le fichier `.github/workflows/send-delayed-emails.yml` est déjà configuré
4. Le workflow s'exécutera automatiquement tous les jours à 08:00 UTC

### Option 2 : Service externe (cron-job.org, easycron.com)

1. Créez un compte sur un service de cron externe
2. Configurez une tâche HTTP :
   - **URL** : `https://[votre-projet-ref].supabase.co/functions/v1/send-delayed-email`
   - **Méthode** : POST
   - **Headers** :
     - `Authorization: Bearer [SERVICE_KEY]`
     - `Content-Type: application/json`
   - **Fréquence** : Quotidien à 08:00 UTC

### Option 3 : pg_cron (si disponible dans votre plan Supabase)

1. Exécutez le script `supabase-pgcron-setup.sql` dans l'éditeur SQL
2. Remplacez `[VOTRE_PROJET_REF]` et `[SERVICE_KEY]` par vos valeurs
3. Le cron job s'exécutera automatiquement

## 📧 Étape 4 : Configuration du domaine email Resend

1. Allez sur https://resend.com/domains
2. Ajoutez votre domaine (ex: `medilink.fr`)
3. Suivez les instructions pour vérifier votre domaine (DNS)
4. Une fois vérifié, modifiez la ligne dans `index.ts` :
   ```typescript
   from: 'Medi.Link <noreply@votre-domaine.fr>',
   ```

## 🧪 Test de la fonction

### Test manuel via curl

```bash
curl -X POST https://[votre-projet-ref].supabase.co/functions/v1/send-delayed-email \
  -H "Authorization: Bearer [SERVICE_KEY]" \
  -H "Content-Type: application/json" \
  -v
```

### Test depuis le Dashboard Supabase

1. Allez dans **Edge Functions > send-delayed-email**
2. Cliquez sur **Invoke**
3. Ajoutez le header : `Authorization: Bearer [SERVICE_KEY]`
4. Cliquez sur **Invoke Function**

## 📊 Vérification

1. Créez un questionnaire avec :
   - `status = 'programmé'`
   - `patient_email` renseigné
   - `send_after_days = 0` (pour tester immédiatement)
2. Appelez manuellement la fonction
3. Vérifiez que :
   - L'email est reçu
   - Le `status` est mis à jour en 'envoyé' dans la table

## 🔒 Sécurité

- ✅ La fonction vérifie la `SERVICE_KEY` avant d'exécuter
- ✅ Utilise `SUPABASE_SERVICE_ROLE_KEY` pour les opérations admin
- ✅ Les emails sont envoyés uniquement aux patients renseignés
- ✅ Le lien du questionnaire est unique et sécurisé

## 🐛 Dépannage

### Erreur "RESEND_API_KEY not configured"
→ Vérifiez que le secret est bien configuré dans Supabase

### Erreur "Unauthorized"
→ Vérifiez que la `SERVICE_KEY` est correcte dans votre appel

### Emails non reçus
→ Vérifiez :
1. Le domaine Resend est vérifié
2. L'adresse email du patient est valide
3. Les emails ne sont pas dans les spams
4. Les logs de la fonction pour voir les erreurs

### Cron job ne s'exécute pas
→ Vérifiez :
1. Le workflow GitHub Actions est activé
2. Le service externe est bien configuré
3. Les secrets sont correctement définis

## 📝 Notes importantes

- Les emails sont envoyés en UTC. Ajustez l'heure du cron selon votre fuseau horaire.
- Le lien du questionnaire expire après 2 heures (ou selon votre configuration).
- Les questionnaires avec `status = 'envoyé'` ne seront plus traités.



