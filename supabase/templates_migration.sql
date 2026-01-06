-- Create questionnaire_templates table
CREATE TABLE IF NOT EXISTS public.questionnaire_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.questionnaire_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own templates"
    ON public.questionnaire_templates
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
    ON public.questionnaire_templates
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
    ON public.questionnaire_templates
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
    ON public.questionnaire_templates
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_questionnaire_templates_user_id ON public.questionnaire_templates(user_id);
