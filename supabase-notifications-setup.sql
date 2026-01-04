-- Script SQL pour ajouter la colonne notifications à la table profiles
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase

-- Ajouter la colonne notifications (JSONB) à la table profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS notifications JSONB DEFAULT '{
  "emailAlerts": false,
  "followUpReminders": false,
  "securityAlerts": true,
  "weeklySummary": false
}'::jsonb;

-- Créer un index GIN sur la colonne notifications pour améliorer les performances des requêtes JSONB
CREATE INDEX IF NOT EXISTS profiles_notifications_idx ON profiles USING GIN (notifications);

-- Commentaire sur la colonne pour documentation
COMMENT ON COLUMN profiles.notifications IS 'Préférences de notifications utilisateur stockées en JSONB';



