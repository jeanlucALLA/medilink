-- Script SQL pour ajouter la colonne date_envoi_suivi à la table questionnaires
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase

-- Ajouter la colonne date_envoi_suivi si elle n'existe pas
-- Valeur par défaut : NOW() + 14 jours
ALTER TABLE questionnaires 
ADD COLUMN IF NOT EXISTS date_envoi_suivi TIMESTAMP WITH TIME ZONE 
DEFAULT (NOW() + INTERVAL '14 days');

-- Si la colonne existe déjà sans défaut, ajouter le défaut
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questionnaires' 
    AND column_name = 'date_envoi_suivi'
    AND column_default IS NULL
  ) THEN
    ALTER TABLE questionnaires 
    ALTER COLUMN date_envoi_suivi 
    SET DEFAULT (NOW() + INTERVAL '14 days');
  END IF;
END $$;

-- Créer un index sur date_envoi_suivi pour améliorer les performances de la requête
CREATE INDEX IF NOT EXISTS questionnaires_date_envoi_suivi_idx 
ON questionnaires(date_envoi_suivi) 
WHERE date_envoi_suivi IS NOT NULL;

-- Créer un index sur status pour améliorer les performances
CREATE INDEX IF NOT EXISTS questionnaires_status_idx 
ON questionnaires(status) 
WHERE status = 'Programmé';

