-- Enable RLS on the table (safe to run multiple times)
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- DROP existing policies to avoid "already exists" errors
DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can update tickets" ON support_tickets;

-- Re-create policies

-- 1. Les utilisateurs peuvent créer des tickets
CREATE POLICY "Users can create tickets" 
ON support_tickets 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 2. Les utilisateurs voient LEURS tickets
CREATE POLICY "Users can view own tickets" 
ON support_tickets 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 3. Les admins voient TOUS les tickets
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

-- 4. Les admins peuvent répondre (update)
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
