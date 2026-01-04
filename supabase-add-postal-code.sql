-- Script SQL pour ajouter la colonne code_postal à la table profiles
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase

-- Ajouter la colonne code_postal si elle n'existe pas
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS code_postal TEXT;

-- Créer un index pour améliorer les performances des requêtes régionales
CREATE INDEX IF NOT EXISTS profiles_code_postal_idx ON profiles(code_postal) 
WHERE code_postal IS NOT NULL;

-- Commentaire pour documenter la colonne
COMMENT ON COLUMN profiles.code_postal IS 'Code postal du cabinet pour le benchmarking régional';


