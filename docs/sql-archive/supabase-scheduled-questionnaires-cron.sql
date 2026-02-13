-- Script SQL pour configurer le cron job d'envoi automatique des questionnaires
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Activer l'extension pg_cron (si ce n'est pas déjà fait)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Créer le cron job pour appeler la fonction quotidiennement à 8h00 UTC
-- Remplacez [VOTRE_PROJET] par l'URL de votre projet Supabase
-- Exemple : https://abcdefghijklmnop.supabase.co

SELECT cron.schedule(
  'send-scheduled-questionnaires-daily',
  '0 8 * * *', -- Tous les jours à 8h00 UTC (ajustez selon votre fuseau horaire)
  $$
  SELECT
    net.http_post(
      url := 'https://[VOTRE_PROJET].supabase.co/functions/v1/send-scheduled-questionnaires',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);

-- 3. Vérifier que le cron job est créé
SELECT * FROM cron.job WHERE jobname = 'send-scheduled-questionnaires-daily';

-- 4. Pour supprimer le cron job (si nécessaire)
-- SELECT cron.unschedule('send-scheduled-questionnaires-daily');

-- 5. Pour voir l'historique des exécutions
-- SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'send-scheduled-questionnaires-daily');



