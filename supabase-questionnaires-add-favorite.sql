-- Script SQL pour ajouter la colonne is_favorite à la table questionnaires
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase

-- Ajouter la colonne is_favorite si elle n'existe pas
ALTER TABLE questionnaires 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- Créer un index pour améliorer les performances des requêtes de favoris
CREATE INDEX IF NOT EXISTS questionnaires_is_favorite_idx ON questionnaires(user_id, is_favorite) 
WHERE is_favorite = TRUE;

-- Commentaire pour documenter la colonne
COMMENT ON COLUMN questionnaires.is_favorite IS 'Indique si le questionnaire est marqué comme favori pour apparaître dans la bibliothèque de modèles';


