-- Migration: Add Nurse (Infirmier/ère) Questionnaire Templates
-- Date: 2026-03-13
-- Description: 3 questionnaire templates for nursing care (cabinet, domicile, post-op)

-- 1. INFIRMIER(E) - SOINS AU CABINET (Prise de sang, vaccin, petit soin) - J+1
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Infirmier(e) - Soins au cabinet', 
  'Questionnaire court pour les patients de passage (prise de sang, vaccin, pansement). Envoi recommandé à J+1.',
  'Soins infirmiers', 
  ARRAY['infirmier', 'infirmiere', 'cabinet', 'prise de sang', 'vaccin', 'pansement', 'soin'],
  1,
  '[
    {"question": "Comment évaluez-vous l''accueil et la bienveillance de votre infirmier(e) ?", "type": "scale", "label1": "Très décevant", "label5": "Excellent"},
    {"question": "Le soin (prise de sang, pansement...) a-t-il été réalisé avec douceur et professionnalisme ?", "type": "scale", "label1": "Pas du tout", "label5": "Parfaitement"},
    {"question": "Quel est votre niveau de satisfaction global suite à votre passage au cabinet ?", "type": "scale", "label1": "Très insatisfait", "label5": "Totalement satisfait"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Infirmier(e) - Soins au cabinet');

-- 2. INFIRMIER(E) - TOURNÉE À DOMICILE (Patients réguliers/chroniques) - J+7
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Infirmier(e) - Tournée à domicile', 
  'Questionnaire pour les patients réguliers à domicile (soins chroniques, suivis longs). Envoi recommandé à J+7.',
  'Soins infirmiers', 
  ARRAY['infirmier', 'infirmiere', 'domicile', 'tournee', 'chronique', 'suivi'],
  7,
  '[
    {"question": "Comment évaluez-vous la fiabilité et l''organisation lors des passages à votre domicile ?", "type": "scale", "label1": "À améliorer", "label5": "Impeccable"},
    {"question": "L''infirmier(e) prend-il/elle le temps d''être à votre écoute pendant les soins ?", "type": "scale", "label1": "Pas du tout", "label5": "Toujours"},
    {"question": "Les explications données sur votre traitement ou l''évolution de votre santé sont-elles claires ?", "type": "scale", "label1": "Très confuses", "label5": "Parfaitement claires"},
    {"question": "Recommanderiez-vous les services de cet/cette infirmier(e) à vos proches ?", "type": "scale", "label1": "Certainement pas", "label5": "Absolument"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Infirmier(e) - Tournée à domicile');

-- 3. INFIRMIER(E) - SOINS SPÉCIFIQUES / POST-OPÉRATOIRE (Ablation de fils, plaies complexes) - J+3
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Infirmier(e) - Soins post-opératoires', 
  'Questionnaire pour les soins techniques (ablation de fils, plaies complexes, post-chirurgie). Envoi recommandé à J+3.',
  'Soins infirmiers', 
  ARRAY['infirmier', 'infirmiere', 'post-operatoire', 'plaie', 'ablation', 'fils', 'chirurgie'],
  3,
  '[
    {"question": "Avez-vous trouvé que les règles d''hygiène et de sécurité étaient rigoureusement respectées ?", "type": "scale", "label1": "Pas du tout", "label5": "Totalement"},
    {"question": "L''infirmier(e) a-t-il/elle fait le maximum pour limiter votre douleur et assurer votre confort ?", "type": "scale", "label1": "Pas vraiment", "label5": "Absolument"},
    {"question": "Avez-vous reçu des conseils clairs sur les précautions à prendre après le soin ?", "type": "scale", "label1": "Aucun conseil", "label5": "Conseils très précis"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Infirmier(e) - Soins post-opératoires');

-- Verify insertions
SELECT name, category, suggested_delay_days, jsonb_array_length(questions) as nb_questions 
FROM public.public_templates 
WHERE category = 'Soins infirmiers';
