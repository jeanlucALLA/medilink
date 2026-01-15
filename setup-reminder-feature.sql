-- Script pour ajouter la fonctionnalité de relance automatique
-- Exécutez ce script dans Supabase SQL Editor

-- ============================================================
-- ÉTAPE 1 : Ajouter la colonne pour tracker les relances
-- ============================================================

ALTER TABLE questionnaires
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- ============================================================
-- ÉTAPE 2 : Créer un cron job pour les relances (quotidien à 9h)
-- ============================================================

-- Supprimer l'ancien job s'il existe
SELECT cron.unschedule('send-reminder-emails');

-- Créer le job quotidien à 9h du matin
SELECT cron.schedule(
  'send-reminder-emails',
  '0 9 * * *',  -- Tous les jours à 9h00
  $$
  SELECT net.http_post(
    url := 'https://aqzdhyctnxxxaeuasmmn.supabase.co/functions/v1/send-reminder-emails',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- ============================================================
-- ÉTAPE 3 : Vérifier les jobs configurés
-- ============================================================

SELECT jobid, jobname, schedule, active FROM cron.job;
