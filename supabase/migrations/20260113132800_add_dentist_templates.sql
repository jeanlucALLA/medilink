-- Migration: Add Dentist Questionnaire Templates
-- Date: 2026-01-13
-- Description: Insert 5 dentist-specific questionnaire templates for chirurgiens-dentistes

-- 1. DENTISTE - DÉTARTRAGE - J+3
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Dentiste - Détartrage', 
  'Suivi post-détartrage et polissage dentaire. Envoi recommandé à J+3.',
  'Dentiste', 
  ARRAY['dentiste', 'detartrage', 'hygiene', 'gencive', 'polissage'],
  3,
  '[
    {"question": "La sensibilité au chaud/froid a-t-elle complètement disparu ?", "type": "scale", "label1": "Toujours sensible", "label5": "Disparu totalement"},
    {"question": "Ressentez-vous cette sensation de dents lisses et propres ?", "type": "scale", "label1": "Pas du tout", "label5": "Oui, parfaitement"},
    {"question": "Vos gencives ont-elles arrêté de saigner lors du brossage ?", "type": "scale", "label1": "Saignent encore", "label5": "Plus de saignement"},
    {"question": "Les conseils de brossage vous semblent-ils applicables ?", "type": "scale", "label1": "Difficiles", "label5": "Faciles à suivre"},
    {"question": "Satisfaction globale sur la douceur du soin ?", "type": "scale", "label1": "Désagréable", "label5": "Très doux"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Dentiste - Détartrage');

-- 2. DENTISTE - SOIN CARIE - J+7
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Dentiste - Soin Carie', 
  'Suivi post-soin conservative (composite, amalgame). Envoi recommandé à J+7.',
  'Dentiste', 
  ARRAY['dentiste', 'carie', 'composite', 'obturation', 'restauration'],
  7,
  '[
    {"question": "Ressentez-vous une gêne à la fermeture (sensation de surépaisseur) ?", "type": "scale", "label1": "Oui, très gênant", "label5": "Non, aucune gêne"},
    {"question": "La dent soignée est-elle sensible au froid ou au sucre ?", "type": "scale", "label1": "Très sensible", "label5": "Aucune sensibilité"},
    {"question": "Le point de contact (passage du fil) vous semble-t-il correct ?", "type": "scale", "label1": "Problématique", "label5": "Parfait"},
    {"question": "L''esthétique de la réparation vous convient-elle ?", "type": "scale", "label1": "Insatisfait", "label5": "Très satisfait"},
    {"question": "Êtes-vous satisfait du confort de mastication ?", "type": "scale", "label1": "Inconfortable", "label5": "Parfaitement confortable"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Dentiste - Soin Carie');

-- 3. DENTISTE - EXTRACTION - J+7
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Dentiste - Extraction', 
  'Suivi post-extraction dentaire. Envoi recommandé à J+7.',
  'Dentiste', 
  ARRAY['dentiste', 'extraction', 'chirurgie', 'cicatrisation', 'dent-sagesse'],
  7,
  '[
    {"question": "La douleur post-opératoire a-t-elle progressivement disparu ?", "type": "scale", "label1": "Douleur persistante", "label5": "Totalement disparu"},
    {"question": "L''aspect de la gencive vous semble-t-il sain ?", "type": "scale", "label1": "Préoccupant", "label5": "Parfaitement sain"},
    {"question": "Avez-vous réussi à reprendre une alimentation normale ?", "type": "scale", "label1": "Encore limité", "label5": "Alimentation normale"},
    {"question": "Les conseils post-opératoires ont-ils été utiles ?", "type": "scale", "label1": "Peu utiles", "label5": "Très utiles"},
    {"question": "Évaluation de la prise en charge douleur pendant l''acte ?", "type": "scale", "label1": "Douloureuse", "label5": "Indolore"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Dentiste - Extraction');

-- 4. DENTISTE - PROTHÈSE/COURONNE - J+15
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Dentiste - Prothèse/Couronne', 
  'Suivi après pose de couronne ou prothèse fixe. Envoi recommandé à J+15.',
  'Dentiste', 
  ARRAY['dentiste', 'prothese', 'couronne', 'ceramique', 'bridge'],
  15,
  '[
    {"question": "Avez-vous oublié la présence de la couronne (sensation naturelle) ?", "type": "scale", "label1": "Très conscient", "label5": "Totalement naturelle"},
    {"question": "L''esthétique s''intègre-t-elle bien avec vos autres dents ?", "type": "scale", "label1": "Décalage visible", "label5": "Intégration parfaite"},
    {"question": "Ressentez-vous une gêne de la gencive autour de la couronne ?", "type": "scale", "label1": "Oui, irritation", "label5": "Non, aucune gêne"},
    {"question": "La mastication est-elle confortable et efficace ?", "type": "scale", "label1": "Inconfortable", "label5": "Parfaitement efficace"},
    {"question": "Recommanderiez-vous ce praticien pour des prothèses ?", "type": "scale", "label1": "Non", "label5": "Oui, absolument"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Dentiste - Prothèse/Couronne');

-- 5. DENTISTE - URGENCE - J+1
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Dentiste - Urgence', 
  'Suivi rapide après consultation d''urgence dentaire. Envoi recommandé à J+1.',
  'Dentiste', 
  ARRAY['dentiste', 'urgence', 'douleur', 'abces', 'trauma'],
  1,
  '[
    {"question": "Le soulagement de la douleur a-t-il été rapide ?", "type": "scale", "label1": "Douleur persistante", "label5": "Soulagement immédiat"},
    {"question": "Réactivité du cabinet pour le rendez-vous ?", "type": "scale", "label1": "Lent", "label5": "Très réactif"},
    {"question": "Vous êtes-vous senti écouté et rassuré ?", "type": "scale", "label1": "Pas du tout", "label5": "Très rassuré"},
    {"question": "Les explications sur la suite sont-elles claires ?", "type": "scale", "label1": "Confuses", "label5": "Parfaitement claires"},
    {"question": "Satisfaction globale sur la gestion de l''urgence ?", "type": "scale", "label1": "Insatisfait", "label5": "Très satisfait"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Dentiste - Urgence');

-- Verify insertions
SELECT name, category, suggested_delay_days FROM public.public_templates WHERE category = 'Dentiste';
