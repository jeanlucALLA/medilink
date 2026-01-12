-- Enable RLS on the table
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own tickets
CREATE POLICY "Users can create tickets"
ON support_tickets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own tickets
CREATE POLICY "Users can view own tickets"
ON support_tickets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Admins can view ALL tickets
-- Assumes 'profiles' has 'is_admin' boolean and RLS allows reading own profile
CREATE POLICY "Admins can view all tickets"
ON support_tickets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Policy: Admins can update tickets (to reply/close)
CREATE POLICY "Admins can update tickets"
ON support_tickets
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);
