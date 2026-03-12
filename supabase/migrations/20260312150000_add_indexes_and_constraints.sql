-- Migration: add_indexes_and_auto_purge
-- Date: 2026-03-12
-- Description: Ajoute des index critiques pour la performance et un job de purge automatique

-- ==============================================================
-- 1. INDEX CRITIQUES POUR LA PERFORMANCE
-- ==============================================================

-- Index sur le statut des questionnaires (scan quotidien Edge Function)
CREATE INDEX IF NOT EXISTS idx_questionnaires_status 
  ON questionnaires(status);

-- Index composite pour le dashboard praticien (history, resolution)
CREATE INDEX IF NOT EXISTS idx_questionnaires_user_status 
  ON questionnaires(user_id, status);

-- Index pour les statistiques praticien (graphiques, scores)
CREATE INDEX IF NOT EXISTS idx_responses_user_submitted 
  ON responses(user_id, submitted_at DESC);

-- Index pour le lookup webhook Resend
CREATE INDEX IF NOT EXISTS idx_email_tracking_resend_id 
  ON email_tracking(resend_email_id);

-- Index pour la recherche de questionnaire par email patient
CREATE INDEX IF NOT EXISTS idx_questionnaires_patient_email 
  ON questionnaires(patient_email) 
  WHERE patient_email IS NOT NULL AND patient_email != 'PURGED';

-- Index pour les réponses par questionnaire (double-submit check)
CREATE INDEX IF NOT EXISTS idx_responses_questionnaire_id 
  ON responses(questionnaire_id);

-- ==============================================================
-- 2. CONTRAINTE UNIQUE SUR RESPONSES (anti double-soumission)
-- ==============================================================

-- Empêche les réponses multiples au même questionnaire au niveau BDD
-- ON CONFLICT DO NOTHING permet de gérer les race conditions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_response_per_questionnaire'
  ) THEN
    ALTER TABLE responses 
      ADD CONSTRAINT unique_response_per_questionnaire 
      UNIQUE (questionnaire_id);
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Contrainte unique_response_per_questionnaire non ajoutée (doublons existants probable)';
END $$;
