-- Migration: Add trial system columns
-- Date: 2026-01-17
-- Description: Adds trial_started_at and trial_ends_at for 5-day free trial

-- 1. Add trial columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- 2. Update existing users without subscription to have 'trial' status
-- (Users who don't have a subscription_tier or have 'inactive' will get trial)
UPDATE public.profiles
SET 
  subscription_tier = 'trial',
  trial_started_at = created_at,
  trial_ends_at = created_at + INTERVAL '5 days'
WHERE subscription_tier IS NULL 
   OR subscription_tier = 'inactive'
   OR subscription_tier = '';

-- 3. Create or replace trigger to auto-set trial on new registration
CREATE OR REPLACE FUNCTION public.set_trial_on_registration()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set trial if subscription_tier is not already set (e.g., from referral)
  IF NEW.subscription_tier IS NULL OR NEW.subscription_tier = '' THEN
    NEW.subscription_tier := 'trial';
    NEW.trial_started_at := NOW();
    NEW.trial_ends_at := NOW() + INTERVAL '5 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Drop existing trigger if exists, then create
DROP TRIGGER IF EXISTS trigger_set_trial_on_registration ON public.profiles;
CREATE TRIGGER trigger_set_trial_on_registration
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_trial_on_registration();

-- 5. Index for performance when checking trial status
CREATE INDEX IF NOT EXISTS idx_profiles_trial_ends_at ON public.profiles(trial_ends_at);

-- Verification query (run to check)
-- SELECT id, email, subscription_tier, trial_started_at, trial_ends_at FROM profiles LIMIT 10;
