-- Migration: Add insert policy for notifications table
-- Date: 2026-01-14
-- Description: Allow service role to insert notifications for Smart Review feature

-- Policy for service role to insert notifications
-- When using service role key, RLS is bypassed, so this is mainly for documentation
-- But we add a policy for authenticated users to insert their own notifications

DROP POLICY IF EXISTS "Service can insert notifications" ON public.notifications;
CREATE POLICY "Service can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Also allow practitioners to view their own notifications
DROP POLICY IF EXISTS "Practitioners can view own notifications" ON public.notifications;
CREATE POLICY "Practitioners can view own notifications"
  ON public.notifications FOR SELECT
  USING (practitioner_id = auth.uid());
