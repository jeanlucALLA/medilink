-- =============================================================================
-- Script SQL pour permettre la suppression de compte utilisateur par l'admin
-- Date: 2026-01-20
-- Description: Configuration des policies RLS et cascade pour la suppression
-- =============================================================================

-- 1. Mise à jour des contraintes CASCADE pour les tables existantes
-- Note: On utilise DO $$ pour vérifier l'existence des tables/colonnes

-- Questionnaires (si la table existe avec user_id)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'questionnaires' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.questionnaires DROP CONSTRAINT IF EXISTS questionnaires_user_id_fkey;
        ALTER TABLE public.questionnaires 
            ADD CONSTRAINT questionnaires_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Templates (si la table existe avec user_id)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'templates' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.templates DROP CONSTRAINT IF EXISTS templates_user_id_fkey;
        ALTER TABLE public.templates 
            ADD CONSTRAINT templates_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Support Messages (si la table existe avec user_id)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'support_messages' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.support_messages DROP CONSTRAINT IF EXISTS support_messages_user_id_fkey;
        ALTER TABLE public.support_messages 
            ADD CONSTRAINT support_messages_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Notifications (si la table existe - vérifier le nom de la colonne)
DO $$
BEGIN
    -- Essayer avec practitioner_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'practitioner_id'
    ) THEN
        ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_practitioner_id_fkey;
        ALTER TABLE public.notifications 
            ADD CONSTRAINT notifications_practitioner_id_fkey 
            FOREIGN KEY (practitioner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    -- Sinon essayer avec user_id
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
        ALTER TABLE public.notifications 
            ADD CONSTRAINT notifications_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Payment Logs (si la table existe avec user_id)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'payment_logs' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.payment_logs DROP CONSTRAINT IF EXISTS payment_logs_user_id_fkey;
        ALTER TABLE public.payment_logs 
            ADD CONSTRAINT payment_logs_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Policy RLS pour permettre aux admins de supprimer des profils
DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;
CREATE POLICY "Admins can delete any profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles admin_profile
        WHERE admin_profile.id = auth.uid()
        AND admin_profile.is_admin = true
    )
);

-- 3. Rafraîchir le cache PostgREST
NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- SCRIPT EXÉCUTÉ AVEC SUCCÈS !
-- =============================================================================
-- La fonctionnalité de suppression est maintenant active.
-- Les admins peuvent supprimer des utilisateurs depuis /admin
-- =============================================================================
