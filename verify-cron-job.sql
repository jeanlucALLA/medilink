-- ============================================================
-- VÉRIFICATION ET CONFIGURATION DU CRON JOB
-- Exécutez ce script dans Supabase SQL Editor
-- https://supabase.com/dashboard/project/aqzdhyctnxxxaeuasmmn/sql/new
-- ============================================================

-- ============================================================
-- ÉTAPE 1 : Vérifier les extensions (pg_cron et pg_net)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- ÉTAPE 2 : Vérifier les cron jobs existants
-- ============================================================

SELECT jobid, jobname, schedule, active FROM cron.job;

-- ============================================================
-- ÉTAPE 3 : Voir les dernières exécutions du cron
-- ============================================================

SELECT 
    j.jobname,
    r.start_time,
    r.end_time,
    r.status,
    r.return_message
FROM cron.job_run_details r
JOIN cron.job j ON r.jobid = j.jobid
WHERE j.jobname LIKE '%questionnaire%' OR j.jobname LIKE '%email%'
ORDER BY r.start_time DESC
LIMIT 10;

-- ============================================================
-- ÉTAPE 4 : Recréer le cron job (si pas actif)
-- ============================================================

-- D'abord supprimer l'ancien s'il existe
SELECT cron.unschedule('send-scheduled-questionnaires');

-- Créer un nouveau job qui s'exécute toutes les heures à :00
-- IMPORTANT: Pas besoin d'Authorization header car pg_net appelle en interne
SELECT cron.schedule(
  'send-scheduled-questionnaires',
  '0 * * * *',  -- Toutes les heures à :00
  $$
  SELECT net.http_post(
    url := 'https://aqzdhyctnxxxaeuasmmn.supabase.co/functions/v1/send-scheduled-questionnaires',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- ============================================================
-- ÉTAPE 5 : Vérifier que le job est créé et actif
-- ============================================================

SELECT jobid, jobname, schedule, active FROM cron.job 
WHERE jobname = 'send-scheduled-questionnaires';

-- ============================================================
-- ÉTAPE 6 : DÉCLENCHER MAINTENANT l'envoi des emails en attente
-- ============================================================

SELECT net.http_post(
  url := 'https://aqzdhyctnxxxaeuasmmn.supabase.co/functions/v1/send-scheduled-questionnaires',
  headers := '{"Content-Type": "application/json"}'::jsonb,
  body := '{}'::jsonb
);

-- Le résultat sera un ID de requête HTTP. Vérifiez les logs dans :
-- https://supabase.com/dashboard/project/aqzdhyctnxxxaeuasmmn/functions/send-scheduled-questionnaires/logs
