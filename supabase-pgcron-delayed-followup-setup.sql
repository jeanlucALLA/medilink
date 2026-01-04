-- Script SQL pour configurer pg_cron et appeler automatiquement l'Edge Function send-delayed-followup
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase

-- Activer l'extension pg_cron si elle n'est pas déjà activée
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Créer une fonction pour appeler l'Edge Function send-delayed-followup
CREATE OR REPLACE FUNCTION call_send_delayed_followup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response text;
  supabase_url text;
  service_role_key text;
BEGIN
  -- Récupérer les valeurs depuis les variables d'environnement ou les settings
  -- Note: Vous devrez peut-être adapter selon votre configuration Supabase
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- Si les settings ne sont pas disponibles, utilisez les valeurs directement
  -- Remplacez YOUR_PROJECT_REF et YOUR_SERVICE_ROLE_KEY par vos valeurs réelles
  IF supabase_url IS NULL THEN
    supabase_url := 'https://YOUR_PROJECT_REF.supabase.co';
  END IF;
  
  IF service_role_key IS NULL THEN
    service_role_key := 'YOUR_SERVICE_ROLE_KEY';
  END IF;

  -- Appeler l'Edge Function via HTTP
  SELECT content INTO response
  FROM http((
    'POST',
    supabase_url || '/functions/v1/send-delayed-followup',
    ARRAY[
      http_header('Authorization', 'Bearer ' || service_role_key),
      http_header('Content-Type', 'application/json')
    ],
    'application/json',
    '{}'
  )::http_request);
  
  -- Logger le résultat (optionnel)
  RAISE NOTICE 'Edge Function send-delayed-followup appelée: %', response;
END;
$$;

-- Planifier l'exécution quotidienne à 08:00 UTC
SELECT cron.schedule(
  'send-delayed-followup-daily',
  '0 8 * * *', -- Tous les jours à 08:00 UTC
  $$SELECT call_send_delayed_followup();$$
);

-- Pour vérifier les tâches cron planifiées
-- SELECT * FROM cron.job;

-- Pour voir les détails d'exécution
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- Pour supprimer la tâche cron (si nécessaire)
-- SELECT cron.unschedule('send-delayed-followup-daily');



