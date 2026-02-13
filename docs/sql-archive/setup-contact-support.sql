-- ============================================
-- Script: Setup Contact Support Enhancements
-- Ajoute les colonnes manquantes et le bucket storage
-- ============================================

-- 1. AJOUT DES COLONNES MANQUANTES À support_messages
-- ====================================================

-- Colonne pour la réponse admin
ALTER TABLE public.support_messages 
ADD COLUMN IF NOT EXISTS admin_response TEXT;

-- Colonne pour la date de réponse
ALTER TABLE public.support_messages 
ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP WITH TIME ZONE;

-- Colonne pour l'URL de la pièce jointe
ALTER TABLE public.support_messages 
ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- 2. CRÉATION DU BUCKET STORAGE
-- ==============================

-- Créer le bucket pour les pièces jointes support
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'support-attachments',
  'support-attachments',
  true,  -- Public pour que l'admin puisse voir les images
  5242880,  -- 5 Mo max
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

-- 3. POLITIQUES RLS POUR LE BUCKET
-- =================================

-- Permettre aux utilisateurs authentifiés d'uploader dans leur dossier
CREATE POLICY "Users can upload support attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'support-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permettre à tout le monde de lire (pour que l'admin puisse voir)
CREATE POLICY "Anyone can view support attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'support-attachments');

-- Permettre aux utilisateurs de supprimer leurs propres fichiers
CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'support-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. VÉRIFICATION
-- ================
-- Exécutez cette requête après pour vérifier que tout est OK:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'support_messages';
-- SELECT * FROM storage.buckets WHERE id = 'support-attachments';
