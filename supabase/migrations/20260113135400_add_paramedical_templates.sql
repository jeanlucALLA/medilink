-- Migration: Add Paramedical Questionnaire Templates
-- Date: 2026-01-13
-- Description: Insert 5 paramedical-specific questionnaire templates (diverse professions)

-- 1. DIÉTÉTICIEN - PERTE DE POIDS - J+15
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Diététicien - Perte de Poids', 
  'Suivi pour programme de perte de poids et rééquilibrage alimentaire. Envoi recommandé à J+15.',
  'Diététique', 
  ARRAY['dieteticien', 'nutrition', 'poids', 'regime', 'alimentation'],
  15,
  '[
    {"question": "Ressentez-vous une sensation de faim excessive ?", "type": "scale", "label1": "Oui, souvent", "label5": "Non, jamais"},
    {"question": "Avez-vous réussi à intégrer les nouvelles habitudes ?", "type": "scale", "label1": "Difficile", "label5": "Facilement"},
    {"question": "Comment évaluez-vous votre niveau d''énergie ?", "type": "scale", "label1": "Fatigué", "label5": "Plein d''énergie"},
    {"question": "Êtes-vous satisfait de l''évolution de votre silhouette ?", "type": "scale", "label1": "Insatisfait", "label5": "Très satisfait"},
    {"question": "Votre niveau de motivation est-il toujours élevé ?", "type": "scale", "label1": "Démotivé", "label5": "Très motivé"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Diététicien - Perte de Poids');

-- 2. SAGE-FEMME - POST-PARTUM - J+10
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Sage-Femme - Post-Partum', 
  'Suivi post-accouchement pour la mère et le bébé. Envoi recommandé à J+10.',
  'Sage-Femme', 
  ARRAY['sage-femme', 'post-partum', 'accouchement', 'maternite', 'allaitement'],
  10,
  '[
    {"question": "Comment se passe la cicatrisation (épisio/césarienne) ?", "type": "scale", "label1": "Problématique", "label5": "Très bien"},
    {"question": "Comment évaluez-vous votre moral actuel ?", "type": "scale", "label1": "Difficile", "label5": "Très bon"},
    {"question": "L''alimentation du bébé se passe-t-elle sereinement ?", "type": "scale", "label1": "Difficile", "label5": "Sereinement"},
    {"question": "Parvenez-vous à récupérer un peu de sommeil ?", "type": "scale", "label1": "Épuisée", "label5": "Récupère bien"},
    {"question": "Vous sentez-vous suffisamment entourée et soutenue ?", "type": "scale", "label1": "Isolée", "label5": "Bien soutenue"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Sage-Femme - Post-Partum');

-- 3. AUDIOPROTHÉSISTE - ESSAI APPAREIL - J+15
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Audioprothésiste - Essai Appareil', 
  'Suivi après essai d''appareil auditif. Envoi recommandé à J+15.',
  'Audioprothèse', 
  ARRAY['audioprothesiste', 'appareil', 'audition', 'surdite', 'prothese'],
  15,
  '[
    {"question": "Le confort physique de l''appareil est-il satisfaisant ?", "type": "scale", "label1": "Inconfortable", "label5": "Très confortable"},
    {"question": "Comprenez-vous bien les conversations dans le bruit ?", "type": "scale", "label1": "Difficile", "label5": "Sans problème"},
    {"question": "Le son de votre propre voix vous semble-t-il naturel ?", "type": "scale", "label1": "Étrange", "label5": "Naturel"},
    {"question": "L''écoute TV/Téléphone est-elle améliorée ?", "type": "scale", "label1": "Pas vraiment", "label5": "Nettement mieux"},
    {"question": "L''appareil améliore-t-il votre quotidien ?", "type": "scale", "label1": "Peu", "label5": "Beaucoup"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Audioprothésiste - Essai Appareil');

-- 4. ERGOTHÉRAPEUTE - AUTONOMIE - J+30
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Ergothérapeute - Autonomie', 
  'Suivi pour amélioration de l''autonomie et aménagement. Envoi recommandé à J+30.',
  'Ergothérapie', 
  ARRAY['ergotherapeute', 'autonomie', 'amenagement', 'handicap', 'materiel'],
  30,
  '[
    {"question": "Les aménagements réalisés vous sont-ils utiles ?", "type": "scale", "label1": "Peu utiles", "label5": "Très utiles"},
    {"question": "Vous sentez-vous plus en sécurité pour vos gestes quotidiens ?", "type": "scale", "label1": "Pas vraiment", "label5": "Beaucoup plus"},
    {"question": "Avez-vous gagné en autonomie ?", "type": "scale", "label1": "Non", "label5": "Oui, nettement"},
    {"question": "L''utilisation du matériel est-elle facile ?", "type": "scale", "label1": "Difficile", "label5": "Facile"},
    {"question": "Satisfaction globale sur votre confort de vie ?", "type": "scale", "label1": "Insatisfait", "label5": "Très satisfait"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Ergothérapeute - Autonomie');

-- 5. PSYCHOMOTRICIEN - APPRENTISSAGES - J+30
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Psychomotricien - Apprentissages', 
  'Suivi pour troubles de l''apprentissage et psychomotricité. Envoi recommandé à J+30.',
  'Psychomotricité', 
  ARRAY['psychomotricien', 'apprentissage', 'motricite', 'enfant', 'concentration'],
  30,
  '[
    {"question": "L''agitation motrice a-t-elle diminué ?", "type": "scale", "label1": "Inchangée", "label5": "Nettement diminuée"},
    {"question": "La concentration s''est-elle améliorée ?", "type": "scale", "label1": "Inchangée", "label5": "Très améliorée"},
    {"question": "L''écriture/motricité fine est-elle plus fluide ?", "type": "scale", "label1": "Toujours difficile", "label5": "Plus fluide"},
    {"question": "L''enfant semble-t-il plus confiant ?", "type": "scale", "label1": "Pas vraiment", "label5": "Beaucoup plus"},
    {"question": "Les enseignants ont-ils noté une évolution positive ?", "type": "scale", "label1": "Non", "label5": "Oui, nettement"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Psychomotricien - Apprentissages');

-- Verify insertions
SELECT name, category, suggested_delay_days FROM public.public_templates 
WHERE category IN ('Diététique', 'Sage-Femme', 'Audioprothèse', 'Ergothérapie', 'Psychomotricité');
