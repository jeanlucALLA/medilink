-- Drop previous versions to ensure clean schema (Fix for "column name does not exist")
DROP TABLE IF EXISTS public.public_template_questions CASCADE;
DROP TABLE IF EXISTS public.public_templates CASCADE;

-- Ensure public_templates table exists
CREATE TABLE IF NOT EXISTS public.public_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[], -- Array of strings for hashtags
  questions JSONB DEFAULT '[]'::JSONB, -- JSONB storage for questions
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.public_templates ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone (public library)
CREATE POLICY "Public templates are viewable by everyone" 
ON public.public_templates FOR SELECT 
USING (true);

-- Ensure public_template_questions table exists (for normalized storage if needed)
CREATE TABLE IF NOT EXISTS public.public_template_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES public.public_templates(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  type TEXT DEFAULT 'scale',
  label1 TEXT,
  label5 TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.public_template_questions ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Public template questions are viewable by everyone" 
ON public.public_template_questions FOR SELECT 
USING (true);

-- Allow insert/update only for admins (handled via app logic or more restrictive RLS if user roles existed)
-- For now, we rely on the app to restrict writing found in the dashboard logic.
CREATE POLICY "Admins can insert template questions"
ON public.public_template_questions FOR INSERT
WITH CHECK (true); -- Ideally restrict to specific user IDs if possible in RLS, but app-level check is first defense.

-- Update public_templates policy to allow insert
CREATE POLICY "Admins can insert templates"
ON public.public_templates FOR INSERT
WITH CHECK (true);

-- Insert sample data if empty
INSERT INTO public.public_templates (name, description, category, tags, questions)
SELECT 
  'Bilan Podologique Standard', 
  'Questionnaire complet pour un premier bilan podologique.', 
  'Podologie', 
  ARRAY['podologue', 'bilan', 'standard'],
  '[
    {"question": "Motif de la consultation ?", "type": "text"},
    {"question": "Douleur sur une échelle de 1 à 10 ?", "type": "scale", "label1": "Aucune", "label5": "Insupportable"},
    {"question": "Antécédents médicaux pertinents ?", "type": "text"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Bilan Podologique Standard');

INSERT INTO public.public_templates (name, description, category, tags, questions)
SELECT 
  'Suivi Kiné Genou', 
  'Évaluation de la progression pour la rééducation du genou.', 
  'Kinésithérapie', 
  ARRAY['kine', 'genou', 'reeducation'],
  '[
    {"question": "Niveau de mobilité ?", "type": "scale", "label1": "Bloqué", "label5": "Libre"},
    {"question": "Douleur à l''effort ?", "type": "scale", "label1": "Aucune", "label5": "Forte"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Suivi Kiné Genou');
