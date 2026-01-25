-- Migration: Add reminder_cancelled column to questionnaires table
-- This allows practitioners to cancel automatic reminders

ALTER TABLE questionnaires 
ADD COLUMN IF NOT EXISTS reminder_cancelled BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN questionnaires.reminder_cancelled IS 'If true, the automatic reminder will not be sent for this questionnaire';
