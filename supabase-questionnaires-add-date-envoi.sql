-- Script SQL pour ajouter la colonne date_envoi_suivi à la table questionnaires
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase

-- Ajouter la colonne date_envoi_suivi si elle n'existe pas
ALTER TABLE questionnaires 
ADD COLUMN IF NOT EXISTS date_envoi_suivi TIMESTAMP WITH TIME ZONE;

-- Créer un index sur date_envoi_suivi pour améliorer les performances des requêtes de l'Edge Function
CREATE INDEX IF NOT EXISTS questionnaires_date_envoi_suivi_idx 
ON questionnaires(date_envoi_suivi) 
WHERE date_envoi_suivi IS NOT NULL;



