-- Ajout des colonnes manquantes pour la localisation et le benchmark
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS department_code TEXT,
ADD COLUMN IF NOT EXISTS specialty TEXT;

-- Rafraîchissement du cache du schéma pour PostgREST
NOTIFY pgrst, 'reload schema';

-- Vérification (Optionnelle)
-- SELECT * FROM profiles LIMIT 1;
