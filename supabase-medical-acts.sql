-- Script SQL pour créer la table medical_acts dans Supabase
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase

-- Créer la table medical_acts
CREATE TABLE IF NOT EXISTS medical_acts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  act_name TEXT NOT NULL,
  patient_name TEXT,
  act_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Activer Row Level Security (RLS)
ALTER TABLE medical_acts ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent lire leurs propres actes
CREATE POLICY "Users can view own medical acts"
  ON medical_acts FOR SELECT
  USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent insérer leurs propres actes
CREATE POLICY "Users can insert own medical acts"
  ON medical_acts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent mettre à jour leurs propres actes
CREATE POLICY "Users can update own medical acts"
  ON medical_acts FOR UPDATE
  USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent supprimer leurs propres actes
CREATE POLICY "Users can delete own medical acts"
  ON medical_acts FOR DELETE
  USING (auth.uid() = user_id);

-- Créer un index sur user_id pour améliorer les performances
CREATE INDEX IF NOT EXISTS medical_acts_user_id_idx ON medical_acts(user_id);

-- Créer un index sur created_at pour améliorer les performances des requêtes de tri
CREATE INDEX IF NOT EXISTS medical_acts_created_at_idx ON medical_acts(created_at DESC);

-- Créer un index sur act_date pour améliorer les performances des requêtes de filtre par date
CREATE INDEX IF NOT EXISTS medical_acts_act_date_idx ON medical_acts(act_date);



