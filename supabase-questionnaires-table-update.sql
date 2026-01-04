-- Script SQL pour mettre à jour la table questionnaires avec les colonnes nécessaires
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Ajouter la colonne sent_at si elle n'existe pas
ALTER TABLE questionnaires 
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE;

-- 2. Vérifier que la colonne status existe et peut accepter 'pending' et 'sent'
-- Si vous utilisez un type ENUM, vous devrez peut-être l'ajuster
-- Sinon, TEXT fonctionne parfaitement

-- 3. Vérifier que send_after_days existe
ALTER TABLE questionnaires 
ADD COLUMN IF NOT EXISTS send_after_days INTEGER;

-- 4. Créer un index pour améliorer les performances de la requête
CREATE INDEX IF NOT EXISTS idx_questionnaires_status_pending 
ON questionnaires(status) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_questionnaires_created_send_days 
ON questionnaires(created_at, send_after_days) 
WHERE status = 'pending' AND patient_email IS NOT NULL;

-- 5. Vérifier la structure de la table
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'questionnaires'
ORDER BY ordinal_position;



