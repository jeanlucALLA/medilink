-- ============================================
-- Script: Setup Settings Enhancements
-- Ajoute colonnes avatar et notifications + bucket avatars
-- ============================================

-- 1. COLONNES POUR L'AVATAR ET LES NOTIFICATIONS
-- ===============================================

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notif_new_responses BOOLEAN DEFAULT true;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notif_reminders BOOLEAN DEFAULT true;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notif_newsletter BOOLEAN DEFAULT false;

-- 2. BUCKET STORAGE POUR LES AVATARS
-- ===================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,  -- 2 Mo max
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152;

-- 3. POLITIQUES RLS POUR LE BUCKET AVATARS
-- =========================================
-- Suppression des politiques existantes pour éviter les conflits

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

-- Users peuvent upload leur propre avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Tout le monde peut voir les avatars
CREATE POLICY "Avatars are publicly viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Users peuvent mettre à jour leur propre avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users peuvent supprimer leur propre avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
