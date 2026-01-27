-- Migration: Add email tracking system for delivery monitoring
-- Purpose: Track Resend email events (delivered, opened, bounced, etc.)
-- Date: 2026-01-27

-- 1. Create email_tracking table
CREATE TABLE IF NOT EXISTS email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resend_email_id TEXT NOT NULL,
  questionnaire_id UUID REFERENCES questionnaires(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email_hash TEXT, -- Hashed for privacy, NULL after 30 days
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'delivery_delayed')),
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_tracking_resend_id ON email_tracking(resend_email_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_questionnaire ON email_tracking(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_user ON email_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_type ON email_tracking(event_type);
CREATE INDEX IF NOT EXISTS idx_email_tracking_created ON email_tracking(created_at DESC);

-- 3. Add resend_email_id column to questionnaires table
ALTER TABLE questionnaires 
ADD COLUMN IF NOT EXISTS resend_email_id TEXT;

-- 4. Add index for linking emails to questionnaires
CREATE INDEX IF NOT EXISTS idx_questionnaires_resend_id ON questionnaires(resend_email_id);

-- 5. Enable RLS
ALTER TABLE email_tracking ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- Admin can see all
CREATE POLICY "Admin can view all email tracking" ON email_tracking
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Practitioners can see their own
CREATE POLICY "Practitioners can view own email tracking" ON email_tracking
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Service role can insert (for webhook)
CREATE POLICY "Service can insert email tracking" ON email_tracking
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 7. Create analytics view for easy querying
CREATE OR REPLACE VIEW email_delivery_stats AS
SELECT 
  user_id,
  event_type,
  COUNT(*) as count,
  DATE_TRUNC('day', created_at) as day
FROM email_tracking
GROUP BY user_id, event_type, DATE_TRUNC('day', created_at);

-- 8. Grant permissions
GRANT SELECT ON email_delivery_stats TO authenticated;

COMMENT ON TABLE email_tracking IS 'Tracks email delivery events from Resend webhooks for monitoring questionnaire deliverability';
COMMENT ON COLUMN email_tracking.recipient_email_hash IS 'SHA256 hash of recipient email for privacy. Set to NULL after 30 days via scheduled job.';
