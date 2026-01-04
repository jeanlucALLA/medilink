-- Script SQL pour activer pg_cron et configurer le cron job
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase

-- 1. Activer l'extension pg_cron (nécessite les droits superuser)
-- Note: Cette extension doit être activée par un administrateur Supabase
-- Si vous êtes sur Supabase Cloud, contactez le support ou utilisez le dashboard

-- Vérifier si pg_cron est disponible
SELECT * FROM pg_available_extensions WHERE name = 'pg_cron';

-- Activer l'extension (nécessite les droits superuser)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Alternative : Utiliser Supabase Edge Functions avec un cron externe
-- Si pg_cron n'est pas disponible, vous pouvez utiliser :
-- - GitHub Actions avec un workflow cron
-- - Un service externe comme cron-job.org
-- - Un VPS avec un cron système

-- 3. Configuration du cron job (si pg_cron est activé)
-- Remplacez [VOTRE_PROJET_REF] par votre référence de projet Supabase
-- Remplacez [SERVICE_KEY] par votre clé de service générée

-- Exemple de cron job qui appelle l'Edge Function tous les jours à 08:00 UTC
/*
SELECT cron.schedule(
  'send-delayed-emails-daily',
  '0 8 * * *', -- Tous les jours à 08:00 UTC
  $$
  SELECT
    net.http_post(
      url := 'https://[VOTRE_PROJET_REF].supabase.co/functions/v1/send-delayed-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer [SERVICE_KEY]'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
*/

-- 4. Vérifier les tâches cron planifiées
-- SELECT * FROM cron.job;

-- 5. Supprimer une tâche cron (si nécessaire)
-- SELECT cron.unschedule('send-delayed-emails-daily');

-- IMPORTANT : Si pg_cron n'est pas disponible dans votre plan Supabase,
-- utilisez une des alternatives suivantes :

-- ALTERNATIVE 1 : GitHub Actions (gratuit)
-- Créez un fichier .github/workflows/send-emails.yml avec :
/*
name: Send Delayed Emails

on:
  schedule:
    - cron: '0 8 * * *' # Tous les jours à 08:00 UTC
  workflow_dispatch: # Permet de déclencher manuellement

jobs:
  send-emails:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase Edge Function
        run: |
          curl -X POST https://[VOTRE_PROJET_REF].supabase.co/functions/v1/send-delayed-email \
            -H "Authorization: Bearer ${{ secrets.SERVICE_KEY }}" \
            -H "Content-Type: application/json"
*/

-- ALTERNATIVE 2 : Service externe (cron-job.org, easycron.com, etc.)
-- Configurez une tâche HTTP qui appelle votre Edge Function quotidiennement

-- ALTERNATIVE 3 : VPS avec cron système
-- Ajoutez dans votre crontab :
-- 0 8 * * * curl -X POST https://[VOTRE_PROJET_REF].supabase.co/functions/v1/send-delayed-email -H "Authorization: Bearer [SERVICE_KEY]" -H "Content-Type: application/json"



