-- Script SQL pour créer la table community_templates dans Supabase
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase

-- Créer la table community_templates
CREATE TABLE IF NOT EXISTS community_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Peut être NULL pour les modèles système
  title TEXT NOT NULL, -- Titre du modèle (ex: "Premier Bilan")
  description TEXT, -- Description optionnelle
  pathologie TEXT NOT NULL, -- Nom de la pathologie/soin
  questions JSONB NOT NULL, -- Tableau de questions au format JSON
  tags TEXT[] DEFAULT '{}', -- Tags pour catégorisation (ex: ['Post-opératoire', 'Bien-être'])
  category TEXT, -- Catégorie principale (ex: 'Premier Bilan', 'Suivi de Douleur')
  usage_count INTEGER DEFAULT 0, -- Nombre de fois que le modèle a été importé
  vote_count INTEGER DEFAULT 0, -- Nombre de votes positifs
  is_approved BOOLEAN DEFAULT FALSE, -- Modération : approuvé par un admin
  is_system_template BOOLEAN DEFAULT FALSE -- Modèles système (non supprimables)
);

-- Activer Row Level Security (RLS)
ALTER TABLE community_templates ENABLE ROW LEVEL SECURITY;

-- Politique : Tous les utilisateurs authentifiés peuvent lire les modèles approuvés
CREATE POLICY "Authenticated users can view approved community templates"
  ON community_templates FOR SELECT
  USING (auth.role() = 'authenticated' AND (is_approved = TRUE OR is_system_template = TRUE));

-- Politique : Les utilisateurs peuvent créer leurs propres modèles
CREATE POLICY "Users can insert own community templates"
  ON community_templates FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Politique : Les utilisateurs peuvent mettre à jour leurs propres modèles
CREATE POLICY "Users can update own community templates"
  ON community_templates FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Politique : Les utilisateurs peuvent supprimer leurs propres modèles (sauf système)
CREATE POLICY "Users can delete own community templates"
  ON community_templates FOR DELETE
  USING (auth.uid() = created_by AND is_system_template = FALSE);

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS community_templates_category_idx ON community_templates(category);
CREATE INDEX IF NOT EXISTS community_templates_tags_idx ON community_templates USING GIN(tags);
CREATE INDEX IF NOT EXISTS community_templates_approved_idx ON community_templates(is_approved, is_system_template);
CREATE INDEX IF NOT EXISTS community_templates_usage_idx ON community_templates(usage_count DESC);
CREATE INDEX IF NOT EXISTS community_templates_vote_idx ON community_templates(vote_count DESC);

-- Fonction pour incrémenter le compteur d'utilisation
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE community_templates
  SET usage_count = usage_count + 1
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour incrémenter le compteur de votes
CREATE OR REPLACE FUNCTION increment_template_vote(template_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE community_templates
  SET vote_count = vote_count + 1
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires pour documenter
COMMENT ON TABLE community_templates IS 'Modèles de questionnaires partagés par la communauté';
COMMENT ON COLUMN community_templates.is_system_template IS 'Modèles système créés par l''équipe, non supprimables';
COMMENT ON COLUMN community_templates.is_approved IS 'Modération : modèles approuvés par un administrateur';


