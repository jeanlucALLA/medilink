-- Ajout de la colonne is_admin pour la gestion des droits d'accès
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Ajout de la colonne pour le type d'abonnement (pour l'affichage dans le dashboard)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'discovery'; -- 'discovery', 'premium', 'cabinet'

-- Création d'un admin par défaut (A REMPLACER par votre email/ID réel si possible, ou à exécuter manuellement sur votre user)
-- UPDATE profiles SET is_admin = true, subscription_tier = 'premium' WHERE id = 'VOTRE_UUID_ICI';

-- Rafraîchissement du cache
NOTIFY pgrst, 'reload schema';
