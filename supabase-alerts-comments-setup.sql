-- Script SQL pour ajouter le système de traitement des alertes et commentaires
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase

-- Ajouter colonne treated (traité) à la table alerts_log
ALTER TABLE alerts_log 
ADD COLUMN IF NOT EXISTS treated BOOLEAN DEFAULT FALSE;

-- Ajouter colonne treated_at pour la date de traitement
ALTER TABLE alerts_log 
ADD COLUMN IF NOT EXISTS treated_at TIMESTAMP WITH TIME ZONE;

-- Créer index pour filtrer les alertes non traitées
CREATE INDEX IF NOT EXISTS alerts_log_treated_idx ON alerts_log(treated);

-- Table pour les commentaires/notes sur les statistiques
CREATE TABLE IF NOT EXISTS statistics_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pathologie TEXT,
  note_date DATE NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Activer Row Level Security (RLS)
ALTER TABLE statistics_notes ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent lire leurs propres notes
CREATE POLICY "Users can view own notes"
  ON statistics_notes FOR SELECT
  USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent insérer leurs propres notes
CREATE POLICY "Users can insert own notes"
  ON statistics_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent mettre à jour leurs propres notes
CREATE POLICY "Users can update own notes"
  ON statistics_notes FOR UPDATE
  USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent supprimer leurs propres notes
CREATE POLICY "Users can delete own notes"
  ON statistics_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Créer un index sur user_id et note_date pour améliorer les performances
CREATE INDEX IF NOT EXISTS statistics_notes_user_date_idx ON statistics_notes(user_id, note_date DESC);



