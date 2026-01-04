# Configuration de l'Edge Function send-followup-email

## Prérequis

1. **Colonne `date_envoi_suivi` dans la table `questionnaires`**
   - Exécutez le script `supabase-questionnaires-update.sql` dans l'éditeur SQL de Supabase
   - Cette colonne stocke la date à laquelle l'email doit être envoyé (création + 14 jours)

2. **Secrets Supabase**
   - Configurez les secrets suivants dans votre projet Supabase :
     - `RESEND_API_KEY` : Votre clé API Resend
     - `SUPABASE_SERVICE_ROLE_KEY` : La clé service role de votre projet Supabase
     - `NEXT_PUBLIC_APP_URL` : L'URL de votre application (ex: https://medi-link.fr)

## Déploiement de l'Edge Function

### Option 1 : Via Supabase CLI (Recommandé)

```bash
# Installer Supabase CLI si ce n'est pas déjà fait
npm install -g supabase

# Se connecter à votre projet
supabase login

# Lier votre projet local à votre projet Supabase
supabase link --project-ref YOUR_PROJECT_REF

# Déployer la fonction
supabase functions deploy send-followup-email

# Configurer les secrets
supabase secrets set RESEND_API_KEY=your_resend_api_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
supabase secrets set NEXT_PUBLIC_APP_URL=https://medi-link.fr
```

### Option 2 : Via l'interface Supabase

1. Allez dans votre projet Supabase → Edge Functions
2. Cliquez sur "Create a new function"
3. Nommez-la `send-followup-email`
4. Copiez le contenu de `supabase/functions/send-followup-email/index.ts`
5. Configurez les secrets dans Settings → Edge Functions → Secrets

## Configuration de pg_cron

1. Exécutez le script `supabase-pgcron-followup-setup.sql` dans l'éditeur SQL de Supabase
2. Ce script :
   - Active l'extension `pg_cron`
   - Crée une fonction pour appeler l'Edge Function
   - Planifie l'exécution quotidienne à 08:00 UTC

### Vérifier les tâches cron

```sql
SELECT * FROM cron.job;
```

### Modifier l'heure d'exécution

```sql
-- Changer pour 09:00 UTC
SELECT cron.unschedule('send-followup-emails-daily');
SELECT cron.schedule(
  'send-followup-emails-daily',
  '0 9 * * *',
  $$SELECT call_send_followup_email();$$
);
```

## Test de l'Edge Function

### Test manuel via l'interface Supabase

1. Allez dans Edge Functions → `send-followup-email`
2. Cliquez sur "Invoke function"
3. Le body peut être vide : `{}`
4. Vérifiez les logs pour voir les résultats

### Test via curl

```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-followup-email' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

## Structure de la table questionnaires

La table doit contenir :
- `id` : UUID (clé primaire)
- `user_id` : UUID (référence au praticien)
- `pathologie` : TEXT (type de suivi)
- `patient_email` : TEXT (email du patient)
- `status` : TEXT (valeurs : 'Programmé', 'Envoyé')
- `date_envoi_suivi` : TIMESTAMP WITH TIME ZONE (date d'envoi calculée)
- `created_at` : TIMESTAMP WITH TIME ZONE

## Logs et Monitoring

Les logs de l'Edge Function sont disponibles dans :
- Supabase Dashboard → Edge Functions → `send-followup-email` → Logs

## Dépannage

### L'Edge Function ne s'exécute pas automatiquement

1. Vérifiez que pg_cron est activé : `SELECT * FROM cron.job;`
2. Vérifiez les logs de cron : `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`
3. Testez manuellement l'Edge Function pour vérifier qu'elle fonctionne

### Les emails ne sont pas envoyés

1. Vérifiez que `RESEND_API_KEY` est bien configuré
2. Vérifiez que le domaine est vérifié dans Resend
3. Vérifiez les logs de l'Edge Function pour les erreurs Resend

### Les questionnaires ne sont pas trouvés

1. Vérifiez que `date_envoi_suivi` est bien rempli lors de la création
2. Vérifiez que le statut est bien 'Programmé'
3. Vérifiez que `patient_email` n'est pas NULL



