-- =============================================================================
-- Script SQL pour permettre la suppression de compte utilisateur par l'admin
-- Date: 2026-01-20
-- Description: Configuration des policies RLS et cascade pour la suppression
-- =============================================================================

-- 1. S'assurer que les tables liées ont bien ON DELETE CASCADE
-- Cela permet de supprimer automatiquement les données liées quand un profil est supprimé

-- Vérification et mise à jour de la relation pour les questionnaires
ALTER TABLE IF EXISTS public.questionnaires
DROP CONSTRAINT IF EXISTS questionnaires_user_id_fkey,
ADD CONSTRAINT questionnaires_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Vérification et mise à jour pour les templates personnalisés
ALTER TABLE IF EXISTS public.templates
DROP CONSTRAINT IF EXISTS templates_user_id_fkey,
ADD CONSTRAINT templates_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Vérification pour les réponses questionnaires
ALTER TABLE IF EXISTS public.questionnaire_responses
DROP CONSTRAINT IF EXISTS questionnaire_responses_questionnaire_id_fkey,
ADD CONSTRAINT questionnaire_responses_questionnaire_id_fkey 
    FOREIGN KEY (questionnaire_id) REFERENCES public.questionnaires(id) ON DELETE CASCADE;

-- Vérification pour les messages support
ALTER TABLE IF EXISTS public.support_messages
DROP CONSTRAINT IF EXISTS support_messages_user_id_fkey,
ADD CONSTRAINT support_messages_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Vérification pour les notifications
ALTER TABLE IF EXISTS public.notifications
DROP CONSTRAINT IF EXISTS notifications_practitioner_id_fkey,
ADD CONSTRAINT notifications_practitioner_id_fkey 
    FOREIGN KEY (practitioner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Vérification pour les logs de paiement
ALTER TABLE IF EXISTS public.payment_logs
DROP CONSTRAINT IF EXISTS payment_logs_user_id_fkey,
ADD CONSTRAINT payment_logs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Créer une fonction RPC sécurisée pour la suppression (optionnel, pour audit)
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    admin_check BOOLEAN;
    user_email TEXT;
BEGIN
    -- Vérifier que l'appelant est admin
    SELECT is_admin INTO admin_check
    FROM profiles
    WHERE id = auth.uid();
    
    IF NOT admin_check THEN
        RAISE EXCEPTION 'Accès refusé: Seuls les administrateurs peuvent supprimer des utilisateurs';
    END IF;
    
    -- Récupérer l'email pour le log
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = target_user_id;
    
    -- Log de l'action (optionnel - créer la table audit_logs si souhaité)
    -- INSERT INTO audit_logs (action, performed_by, target_id, details, created_at)
    -- VALUES ('USER_DELETED', auth.uid(), target_user_id, jsonb_build_object('email', user_email), NOW());
    
    -- Supprimer le profil (les données liées seront supprimées en cascade)
    DELETE FROM public.profiles WHERE id = target_user_id;
    
    -- Note: La suppression de l'utilisateur auth.users doit être faite via l'API Admin
    -- car on ne peut pas supprimer directement depuis SQL sans service_role
    
    RETURN TRUE;
END;
$$;

-- 3. Policy RLS pour permettre aux admins de supprimer des profils
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

-- 4. Rafraîchir le cache PostgREST
NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- INSTRUCTIONS D'UTILISATION:
-- =============================================================================
-- 1. Exécutez ce script dans l'éditeur SQL de Supabase Dashboard
-- 2. La suppression se fait en 2 étapes via l'API:
--    a) Supprimer le profil (public.profiles) - cascade les données liées
--    b) Supprimer l'utilisateur auth (auth.users) - via supabaseAdmin.auth.admin.deleteUser()
-- 
-- ATTENTION: La suppression est IRRÉVERSIBLE !
-- =============================================================================
