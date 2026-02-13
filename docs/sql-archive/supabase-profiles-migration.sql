-- Script SQL pour migrer la table profiles vers la nouvelle structure
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase

-- Ajouter la colonne identifiant_pro si elle n'existe pas
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS identifiant_pro TEXT;

-- Ajouter la colonne nom_lieu_exercice si elle n'existe pas
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS nom_lieu_exercice TEXT;

-- Migrer les données de rpps vers identifiant_pro (si rpps existe et identifiant_pro est vide)
UPDATE profiles 
SET identifiant_pro = rpps 
WHERE identifiant_pro IS NULL AND rpps IS NOT NULL;

-- Migrer les données de cabinet vers nom_lieu_exercice (si cabinet existe et nom_lieu_exercice est vide)
UPDATE profiles 
SET nom_lieu_exercice = cabinet 
WHERE nom_lieu_exercice IS NULL AND cabinet IS NOT NULL;

-- Optionnel : Supprimer les anciennes colonnes après migration (décommentez si vous êtes sûr)
-- ALTER TABLE profiles DROP COLUMN IF EXISTS rpps;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS cabinet;



