# Edge Function : Envoi automatique avec purge RGPD

Cette Edge Function envoie automatiquement les questionnaires programmés et **purge immédiatement les données nominatives** après envoi réussi, conformément au RGPD.

## 🔒 Conformité RGPD

**Important** : Dès que l'email est envoyé avec succès (status 200 de Resend), la fonction :
1. Change le statut à `'sent'`
2. **Remplace `patient_email` par `'PURGED'`** pour supprimer toute donnée nominative
3. Enregistre la date d'envoi dans `sent_at`

⚠️ En cas d'erreur d'envoi, l'email n'est **PAS** purgé pour permettre une nouvelle tentative.

## 📋 Configuration

### 1. Variables d'environnement

Dans Supabase Dashboard > Edge Functions > Settings, ajoutez :

```
RESEND_API_KEY=re_xxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
```

### 2. Déploiement

```bash
supabase functions deploy send-delayed-emails
```

### 3. Configuration du Cron Job

Exécutez ce SQL dans l'éditeur SQL de Supabase :

```sql
-- Activer l'extension pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Créer le cron job (tous les jours à 8h00 UTC)
SELECT cron.schedule(
  'send-delayed-emails-daily',
  '0 8 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://[VOTRE_PROJET].supabase.co/functions/v1/send-delayed-emails',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

## 🔍 Logique de fonctionnement

1. Récupère les questionnaires avec :
   - `status = 'pending'`
   - `patient_email IS NOT NULL`
   - `send_after_days IS NOT NULL`

2. Filtre ceux dont `created_at + send_after_days <= aujourd'hui`

3. Pour chaque questionnaire :
   - Envoie l'email via Resend
   - Si succès (200) : **Purge immédiate** de `patient_email` → `'PURGED'`
   - Met à jour `status = 'sent'` et `sent_at = NOW()`
   - Si erreur : conserve l'email pour nouvelle tentative

## 🧪 Test manuel

```bash
curl -X POST https://[VOTRE_PROJET].supabase.co/functions/v1/send-delayed-emails \
  -H "Authorization: Bearer [VOTRE_SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json"
```

## 📊 Structure de la table

La table `questionnaires` doit contenir :
- `status` : 'pending' → 'sent'
- `patient_email` : email → 'PURGED' (après envoi)
- `sent_at` : TIMESTAMP (date d'envoi)
- `send_after_days` : INTEGER (délai en jours)
- `created_at` : TIMESTAMP (date de création)



