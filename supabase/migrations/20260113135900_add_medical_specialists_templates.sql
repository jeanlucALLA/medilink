-- Migration: Add Medical Specialists Questionnaire Templates
-- Date: 2026-01-13
-- Description: Insert 5 medical specialist-specific questionnaire templates

-- 1. DERMATOLOGUE - ACNÉ/ECZÉMA - J+30
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Dermatologue - Acné/Eczéma', 
  'Suivi traitement dermatologique (acné, eczéma, psoriasis). Envoi recommandé à J+30.',
  'Dermatologie', 
  ARRAY['dermatologue', 'acne', 'eczema', 'peau', 'traitement'],
  30,
  '[
    {"question": "L''aspect de vos lésions s''est-il visiblement amélioré ?", "type": "scale", "label1": "Inchangé", "label5": "Très amélioré"},
    {"question": "La sécheresse cutanée est-elle supportable ?", "type": "scale", "label1": "Très gênante", "label5": "Supportable"},
    {"question": "L''impact sur votre moral a-t-il diminué ?", "type": "scale", "label1": "Toujours impacté", "label5": "Moral amélioré"},
    {"question": "Parvenez-vous à suivre la routine de soins quotidiennement ?", "type": "scale", "label1": "Difficile", "label5": "Sans problème"},
    {"question": "Satisfaction globale sur l''efficacité du traitement ?", "type": "scale", "label1": "Insatisfait", "label5": "Très satisfait"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Dermatologue - Acné/Eczéma');

-- 2. OPHTALMOLOGUE - CHIRURGIE YEUX - J+15
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Ophtalmologue - Chirurgie Yeux', 
  'Suivi post-chirurgie réfractive (LASIK, PKR). Envoi recommandé à J+15.',
  'Ophtalmologie', 
  ARRAY['ophtalmologue', 'lasik', 'chirurgie', 'yeux', 'myopie'],
  15,
  '[
    {"question": "Votre vision de loin est-elle devenue nette ?", "type": "scale", "label1": "Floue", "label5": "Parfaitement nette"},
    {"question": "Êtes-vous gêné par des halos lumineux la nuit ?", "type": "scale", "label1": "Très gêné", "label5": "Aucune gêne"},
    {"question": "La sensation de sécheresse oculaire a-t-elle disparu ?", "type": "scale", "label1": "Toujours présente", "label5": "Disparu"},
    {"question": "Avez-vous pu reprendre vos activités normalement ?", "type": "scale", "label1": "Encore limité", "label5": "Activité normale"},
    {"question": "Êtes-vous satisfait du résultat visuel ?", "type": "scale", "label1": "Insatisfait", "label5": "Très satisfait"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Ophtalmologue - Chirurgie Yeux');

-- 3. GASTRO - DIGESTIF/REFLUX - J+21
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Gastro - Digestif/Reflux', 
  'Suivi pour troubles digestifs et reflux gastrique. Envoi recommandé à J+21.',
  'Gastro-entérologie', 
  ARRAY['gastro', 'digestif', 'reflux', 'estomac', 'intestin'],
  21,
  '[
    {"question": "L''intensité des douleurs abdominales a-t-elle diminué ?", "type": "scale", "label1": "Inchangée", "label5": "Nettement diminuée"},
    {"question": "Votre confort digestif s''est-il amélioré ?", "type": "scale", "label1": "Inchangé", "label5": "Très amélioré"},
    {"question": "Le traitement est-il bien toléré ?", "type": "scale", "label1": "Mal toléré", "label5": "Très bien toléré"},
    {"question": "Avez-vous réussi à appliquer les conseils diététiques ?", "type": "scale", "label1": "Difficile", "label5": "Facilement"},
    {"question": "Votre qualité de vie s''est-elle améliorée ?", "type": "scale", "label1": "Inchangée", "label5": "Très améliorée"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Gastro - Digestif/Reflux');

-- 4. ORL - NEZ/SINUS/SOMMEIL - J+30
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'ORL - Nez/Sinus/Sommeil', 
  'Suivi post-intervention ORL (septoplastie, sinus, apnée). Envoi recommandé à J+30.',
  'ORL', 
  ARRAY['orl', 'nez', 'sinus', 'sommeil', 'apnee'],
  30,
  '[
    {"question": "Votre respiration nasale est-elle plus libre ?", "type": "scale", "label1": "Toujours obstruée", "label5": "Très libre"},
    {"question": "La qualité de votre sommeil s''est-elle améliorée ?", "type": "scale", "label1": "Inchangée", "label5": "Nettement améliorée"},
    {"question": "Les douleurs ou maux de tête ont-ils disparu ?", "type": "scale", "label1": "Toujours présents", "label5": "Disparus"},
    {"question": "Avez-vous retrouvé un odorat normal ?", "type": "scale", "label1": "Toujours altéré", "label5": "Odorat normal"},
    {"question": "Recommanderiez-vous cette intervention ?", "type": "scale", "label1": "Non", "label5": "Oui, absolument"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'ORL - Nez/Sinus/Sommeil');

-- 5. CARDIOLOGUE - HYPERTENSION - J+15
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Cardiologue - Hypertension', 
  'Suivi de traitement antihypertenseur. Envoi recommandé à J+15.',
  'Cardiologie', 
  ARRAY['cardiologue', 'hypertension', 'tension', 'coeur', 'traitement'],
  15,
  '[
    {"question": "Vos mesures de tension sont-elles stables ?", "type": "scale", "label1": "Très variables", "label5": "Stables"},
    {"question": "Ressentez-vous une fatigue inhabituelle ?", "type": "scale", "label1": "Oui, très fatigué", "label5": "Non, en forme"},
    {"question": "Êtes-vous moins essoufflé lors de l''effort ?", "type": "scale", "label1": "Toujours essoufflé", "label5": "Plus du tout"},
    {"question": "Avez-vous oublié votre médicament cette semaine ?", "type": "scale", "label1": "Oui, souvent", "label5": "Non, jamais"},
    {"question": "Vous sentez-vous rassuré concernant votre santé cardiaque ?", "type": "scale", "label1": "Inquiet", "label5": "Très rassuré"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Cardiologue - Hypertension');

-- Verify insertions
SELECT name, category, suggested_delay_days FROM public.public_templates 
WHERE category IN ('Dermatologie', 'Ophtalmologie', 'Gastro-entérologie', 'ORL', 'Cardiologie');
