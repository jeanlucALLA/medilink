-- Migration: Créer la table active_consultations
-- Remplace le stockage en mémoire (Map) incompatible avec Vercel serverless
-- Les consultations expirent automatiquement après 60 minutes

CREATE TABLE IF NOT EXISTS active_consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL,
    notes TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '60 minutes')
);

-- Index pour le nettoyage des expirations (requêtes WHERE expires_at <= now())
CREATE INDEX idx_active_consultations_expires_at ON active_consultations(expires_at);

-- Index pour les consultations d'un praticien
CREATE INDEX idx_active_consultations_user_id ON active_consultations(user_id);

-- RLS : chaque praticien ne voit que ses propres consultations
ALTER TABLE active_consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consultations"
    ON active_consultations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consultations"
    ON active_consultations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own consultations"
    ON active_consultations FOR DELETE
    USING (auth.uid() = user_id);

-- Service Role bypass RLS (pour le cleanup automatique)
-- Le Service Role contourne RLS par défaut, pas besoin de policy supplémentaire.

-- ============================================================
-- NETTOYAGE AUTOMATIQUE : Fonction + pg_cron
-- ============================================================

-- Fonction de nettoyage des consultations expirées
CREATE OR REPLACE FUNCTION cleanup_expired_consultations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM active_consultations
    WHERE expires_at <= now();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    IF deleted_count > 0 THEN
        RAISE LOG '[Consultation Cleanup] % expired consultation(s) deleted', deleted_count;
    END IF;

    RETURN deleted_count;
END;
$$;

-- Planifier le nettoyage toutes les 10 minutes via pg_cron
-- (Activer pg_cron dans Supabase : Dashboard > Database > Extensions > pg_cron)
-- Décommentez la ligne ci-dessous après avoir activé pg_cron :
-- SELECT cron.schedule('cleanup-expired-consultations', '*/10 * * * *', 'SELECT cleanup_expired_consultations()');
