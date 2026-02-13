-- Script SQL pour créer la table templates dans Supabase
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase

-- Créer la table templates
CREATE TABLE IF NOT EXISTS templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pathologie_name TEXT NOT NULL,
  questions JSONB NOT NULL, -- Stocke le tableau de questions au format JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  -- Contrainte d'unicité : un utilisateur ne peut avoir qu'un seul modèle par pathologie
  UNIQUE(user_id, pathologie_name)
);

-- Activer Row Level Security (RLS)
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent lire leurs propres templates
CREATE POLICY "Users can view own templates"
  ON templates FOR SELECT
  USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent insérer leurs propres templates
CREATE POLICY "Users can insert own templates"
  ON templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent mettre à jour leurs propres templates
CREATE POLICY "Users can update own templates"
  ON templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent supprimer leurs propres templates
CREATE POLICY "Users can delete own templates"
  ON templates FOR DELETE
  USING (auth.uid() = user_id);

-- Créer un index sur user_id pour améliorer les performances
CREATE INDEX IF NOT EXISTS templates_user_id_idx ON templates(user_id);

-- Créer un index sur pathologie_name pour améliorer les recherches
CREATE INDEX IF NOT EXISTS templates_pathologie_name_idx ON templates(pathologie_name);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();



