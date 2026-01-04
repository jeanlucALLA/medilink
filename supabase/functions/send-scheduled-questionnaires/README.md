# Edge Function : Envoi automatique des questionnaires programmés

Cette Edge Function scanne quotidiennement les questionnaires dont la date d'envoi est arrivée et envoie les emails via Resend.

## Configuration

### 1. Variables d'environnement

Dans Supabase Dashboard > Edge Functions > Settings, ajoutez :

```
RESEND_API_KEY=re_xxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
```

### 2. Déploiement

```bash
supabase functions deploy send-scheduled-questionnaires
```

### 3. Configuration du Cron Job

Exécutez ce SQL dans l'éditeur SQL de Supabase :

```sql
-- Activer l'extension pg_cron si ce n'est pas déjà fait
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Créer le cron job pour appeler la fonction quotidiennement à 8h00
SELECT cron.schedule(
  'send-scheduled-questionnaires',
  '0 8 * * *', -- Tous les jours à 8h00 UTC
  $$
  SELECT
    net.http_post(
      url := 'https://[VOTRE_PROJET].supabase.co/functions/v1/send-scheduled-questionnaires',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

**Note** : Remplacez `[VOTRE_PROJET]` par l'URL de votre projet Supabase.

### 4. Vérification

Pour tester manuellement la fonction :

```bash
curl -X POST https://[VOTRE_PROJET].supabase.co/functions/v1/send-scheduled-questionnaires \
  -H "Authorization: Bearer [VOTRE_SERVICE_ROLE_KEY]" \
  -H "Content-Type: application/json"
```

## Logique de fonctionnement

1. La fonction récupère tous les questionnaires avec :
   - `status = 'programmé'`
   - `patient_email IS NOT NULL`
   - `send_after_days IS NOT NULL`

2. Pour chaque questionnaire, elle calcule :
   - Date d'envoi = `created_at + send_after_days`
   - Si cette date est <= aujourd'hui, l'email est envoyé

3. Après l'envoi réussi :
   - Le statut est mis à jour à `'envoyé'`
   - Un log est créé pour le suivi

## Structure de la table `questionnaires`

La fonction attend les colonnes suivantes :
- `id` (UUID)
- `user_id` (UUID)
- `pathologie` (TEXT)
- `patient_email` (TEXT, nullable)
- `status` (TEXT) : 'programmé' ou 'envoyé'
- `send_after_days` (INTEGER, nullable) : nombre de jours après création
- `created_at` (TIMESTAMP)



