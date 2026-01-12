-- 1. Helper Function: is_admin()
-- Runs as "Security Definer" to bypass RLS when checking permissions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Allow Admins to see ALL Profiles (Needed for the name/email join in the dashboard)
-- Note: We drop ensure we don't duplicate
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  is_admin()
);

-- 3. Fix support_tickets policies to use the new safer function
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can update tickets" ON support_tickets;
-- Re-drop user policies just to be sure we are clean
DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;


-- Re-create User Policies
CREATE POLICY "Users can create tickets" 
ON support_tickets FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own tickets" 
ON support_tickets FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

-- Re-create Admin Policies using is_admin()
CREATE POLICY "Admins can view all tickets" 
ON support_tickets FOR SELECT TO authenticated 
USING (
  is_admin()
);

CREATE POLICY "Admins can update tickets" 
ON support_tickets FOR UPDATE TO authenticated 
USING (
  is_admin()
);
