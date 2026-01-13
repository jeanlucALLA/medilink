-- Migration: Add Sports Medicine Questionnaire Templates
-- Date: 2026-01-13
-- Description: Insert 5 sports medicine-specific questionnaire templates

-- 1. MÉD. SPORT - LÉSION MUSCULAIRE - J+15
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Méd. Sport - Lésion Musculaire', 
  'Suivi post-lésion musculaire (claquage, élongation). Envoi recommandé à J+15.',
  'Médecine du Sport', 
  ARRAY['sport', 'muscle', 'claquage', 'elongation', 'dechirure'],
  15,
  '[
    {"question": "La douleur brutale de la blessure a-t-elle disparu ?", "type": "scale", "label1": "Toujours présente", "label5": "Totalement disparu"},
    {"question": "Avez-vous pu commencer la rééducation sans gêne ?", "type": "scale", "label1": "Très difficile", "label5": "Sans problème"},
    {"question": "L''hématome ou le gonflement ont-ils disparu ?", "type": "scale", "label1": "Toujours présent", "label5": "Totalement résorbé"},
    {"question": "Sentez-vous une reprise de confiance dans le muscle ?", "type": "scale", "label1": "Pas confiant", "label5": "Pleine confiance"},
    {"question": "Satisfaction sur le protocole de soins ?", "type": "scale", "label1": "Insatisfait", "label5": "Très satisfait"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Méd. Sport - Lésion Musculaire');

-- 2. MÉD. SPORT - TENDINOPATHIE - J+30
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Méd. Sport - Tendinopathie', 
  'Suivi tendinopathie (tendinite, tendinose). Envoi recommandé à J+30.',
  'Médecine du Sport', 
  ARRAY['sport', 'tendon', 'tendinite', 'achille', 'rotulien'],
  30,
  '[
    {"question": "Ressentez-vous une diminution de la raideur matinale ?", "type": "scale", "label1": "Toujours raide", "label5": "Plus de raideur"},
    {"question": "La douleur pendant l''effort a-t-elle diminué ?", "type": "scale", "label1": "Inchangée", "label5": "Nettement diminuée"},
    {"question": "Avez-vous réussi à adapter votre pratique sportive ?", "type": "scale", "label1": "Impossible", "label5": "Bien adapté"},
    {"question": "Supportez-vous bien le traitement (ondes de choc/exos) ?", "type": "scale", "label1": "Mal supporté", "label5": "Très bien supporté"},
    {"question": "Êtes-vous confiant pour une guérison prochaine ?", "type": "scale", "label1": "Pessimiste", "label5": "Très confiant"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Méd. Sport - Tendinopathie');

-- 3. MÉD. SPORT - ENTORSE - J+10
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Méd. Sport - Entorse', 
  'Suivi post-entorse (cheville, genou, poignet). Envoi recommandé à J+10.',
  'Médecine du Sport', 
  ARRAY['sport', 'entorse', 'cheville', 'ligament', 'trauma'],
  10,
  '[
    {"question": "Votre articulation a-t-elle dégonflé ?", "type": "scale", "label1": "Toujours gonflée", "label5": "Totalement dégonflée"},
    {"question": "Pouvez-vous mettre du poids dessus sans douleur ?", "type": "scale", "label1": "Très douloureux", "label5": "Sans douleur"},
    {"question": "Avez-vous bien compris le protocole (Glace, Repos...) ?", "type": "scale", "label1": "Pas clair", "label5": "Parfaitement compris"},
    {"question": "Sentez-vous une stabilité satisfaisante ?", "type": "scale", "label1": "Instable", "label5": "Stable"},
    {"question": "La prise en charge de la douleur a-t-elle été efficace ?", "type": "scale", "label1": "Inefficace", "label5": "Très efficace"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Méd. Sport - Entorse');

-- 4. MÉD. SPORT - CERTIFICAT/VISITE - J+1
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Méd. Sport - Certificat/Visite', 
  'Suivi rapide après visite de non contre-indication. Envoi recommandé à J+1.',
  'Médecine du Sport', 
  ARRAY['sport', 'certificat', 'visite', 'aptitude', 'prevention'],
  1,
  '[
    {"question": "L''examen médical vous a-t-il semblé complet et sérieux ?", "type": "scale", "label1": "Superficiel", "label5": "Très complet"},
    {"question": "Les conseils de prévention étaient-ils utiles ?", "type": "scale", "label1": "Peu utiles", "label5": "Très utiles"},
    {"question": "Le praticien a-t-il répondu à vos questions ?", "type": "scale", "label1": "Non", "label5": "Oui, totalement"},
    {"question": "L''accueil et la ponctualité étaient-ils satisfaisants ?", "type": "scale", "label1": "Insatisfaisant", "label5": "Excellent"},
    {"question": "Recommanderiez-vous ce médecin pour un suivi sportif ?", "type": "scale", "label1": "Non", "label5": "Oui, absolument"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Méd. Sport - Certificat/Visite');

-- 5. MÉD. SPORT - COMMOTION CÉRÉBRALE - J+5
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Méd. Sport - Commotion Cérébrale', 
  'Suivi post-commotion cérébrale. Envoi recommandé à J+5.',
  'Médecine du Sport', 
  ARRAY['sport', 'commotion', 'cerebrale', 'trauma-cranien', 'rugby'],
  5,
  '[
    {"question": "Les maux de tête ont-ils complètement disparu ?", "type": "scale", "label1": "Toujours présents", "label5": "Totalement disparus"},
    {"question": "Supportez-vous bien la lumière et les écrans ?", "type": "scale", "label1": "Très sensible", "label5": "Aucune gêne"},
    {"question": "Avez-vous retrouvé une concentration normale ?", "type": "scale", "label1": "Difficile", "label5": "Concentration normale"},
    {"question": "Votre sommeil est-il revenu à la normale ?", "type": "scale", "label1": "Perturbé", "label5": "Normal"},
    {"question": "Avez-vous compris les paliers de reprise progressive ?", "type": "scale", "label1": "Pas clair", "label5": "Parfaitement compris"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Méd. Sport - Commotion Cérébrale');

-- Verify insertions
SELECT name, category, suggested_delay_days FROM public.public_templates WHERE category = 'Médecine du Sport';
