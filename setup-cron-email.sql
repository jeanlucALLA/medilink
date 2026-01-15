-- Script pour configurer l'envoi automatique des questionnaires
-- Exécutez ce script dans Supabase SQL Editor

-- ============================================================
-- ÉTAPE 1 : Activer les extensions nécessaires
-- ============================================================

-- Activer pg_cron pour les tâches planifiées
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Activer pg_net pour les requêtes HTTP
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- ÉTAPE 2 : Vérifier les jobs existants
-- ============================================================

-- Voir tous les cron jobs actuels (exécutez d'abord pour vérifier)
SELECT jobid, schedule, command, jobname FROM cron.job;

-- ============================================================
-- ÉTAPE 3 : Créer le cron job pour l'envoi automatique
-- ============================================================

-- Supprimer l'ancien job s'il existe
SELECT cron.unschedule('send-scheduled-questionnaires');

-- Créer un nouveau job qui s'exécute toutes les heures
SELECT cron.schedule(
  'send-scheduled-questionnaires',
  '0 * * * *',  -- Toutes les heures à :00
  $$
  SELECT net.http_post(
    url := 'https://aqzdhyctnxxxaeuasmmn.supabase.co/functions/v1/send-scheduled-questionnaires',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxemRoeWN0bnh4eGFldWFzbW1uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTI0ODM2MSwiZXhwIjoyMDUwODI0MzYxfQ.service_role_key_here"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- ============================================================
-- ÉTAPE 4 : Vérifier que le job est créé
-- ============================================================

SELECT jobid, jobname, schedule, active FROM cron.job 
WHERE jobname = 'send-scheduled-questionnaires';

-- ============================================================
-- ÉTAPE 5 : Tester manuellement l'Edge Function
-- ============================================================

-- Pour tester MAINTENANT l'envoi des questionnaires :
SELECT net.http_post(
  url := 'https://aqzdhyctnxxxaeuasmmn.supabase.co/functions/v1/send-scheduled-questionnaires',
  headers := '{"Content-Type": "application/json"}'::jsonb,
  body := '{}'::jsonb
);
