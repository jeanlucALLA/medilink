-- Migration: Add Orthopedic Surgeon Questionnaire Templates
-- Date: 2026-01-13
-- Description: Insert 5 orthopedic surgery-specific questionnaire templates

-- 1. ORTHO - PROTHÈSE HANCHE/GENOU - J+45
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Ortho - Prothèse Hanche/Genou', 
  'Suivi post-arthroplastie de hanche ou genou. Envoi recommandé à J+45.',
  'Chirurgie Orthopédique', 
  ARRAY['ortho', 'prothese', 'hanche', 'genou', 'arthroplastie'],
  45,
  '[
    {"question": "La douleur articulaire d''avant l''opération a-t-elle disparu ?", "type": "scale", "label1": "Toujours présente", "label5": "Totalement disparu"},
    {"question": "Avez-vous pu abandonner vos cannes/béquilles ?", "type": "scale", "label1": "Toujours nécessaires", "label5": "Abandonné totalement"},
    {"question": "La cicatrice est-elle propre et indolore ?", "type": "scale", "label1": "Problématique", "label5": "Parfaitement cicatrisée"},
    {"question": "Parvenez-vous à monter/descendre les escaliers facilement ?", "type": "scale", "label1": "Très difficile", "label5": "Sans difficulté"},
    {"question": "Votre périmètre de marche a-t-il augmenté ?", "type": "scale", "label1": "Limité", "label5": "Nettement augmenté"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Ortho - Prothèse Hanche/Genou');

-- 2. ORTHO - ARTHROSCOPIE GENOU - J+21
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Ortho - Arthroscopie Genou', 
  'Suivi post-arthroscopie du genou. Envoi recommandé à J+21.',
  'Chirurgie Orthopédique', 
  ARRAY['ortho', 'arthroscopie', 'genou', 'menisque', 'ligament'],
  21,
  '[
    {"question": "Votre genou est-il dégonflé (absence d''œdème) ?", "type": "scale", "label1": "Toujours gonflé", "label5": "Totalement dégonflé"},
    {"question": "Ressentez-vous une stabilité satisfaisante à l''appui ?", "type": "scale", "label1": "Instable", "label5": "Très stable"},
    {"question": "Avez-vous retrouvé une amplitude correcte (plier/tendre) ?", "type": "scale", "label1": "Très limité", "label5": "Amplitude normale"},
    {"question": "Avez-vous pu arrêter totalement les anti-douleurs ?", "type": "scale", "label1": "Toujours nécessaires", "label5": "Arrêté totalement"},
    {"question": "Êtes-vous satisfait du résultat fonctionnel ?", "type": "scale", "label1": "Insatisfait", "label5": "Très satisfait"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Ortho - Arthroscopie Genou');

-- 3. ORTHO - CANAL CARPIEN - J+15
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Ortho - Canal Carpien', 
  'Suivi post-opération du canal carpien. Envoi recommandé à J+15.',
  'Chirurgie Orthopédique', 
  ARRAY['ortho', 'canal-carpien', 'main', 'poignet', 'nerf'],
  15,
  '[
    {"question": "Les fourmillements nocturnes ont-ils disparu ?", "type": "scale", "label1": "Toujours présents", "label5": "Totalement disparus"},
    {"question": "La cicatrice dans la paume est-elle peu sensible ?", "type": "scale", "label1": "Très sensible", "label5": "Indolore"},
    {"question": "Avez-vous récupéré la force de préhension ?", "type": "scale", "label1": "Très faible", "label5": "Force normale"},
    {"question": "Pouvez-vous réaliser des gestes fins (boutons, écriture) ?", "type": "scale", "label1": "Très difficile", "label5": "Sans problème"},
    {"question": "Quelle est votre satisfaction globale ?", "type": "scale", "label1": "Insatisfait", "label5": "Très satisfait"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Ortho - Canal Carpien');

-- 4. ORTHO - HALLUX VALGUS (PIED) - J+45
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Ortho - Hallux Valgus (Pied)', 
  'Suivi post-chirurgie de l''hallux valgus. Envoi recommandé à J+45.',
  'Chirurgie Orthopédique', 
  ARRAY['ortho', 'hallux-valgus', 'pied', 'orteil', 'oignon'],
  45,
  '[
    {"question": "L''alignement de votre orteil vous satisfait-il ?", "type": "scale", "label1": "Insatisfait", "label5": "Très satisfait"},
    {"question": "Pouvez-vous marcher sans douleur à l''appui ?", "type": "scale", "label1": "Douloureux", "label5": "Sans douleur"},
    {"question": "Le gonflement du pied a-t-il disparu ?", "type": "scale", "label1": "Toujours gonflé", "label5": "Totalement résorbé"},
    {"question": "Avez-vous pu reprendre des chaussures classiques ?", "type": "scale", "label1": "Impossible", "label5": "Oui, facilement"},
    {"question": "Recommanderiez-vous cette intervention ?", "type": "scale", "label1": "Non", "label5": "Oui, absolument"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Ortho - Hallux Valgus (Pied)');

-- 5. ORTHO - ÉPAULE/COIFFE - J+30
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Ortho - Épaule/Coiffe', 
  'Suivi post-chirurgie de l''épaule ou coiffe des rotateurs. Envoi recommandé à J+30.',
  'Chirurgie Orthopédique', 
  ARRAY['ortho', 'epaule', 'coiffe', 'rotateurs', 'tendon'],
  30,
  '[
    {"question": "Parvenez-vous à dormir confortablement ?", "type": "scale", "label1": "Très difficile", "label5": "Confortable"},
    {"question": "La douleur au repos (bras ballant) a-t-elle disparu ?", "type": "scale", "label1": "Toujours présente", "label5": "Totalement disparu"},
    {"question": "Sentez-vous des progrès grâce à la rééducation ?", "type": "scale", "label1": "Aucun progrès", "label5": "Nets progrès"},
    {"question": "La cicatrice est-elle souple et indolore ?", "type": "scale", "label1": "Problématique", "label5": "Parfaite"},
    {"question": "Comment jugez-vous votre récupération globale ?", "type": "scale", "label1": "Insuffisante", "label5": "Excellente"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Ortho - Épaule/Coiffe');

-- Verify insertions
SELECT name, category, suggested_delay_days FROM public.public_templates WHERE category = 'Chirurgie Orthopédique';
