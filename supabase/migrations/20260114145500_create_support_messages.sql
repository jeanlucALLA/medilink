-- Migration: Create support_messages table
-- Date: 2026-01-14
-- Description: Table for practitioner support tickets/messages

-- 1. Create the support_messages table
CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'read', 'in_progress', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  admin_response TEXT,
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES public.profiles(id)
);

-- 2. Enable RLS
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_messages_user_id ON public.support_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_status ON public.support_messages(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at ON public.support_messages(created_at DESC);

-- 4. RLS Policies

-- Practitioners can view their own messages
DROP POLICY IF EXISTS "Users can view own messages" ON public.support_messages;
CREATE POLICY "Users can view own messages"
  ON public.support_messages FOR SELECT
  USING (user_id = auth.uid());

-- Practitioners can insert their own messages
DROP POLICY IF EXISTS "Users can insert own messages" ON public.support_messages;
CREATE POLICY "Users can insert own messages"
  ON public.support_messages FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins can view all messages
DROP POLICY IF EXISTS "Admins can view all messages" ON public.support_messages;
CREATE POLICY "Admins can view all messages"
  ON public.support_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admins can update messages (respond, change status)
DROP POLICY IF EXISTS "Admins can update messages" ON public.support_messages;
CREATE POLICY "Admins can update messages"
  ON public.support_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- 5. Enable Realtime for live updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'support_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
  END IF;
END;
$$;
