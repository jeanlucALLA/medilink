-- Table pour les logs de paiement (Sécurité & Audit)
CREATE TABLE IF NOT EXISTS logs_paiement (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    event_type TEXT NOT NULL,
    amount_cents INTEGER,
    currency TEXT DEFAULT 'eur',
    status TEXT,
    stripe_event_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Activation RLS (Row Level Security)
ALTER TABLE logs_paiement ENABLE ROW LEVEL SECURITY;

-- Politique : Seul l'admin peut voir les logs
CREATE POLICY "Admins can view payment logs" 
ON logs_paiement FOR SELECT 
USING (
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
);

-- Politique : Insertion ouverte pour le service (via Service Role) ou l'utilisateur lui-même (si besoin, ici on restreint)
-- Pour l'instant, on laisse l'accès insert au service role uniquement (par défaut implicite si on n'expose pas)
