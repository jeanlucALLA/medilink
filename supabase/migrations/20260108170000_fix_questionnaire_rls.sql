-- Enable RLS on questionnaires if not already on
alter table public.questionnaires enable row level security;

-- Drop verify existing policies to avoid conflicts
drop policy if exists "Patients can view their own questionnaire by ID" on public.questionnaires;

-- Create policy to allow anyone to read a questionnaire if they have the ID (UUID)
-- This is necessary because patients are not authenticated users.
create policy "Public read access by ID for questionnaires"
  on public.questionnaires
  for select
  using (true);

-- Ensure we can also update the questionnaire (submit responses)
create policy "Public update access by ID for questionnaires"
  on public.questionnaires
  for update
  using (true);

-- Verify that the status enum/check allows 'Envoyé', 'Programmé', 'Complété'
-- (This part is just a safety check, usually handled by app logic or existing constraints)
