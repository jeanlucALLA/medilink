-- Script SQL pour créer la table questionnaires dans Supabase
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase

-- Supprimer la table si elle existe déjà (optionnel, pour réinitialisation)
-- DROP TABLE IF EXISTS questionnaires CASCADE;

-- Créer la table questionnaires
CREATE TABLE IF NOT EXISTS questionnaires (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pathologie TEXT NOT NULL,
  patient_email TEXT,
  questions JSONB NOT NULL, -- Stocke le tableau de questions au format JSON
  status TEXT DEFAULT 'programmé',
  send_after_days INTEGER
);

-- Activer Row Level Security (RLS)
ALTER TABLE questionnaires ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent lire leurs propres questionnaires
CREATE POLICY "Users can view own questionnaires"
  ON questionnaires FOR SELECT
  USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent insérer leurs propres questionnaires
CREATE POLICY "Users can insert own questionnaires"
  ON questionnaires FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent mettre à jour leurs propres questionnaires
CREATE POLICY "Users can update own questionnaires"
  ON questionnaires FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent supprimer leurs propres questionnaires
CREATE POLICY "Users can delete own questionnaires"
  ON questionnaires FOR DELETE
  USING (auth.uid() = user_id);

-- Créer un index sur user_id pour améliorer les performances
CREATE INDEX IF NOT EXISTS questionnaires_user_id_idx ON questionnaires(user_id);

-- Créer un index sur created_at pour améliorer le tri
CREATE INDEX IF NOT EXISTS questionnaires_created_at_idx ON questionnaires(created_at DESC);
