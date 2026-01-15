-- Script pour corriger les anciens questionnaires envoyés
-- afin qu'ils apparaissent dans l'onglet "Envoyé"

-- ============================================================
-- ÉTAPE 1 : Ajouter la colonne sent_at si elle n'existe pas
-- ============================================================

ALTER TABLE questionnaires
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE;

-- ============================================================
-- ÉTAPE 2 : Diagnostic - voir les questionnaires concernés
-- ============================================================

SELECT id, pathologie, patient_email, status, created_at
FROM questionnaires
WHERE status IN ('sent', 'pending') OR patient_email = 'PURGED';

-- ============================================================
-- ÉTAPE 3 : Convertir les statuts vers 'envoyé'
-- ============================================================

-- Convertir 'sent' (anglais) vers 'envoyé' (français)
UPDATE questionnaires
SET status = 'envoyé'
WHERE status = 'sent';

-- Convertir 'pending' vers 'programmé' pour les futurs envois
UPDATE questionnaires
SET status = 'programmé'
WHERE status = 'pending'
  AND patient_email IS NOT NULL
  AND patient_email != 'PURGED';

-- Pour les questionnaires avec email purgé = déjà envoyés
UPDATE questionnaires
SET status = 'envoyé'
WHERE patient_email = 'PURGED' 
  AND status NOT IN ('envoyé', 'completed');

-- ============================================================
-- ÉTAPE 4 : Ajouter la date d'envoi si manquante
-- ============================================================

-- Calculer sent_at à partir de created_at + send_after_days
UPDATE questionnaires
SET sent_at = created_at + (send_after_days * INTERVAL '1 day')
WHERE status = 'envoyé'
  AND sent_at IS NULL
  AND send_after_days IS NOT NULL;

-- Fallback: utiliser created_at
UPDATE questionnaires
SET sent_at = created_at
WHERE status = 'envoyé'
  AND sent_at IS NULL;

-- ============================================================
-- ÉTAPE 5 : Vérification finale
-- ============================================================

SELECT id, pathologie, status, sent_at, patient_email
FROM questionnaires
WHERE status = 'envoyé'
ORDER BY sent_at DESC;
