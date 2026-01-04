-- Script SQL pour créer la table responses dans Supabase
-- Cette table stocke les réponses des patients pour les statistiques
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase

-- Créer la table responses
CREATE TABLE IF NOT EXISTS responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  questionnaire_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pathologie TEXT NOT NULL,
  answers JSONB NOT NULL, -- Tableau des réponses (nombres 1-5)
  score_total INTEGER, -- Score moyen calculé et arrondi (1-5)
  average_score NUMERIC(3, 2), -- Score moyen calculé (1-5) - conservé pour précision
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Activer Row Level Security (RLS)
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs peuvent lire leurs propres réponses
CREATE POLICY "Users can view own responses"
  ON responses FOR SELECT
  USING (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent insérer leurs propres réponses
CREATE POLICY "Users can insert own responses"
  ON responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique : Les utilisateurs peuvent supprimer leurs propres réponses
CREATE POLICY "Users can delete own responses"
  ON responses FOR DELETE
  USING (auth.uid() = user_id);

-- Créer un index sur user_id pour améliorer les performances
CREATE INDEX IF NOT EXISTS responses_user_id_idx ON responses(user_id);

-- Créer un index sur questionnaire_id pour les jointures
CREATE INDEX IF NOT EXISTS responses_questionnaire_id_idx ON responses(questionnaire_id);

-- Créer un index sur pathologie pour les filtres
CREATE INDEX IF NOT EXISTS responses_pathologie_idx ON responses(pathologie);

-- Créer un index sur submitted_at pour le tri chronologique
CREATE INDEX IF NOT EXISTS responses_submitted_at_idx ON responses(submitted_at DESC);

-- Fonction pour calculer automatiquement le score moyen et score_total
CREATE OR REPLACE FUNCTION calculate_average_score()
RETURNS TRIGGER AS $$
DECLARE
  avg_score NUMERIC;
BEGIN
  -- Calculer la moyenne des réponses (tableau JSONB de nombres)
  SELECT AVG(value::numeric)
  INTO avg_score
  FROM jsonb_array_elements_text(NEW.answers) AS value;
  
  -- Stocker la moyenne précise
  NEW.average_score := avg_score;
  
  -- Calculer le score_total arrondi (1-5)
  -- S'assurer que le score est entre 1 et 5
  NEW.score_total := GREATEST(1, LEAST(5, ROUND(avg_score)::INTEGER));
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour calculer automatiquement le score moyen et score_total
CREATE TRIGGER calculate_average_score_trigger
  BEFORE INSERT OR UPDATE ON responses
  FOR EACH ROW
  EXECUTE FUNCTION calculate_average_score();

