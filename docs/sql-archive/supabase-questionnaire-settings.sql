-- Script SQL pour créer la table questionnaire_settings dans Supabase
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase

-- Créer la table questionnaire_settings
CREATE TABLE IF NOT EXISTS questionnaire_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  questions JSONB NOT NULL, -- Stocke les questions personnalisées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id) -- Un seul modèle par utilisateur
);

-- Activer Row Level Security (RLS)
ALTER TABLE questionnaire_settings ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent lire leurs propres paramètres
CREATE POLICY "Users can view own questionnaire settings"
  ON questionnaire_settings FOR SELECT
  USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent insérer leurs propres paramètres
CREATE POLICY "Users can insert own questionnaire settings"
  ON questionnaire_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent mettre à jour leurs propres paramètres
CREATE POLICY "Users can update own questionnaire settings"
  ON questionnaire_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Créer un index sur user_id pour améliorer les performances
CREATE INDEX IF NOT EXISTS questionnaire_settings_user_id_idx ON questionnaire_settings(user_id);



