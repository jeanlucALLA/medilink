-- ============================================================================
-- MIGRATION: Fix Audit Issues (27 Jan 2026)
-- ============================================================================
-- 1. Fix email_tracking RLS policy (is_admin instead of role)
-- 2. Backfill missing notifications for existing profiles
-- 3. Drop unused support_tickets table
-- ============================================================================

-- ============================================================================
-- FIX 1: email_tracking RLS Policy
-- Problem: Policy checks profiles.role = 'admin' but schema uses is_admin boolean
-- ============================================================================

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Admin can view all email tracking" ON email_tracking;

-- Recreate with correct column reference
CREATE POLICY "Admin can view all email tracking" ON email_tracking
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- ============================================================================
-- FIX 2: Backfill Missing Notifications
-- Problem: 5 profiles exist but 0 notifications were created
-- Note: Production schema missing columns - add them dynamically
-- ============================================================================

-- Add missing columns if they don't exist
DO $$
BEGIN
  -- Add practitioner_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'practitioner_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN practitioner_id uuid REFERENCES profiles(id);
  END IF;
  
  -- Add metadata if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE notifications ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
  
  -- Add type if missing  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'type'
  ) THEN
    ALTER TABLE notifications ADD COLUMN type text DEFAULT 'info';
  END IF;
END $$;

-- Insert missing notifications for existing profiles
INSERT INTO notifications (message, type, practitioner_id, metadata)
SELECT 
  'Nouveau praticien inscrit : ' || COALESCE(p.nom_complet, 'Praticien'),
  'signup',
  p.id,
  jsonb_build_object('email', p.email, 'backfilled', true)
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM notifications n 
  WHERE n.practitioner_id = p.id 
  AND n.type = 'signup'
);

-- ============================================================================
-- FIX 3: Drop Unused support_tickets Table
-- Problem: support_tickets (0 rows) is duplicate of support_messages (4 rows)
-- ============================================================================

-- First drop all policies on the table
DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can update tickets" ON support_tickets;

-- Now drop the table
DROP TABLE IF EXISTS support_tickets;

-- ============================================================================
-- VERIFICATION QUERIES (run manually to confirm fixes)
-- ============================================================================
-- 
-- Check RLS policy is correct:
-- SELECT polname FROM pg_policy WHERE polrelid = 'email_tracking'::regclass;
--
-- Check notifications were backfilled:
-- SELECT COUNT(*) FROM notifications WHERE type = 'signup';
--
-- Check support_tickets is gone:
-- SELECT * FROM information_schema.tables WHERE table_name = 'support_tickets';
--
-- ============================================================================

COMMENT ON TABLE email_tracking IS 'Email delivery tracking - RLS fixed 27 Jan 2026';
