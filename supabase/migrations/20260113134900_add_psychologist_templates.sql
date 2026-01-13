-- Migration: Add Psychologist Questionnaire Templates
-- Date: 2026-01-13
-- Description: Insert 5 psychologist-specific questionnaire templates

-- 1. PSY - ANXIÉTÉ/STRESS - J+15
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Psy - Anxiété/Stress', 
  'Suivi pour troubles anxieux et gestion du stress. Envoi recommandé à J+15.',
  'Psychologie', 
  ARRAY['psy', 'anxiete', 'stress', 'angoisse', 'relaxation'],
  15,
  '[
    {"question": "Ressentez-vous une baisse de votre niveau d''anxiété ?", "type": "scale", "label1": "Inchangé", "label5": "Nettement diminué"},
    {"question": "Parvenez-vous à utiliser les outils vus en séance ?", "type": "scale", "label1": "Difficilement", "label5": "Facilement"},
    {"question": "La qualité de votre sommeil s''est-elle améliorée ?", "type": "scale", "label1": "Inchangée", "label5": "Très améliorée"},
    {"question": "Vous sentez-vous moins submergé par vos émotions ?", "type": "scale", "label1": "Toujours submergé", "label5": "Plus serein"},
    {"question": "Satisfaction globale concernant votre progression ?", "type": "scale", "label1": "Insatisfait", "label5": "Très satisfait"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Psy - Anxiété/Stress');

-- 2. PSY - DÉPRESSION/HUMEUR - J+30
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Psy - Dépression/Humeur', 
  'Suivi pour dépression et troubles de l''humeur. Envoi recommandé à J+30.',
  'Psychologie', 
  ARRAY['psy', 'depression', 'humeur', 'tristesse', 'motivation'],
  30,
  '[
    {"question": "Avez-vous retrouvé un peu d''énergie ou d''élan vital ?", "type": "scale", "label1": "Pas du tout", "label5": "Oui, nettement"},
    {"question": "Les pensées négatives sont-elles moins fréquentes ?", "type": "scale", "label1": "Toujours présentes", "label5": "Beaucoup moins"},
    {"question": "Parvenez-vous à accomplir vos tâches avec moins d''effort ?", "type": "scale", "label1": "Toujours difficile", "label5": "Plus facile"},
    {"question": "Vous sentez-vous soutenu et compris par le thérapeute ?", "type": "scale", "label1": "Pas du tout", "label5": "Totalement"},
    {"question": "Êtes-vous plus confiant en l''avenir ?", "type": "scale", "label1": "Pessimiste", "label5": "Plus confiant"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Psy - Dépression/Humeur');

-- 3. PSY - THÉRAPIE DE COUPLE - J+15
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Psy - Thérapie de Couple', 
  'Suivi pour thérapie de couple. Envoi recommandé à J+15.',
  'Psychologie', 
  ARRAY['psy', 'couple', 'relation', 'communication', 'conflit'],
  15,
  '[
    {"question": "La communication avec votre partenaire est-elle plus fluide ?", "type": "scale", "label1": "Inchangée", "label5": "Beaucoup plus fluide"},
    {"question": "L''intensité des conflits a-t-elle diminué ?", "type": "scale", "label1": "Inchangée", "label5": "Nettement diminuée"},
    {"question": "Avez-vous réussi à appliquer les conseils d''écoute ?", "type": "scale", "label1": "Pas du tout", "label5": "Oui, régulièrement"},
    {"question": "Comprenez-vous mieux les besoins de votre partenaire ?", "type": "scale", "label1": "Pas vraiment", "label5": "Beaucoup mieux"},
    {"question": "Gardez-vous espoir en l''amélioration de la relation ?", "type": "scale", "label1": "Pessimiste", "label5": "Très confiant"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Psy - Thérapie de Couple');

-- 4. PSY - BURNOUT/TRAVAIL - J+21
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Psy - Burnout/Travail', 
  'Suivi pour burnout et souffrance au travail. Envoi recommandé à J+21.',
  'Psychologie', 
  ARRAY['psy', 'burnout', 'travail', 'epuisement', 'stress-professionnel'],
  21,
  '[
    {"question": "Ressentez-vous une diminution de votre fatigue ?", "type": "scale", "label1": "Toujours épuisé", "label5": "Moins fatigué"},
    {"question": "Arrivez-vous à prendre de la distance avec le travail ?", "type": "scale", "label1": "Impossible", "label5": "Oui, facilement"},
    {"question": "Le sentiment de culpabilité a-t-il baissé ?", "type": "scale", "label1": "Toujours présent", "label5": "Nettement diminué"},
    {"question": "Votre sommeil est-il plus réparateur ?", "type": "scale", "label1": "Toujours perturbé", "label5": "Réparateur"},
    {"question": "Vous sentez-vous mieux armé pour envisager la suite ?", "type": "scale", "label1": "Pas du tout", "label5": "Oui, confiant"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Psy - Burnout/Travail');

-- 5. PSY - TRAUMATISME/EMDR - J+7
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Psy - Traumatisme/EMDR', 
  'Suivi post-séance EMDR ou travail sur traumatisme. Envoi recommandé à J+7.',
  'Psychologie', 
  ARRAY['psy', 'traumatisme', 'emdr', 'ptsd', 'flashback'],
  7,
  '[
    {"question": "Le souvenir travaillé vous parait-il plus lointain ?", "type": "scale", "label1": "Toujours vif", "label5": "Plus distant"},
    {"question": "L''intensité émotionnelle a-t-elle diminué ?", "type": "scale", "label1": "Toujours intense", "label5": "Nettement diminuée"},
    {"question": "Avez-vous fait moins de cauchemars ou flashbacks ?", "type": "scale", "label1": "Toujours fréquents", "label5": "Beaucoup moins"},
    {"question": "Vous êtes-vous senti en sécurité intérieurement ?", "type": "scale", "label1": "Pas du tout", "label5": "En sécurité"},
    {"question": "Comment évaluez-vous votre stabilité émotionnelle ?", "type": "scale", "label1": "Instable", "label5": "Stable"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Psy - Traumatisme/EMDR');

-- Verify insertions
SELECT name, category, suggested_delay_days FROM public.public_templates WHERE category = 'Psychologie';
