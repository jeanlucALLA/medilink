-- Script SQL pour configurer pg_cron et appeler automatiquement l'Edge Function send-followup-email
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase

-- Activer l'extension pg_cron si elle n'est pas déjà activée
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Créer une fonction pour appeler l'Edge Function
CREATE OR REPLACE FUNCTION call_send_followup_email()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response text;
BEGIN
  -- Appeler l'Edge Function via HTTP
  SELECT content INTO response
  FROM http((
    'POST',
    current_setting('app.settings.supabase_url', true) || '/functions/v1/send-followup-email',
    ARRAY[
      http_header('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)),
      http_header('Content-Type', 'application/json')
    ],
    'application/json',
    '{}'
  )::http_request);
  
  -- Logger le résultat (optionnel)
  RAISE NOTICE 'Edge Function appelée: %', response;
END;
$$;

-- Planifier l'exécution quotidienne à 08:00 UTC
-- Note: Vous devrez peut-être ajuster l'URL et la clé selon votre configuration Supabase
SELECT cron.schedule(
  'send-followup-emails-daily',
  '0 8 * * *', -- Tous les jours à 08:00 UTC
  $$SELECT call_send_followup_email();$$
);

-- Alternative: Si vous préférez utiliser directement l'URL HTTP dans le cron
-- Remplacez YOUR_SUPABASE_URL et YOUR_SERVICE_ROLE_KEY par vos valeurs réelles
/*
SELECT cron.schedule(
  'send-followup-emails-daily',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'YOUR_SUPABASE_URL/functions/v1/send-followup-email',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
*/

-- Pour vérifier les tâches cron planifiées
-- SELECT * FROM cron.job;

-- Pour supprimer la tâche cron (si nécessaire)
-- SELECT cron.unschedule('send-followup-emails-daily');



