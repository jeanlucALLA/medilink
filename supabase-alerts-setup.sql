-- Script SQL pour créer la table alerts_log dans Supabase
-- Cette table stocke les logs des alertes envoyées aux praticiens
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase

-- Créer la table alerts_log
CREATE TABLE IF NOT EXISTS alerts_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  response_id UUID NOT NULL,
  questionnaire_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_email TEXT,
  pathologie TEXT NOT NULL,
  score_total INTEGER NOT NULL,
  alert_sent BOOLEAN DEFAULT FALSE,
  alert_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Activer Row Level Security (RLS)
ALTER TABLE alerts_log ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent lire leurs propres logs d'alertes
CREATE POLICY "Users can view own alerts"
  ON alerts_log FOR SELECT
  USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent insérer leurs propres logs d'alertes
CREATE POLICY "Users can insert own alerts"
  ON alerts_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Créer un index sur user_id pour améliorer les performances
CREATE INDEX IF NOT EXISTS alerts_log_user_id_idx ON alerts_log(user_id);

-- Créer un index sur response_id pour les jointures
CREATE INDEX IF NOT EXISTS alerts_log_response_id_idx ON alerts_log(response_id);

-- Créer un index sur alert_sent pour filtrer les alertes envoyées
CREATE INDEX IF NOT EXISTS alerts_log_alert_sent_idx ON alerts_log(alert_sent);

-- Créer un index sur score_total pour filtrer les scores bas
CREATE INDEX IF NOT EXISTS alerts_log_score_total_idx ON alerts_log(score_total);



