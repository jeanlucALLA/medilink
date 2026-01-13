-- Migration: Add Osteopathy Questionnaire Templates
-- Date: 2026-01-13
-- Description: Insert 5 osteopathy-specific questionnaire templates for osteopaths

-- Add suggested_delay_days column if it doesn't exist
ALTER TABLE public.public_templates 
ADD COLUMN IF NOT EXISTS suggested_delay_days INTEGER DEFAULT 7;

-- 1. OSTÉO - LUMBAGO (DOS) - J+7
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Ostéo - Lumbago (Dos)', 
  'Suivi post-consultation pour les douleurs lombaires et lumbago. Envoi recommandé à J+7.',
  'Ostéopathie', 
  ARRAY['osteopathe', 'lumbago', 'dos', 'lombaire', 'douleur'],
  7,
  '[
    {"question": "Comment évaluez-vous l''amélioration de votre douleur lombaire aujourd''hui ?", "type": "scale", "label1": "Aucune amélioration", "label5": "Douleur disparue"},
    {"question": "Avez-vous retrouvé votre mobilité pour vous baisser ou vous tourner ?", "type": "scale", "label1": "Très limité", "label5": "Mobilité normale"},
    {"question": "La qualité de votre sommeil s''est-elle améliorée ?", "type": "scale", "label1": "Pas du tout", "label5": "Nettement mieux"},
    {"question": "Avez-vous pu reprendre vos activités quotidiennes normalement ?", "type": "scale", "label1": "Non, impossible", "label5": "Oui, totalement"},
    {"question": "Quelle est votre satisfaction globale sur la prise en charge ?", "type": "scale", "label1": "Insatisfait", "label5": "Très satisfait"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Ostéo - Lumbago (Dos)');

-- 2. OSTÉO - CERVICALGIE (COU) - J+7
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Ostéo - Cervicalgie (Cou)', 
  'Suivi post-consultation pour les douleurs cervicales et tensions du cou. Envoi recommandé à J+7.',
  'Ostéopathie', 
  ARRAY['osteopathe', 'cervicalgie', 'cou', 'nuque', 'torticolis'],
  7,
  '[
    {"question": "Avez-vous retrouvé une amplitude normale pour tourner la tête ?", "type": "scale", "label1": "Très limité", "label5": "Mobilité normale"},
    {"question": "L''intensité de la douleur cervicale a-t-elle diminué ?", "type": "scale", "label1": "Pas du tout", "label5": "Douleur disparue"},
    {"question": "Si vous aviez des maux de tête, ont-ils disparu ?", "type": "scale", "label1": "Toujours présents", "label5": "Totalement disparus"},
    {"question": "Ressentez-vous moins de tensions aux épaules ?", "type": "scale", "label1": "Pas du tout", "label5": "Nettement mieux"},
    {"question": "Globalement, comment jugez-vous l''efficacité de la séance ?", "type": "scale", "label1": "Inefficace", "label5": "Très efficace"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Ostéo - Cervicalgie (Cou)');

-- 3. OSTÉO - SCIATIQUE - J+15
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Ostéo - Sciatique', 
  'Suivi post-consultation pour les sciatiques et névralgies. Envoi recommandé à J+15.',
  'Ostéopathie', 
  ARRAY['osteopathe', 'sciatique', 'nevralgie', 'jambe', 'nerf'],
  15,
  '[
    {"question": "La douleur qui descendait dans la jambe a-t-elle diminué ?", "type": "scale", "label1": "Pas du tout", "label5": "Totalement disparue"},
    {"question": "La douleur est-elle moins fréquente dans la journée ?", "type": "scale", "label1": "Constante", "label5": "Très rare"},
    {"question": "Pouvez-vous marcher plus longtemps sans déclencher la douleur ?", "type": "scale", "label1": "Non, limité", "label5": "Oui, marche normale"},
    {"question": "Avez-vous trouvé une position confortable pour dormir ?", "type": "scale", "label1": "Pas du tout", "label5": "Oui, facilement"},
    {"question": "Diriez-vous que votre état s''est nettement amélioré ?", "type": "scale", "label1": "Non", "label5": "Oui, nettement"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Ostéo - Sciatique');

-- 4. OSTÉO - VISCÉRAL/DIGESTIF - J+7
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Ostéo - Viscéral/Digestif', 
  'Suivi post-consultation pour les troubles digestifs et viscéraux. Envoi recommandé à J+7.',
  'Ostéopathie', 
  ARRAY['osteopathe', 'visceral', 'digestif', 'ballonnement', 'transit'],
  7,
  '[
    {"question": "Ressentez-vous une diminution des ballonnements ?", "type": "scale", "label1": "Pas du tout", "label5": "Totalement disparus"},
    {"question": "Votre transit ou digestion se sont-ils améliorés ?", "type": "scale", "label1": "Aucun changement", "label5": "Nettement mieux"},
    {"question": "Ressentez-vous une sensation de légèreté générale ?", "type": "scale", "label1": "Non", "label5": "Oui, très léger"},
    {"question": "Votre niveau de stress a-t-il diminué ?", "type": "scale", "label1": "Pas du tout", "label5": "Beaucoup moins stressé"},
    {"question": "Recommanderiez-vous l''ostéopathie pour ce problème ?", "type": "scale", "label1": "Non", "label5": "Oui, absolument"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Ostéo - Viscéral/Digestif');

-- 5. OSTÉO - BILAN PRÉVENTIF - J+1
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Ostéo - Bilan Préventif', 
  'Suivi rapide après un bilan ostéopathique préventif. Envoi recommandé à J+1.',
  'Ostéopathie', 
  ARRAY['osteopathe', 'bilan', 'preventif', 'controle', 'entretien'],
  1,
  '[
    {"question": "Comment vous sentez-vous ce matin (sensation d''énergie) ?", "type": "scale", "label1": "Fatigué", "label5": "Plein d''énergie"},
    {"question": "Avez-vous bien dormi la nuit suivant la consultation ?", "type": "scale", "label1": "Très mal", "label5": "Excellente nuit"},
    {"question": "Les explications données étaient-elles claires ?", "type": "scale", "label1": "Pas claires", "label5": "Parfaitement claires"},
    {"question": "L''accueil et la ponctualité étaient-ils satisfaisants ?", "type": "scale", "label1": "Insatisfaisant", "label5": "Excellent"},
    {"question": "Avez-vous l''impression que votre corps est plus libre ?", "type": "scale", "label1": "Pas du tout", "label5": "Oui, très libre"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Ostéo - Bilan Préventif');

-- Verify insertions
SELECT name, category, suggested_delay_days FROM public.public_templates WHERE category = 'Ostéopathie';
