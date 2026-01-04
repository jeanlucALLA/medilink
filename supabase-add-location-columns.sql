-- Script SQL pour ajouter les colonnes de localisation à la table profiles
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase

-- Ajouter les colonnes si elles n'existent pas
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS department_code TEXT;

-- Créer des index pour améliorer les performances des requêtes régionales
CREATE INDEX IF NOT EXISTS profiles_zip_code_idx ON profiles(zip_code) 
WHERE zip_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS profiles_department_code_idx ON profiles(department_code) 
WHERE department_code IS NOT NULL;

-- Commentaires pour documenter les colonnes
COMMENT ON COLUMN profiles.zip_code IS 'Code postal du cabinet pour le benchmarking régional';
COMMENT ON COLUMN profiles.city IS 'Ville du cabinet (détectée automatiquement depuis le code postal)';
COMMENT ON COLUMN profiles.department_code IS 'Code département (2 premiers chiffres du code postal) pour le benchmarking régional';


