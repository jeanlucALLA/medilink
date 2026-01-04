-- Script SQL pour ajouter les colonnes nécessaires à la table questionnaires
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase

-- Ajouter la colonne patient_name si elle n'existe pas
ALTER TABLE questionnaires 
ADD COLUMN IF NOT EXISTS patient_name TEXT;

-- Ajouter la colonne reponses (JSONB) pour stocker les réponses du patient
ALTER TABLE questionnaires 
ADD COLUMN IF NOT EXISTS reponses JSONB;

-- Ajouter la colonne score_resultat pour stocker le score calculé
ALTER TABLE questionnaires 
ADD COLUMN IF NOT EXISTS score_resultat INTEGER;

-- Ajouter la colonne updated_at si elle n'existe pas
ALTER TABLE questionnaires 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- Créer un index sur reponses pour améliorer les recherches (optionnel)
CREATE INDEX IF NOT EXISTS questionnaires_reponses_idx 
ON questionnaires USING GIN (reponses) 
WHERE reponses IS NOT NULL;

-- Créer un index sur score_resultat
CREATE INDEX IF NOT EXISTS questionnaires_score_resultat_idx 
ON questionnaires(score_resultat) 
WHERE score_resultat IS NOT NULL;



