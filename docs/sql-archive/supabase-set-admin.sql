-- Met à jour le profil de l'utilisateur pour lui donner les droits d'administrateur
UPDATE profiles
SET is_admin = true,
    subscription_tier = 'premium' -- On s'assure qu'il a aussi l'accès premium pour tester
WHERE email = 'jeanlucallaa@yahoo.fr';

-- Vérification
SELECT email, is_admin, subscription_tier 
FROM profiles 
WHERE email = 'jeanlucallaa@yahoo.fr';
