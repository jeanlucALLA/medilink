-- Script pour corriger les questionnaires avec status = 'pending' vers 'programmé'
-- Cela permet à l'Edge Function send-scheduled-questionnaires de les traiter correctement

-- 1. Voir combien de questionnaires sont affectés
SELECT id, pathologie, patient_email, status, created_at, send_after_days
FROM questionnaires
WHERE status = 'pending';

-- 2. Mettre à jour les questionnaires en attente d'envoi
UPDATE questionnaires
SET status = 'programmé'
WHERE status = 'pending'
  AND patient_email IS NOT NULL
  AND send_after_days IS NOT NULL;

-- 3. Vérifier la correction
SELECT id, pathologie, status, send_after_days
FROM questionnaires
WHERE status = 'programmé';
