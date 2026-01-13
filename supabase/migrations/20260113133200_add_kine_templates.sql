-- Migration: Add Kinésithérapeute Questionnaire Templates
-- Date: 2026-01-13
-- Description: Insert 5 kinésithérapeute-specific questionnaire templates

-- 1. KINÉ - POST-OPÉRATOIRE - J+30
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Kiné - Post-Opératoire', 
  'Suivi de rééducation post-chirurgicale. Envoi recommandé à J+30.',
  'Kinésithérapie', 
  ARRAY['kine', 'post-operatoire', 'reeducation', 'chirurgie', 'articulation'],
  30,
  '[
    {"question": "Sentez-vous une nette progression de votre mobilité ?", "type": "scale", "label1": "Aucun progrès", "label5": "Très nette progression"},
    {"question": "La douleur post-opératoire est-elle désormais bien contrôlée ?", "type": "scale", "label1": "Douleur persistante", "label5": "Bien contrôlée"},
    {"question": "Vous sentez-vous en confiance pour utiliser votre articulation ?", "type": "scale", "label1": "Pas du tout", "label5": "Totalement confiant"},
    {"question": "Les exercices à la maison sont-ils clairs et réalisables ?", "type": "scale", "label1": "Difficiles", "label5": "Clairs et faciles"},
    {"question": "Satisfaction globale sur l''accompagnement ?", "type": "scale", "label1": "Insatisfait", "label5": "Très satisfait"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Kiné - Post-Opératoire');

-- 2. KINÉ - LOMBALGIE CHRONIQUE - J+15
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Kiné - Lombalgie Chronique', 
  'Suivi pour lombalgies chroniques et douleurs de dos. Envoi recommandé à J+15.',
  'Kinésithérapie', 
  ARRAY['kine', 'lombalgie', 'dos', 'chronique', 'posture'],
  15,
  '[
    {"question": "L''intensité de vos douleurs lombaires a-t-elle diminué ?", "type": "scale", "label1": "Inchangée", "label5": "Nettement diminuée"},
    {"question": "Vous sentez-vous plus souple dans vos mouvements quotidiens ?", "type": "scale", "label1": "Pas du tout", "label5": "Très souple"},
    {"question": "Avez-vous compris les gestes/postures à adopter ?", "type": "scale", "label1": "Pas clair", "label5": "Parfaitement compris"},
    {"question": "Parvenez-vous à réaliser vos exercices seul(e) ?", "type": "scale", "label1": "Difficile", "label5": "Sans problème"},
    {"question": "Votre qualité de vie s''est-elle améliorée ?", "type": "scale", "label1": "Non", "label5": "Oui, nettement"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Kiné - Lombalgie Chronique');

-- 3. KINÉ - ENTORSE/TRAUMA - J+10
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Kiné - Entorse/Trauma', 
  'Suivi post-traumatisme (entorse, foulure). Envoi recommandé à J+10.',
  'Kinésithérapie', 
  ARRAY['kine', 'entorse', 'trauma', 'cheville', 'genou'],
  10,
  '[
    {"question": "L''œdème (gonflement) a-t-il significativement diminué ?", "type": "scale", "label1": "Toujours gonflé", "label5": "Totalement résorbé"},
    {"question": "Pouvez-vous marcher sans douleur ?", "type": "scale", "label1": "Très douloureux", "label5": "Sans douleur"},
    {"question": "Sentez-vous que votre articulation est plus stable ?", "type": "scale", "label1": "Instable", "label5": "Très stable"},
    {"question": "Avez-vous repris confiance pour reprendre vos activités ?", "type": "scale", "label1": "Pas du tout", "label5": "Pleine confiance"},
    {"question": "Efficacité du traitement sur votre blessure ?", "type": "scale", "label1": "Inefficace", "label5": "Très efficace"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Kiné - Entorse/Trauma');

-- 4. KINÉ - RESPIRATOIRE BÉBÉ - J+2
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Kiné - Respiratoire Bébé', 
  'Suivi après kinésithérapie respiratoire pédiatrique. Envoi recommandé à J+2.',
  'Kinésithérapie', 
  ARRAY['kine', 'respiratoire', 'bebe', 'pediatrie', 'bronchiolite'],
  2,
  '[
    {"question": "Votre enfant semble-t-il mieux respirer depuis la séance ?", "type": "scale", "label1": "Pas mieux", "label5": "Beaucoup mieux"},
    {"question": "A-t-il pu manger/dormir plus paisiblement ?", "type": "scale", "label1": "Difficile", "label5": "Très paisible"},
    {"question": "Les explications sur le lavage de nez étaient-elles claires ?", "type": "scale", "label1": "Pas claires", "label5": "Parfaitement claires"},
    {"question": "Vous êtes-vous senti rassuré face à l''état de l''enfant ?", "type": "scale", "label1": "Inquiet", "label5": "Très rassuré"},
    {"question": "Douceur de la prise en charge de votre bébé ?", "type": "scale", "label1": "Inconfortable", "label5": "Très douce"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Kiné - Respiratoire Bébé');

-- 5. KINÉ - CERVICALGIE/BUREAU - J+7
INSERT INTO public.public_templates (name, description, category, tags, suggested_delay_days, questions)
SELECT 
  'Kiné - Cervicalgie/Bureau', 
  'Suivi pour douleurs cervicales liées au travail de bureau. Envoi recommandé à J+7.',
  'Kinésithérapie', 
  ARRAY['kine', 'cervicalgie', 'bureau', 'ergonomie', 'teletravail'],
  7,
  '[
    {"question": "Ressentez-vous une diminution des tensions nuque/épaules ?", "type": "scale", "label1": "Inchangées", "label5": "Nettement diminuées"},
    {"question": "Si vous aviez des maux de tête, ont-ils disparu ?", "type": "scale", "label1": "Toujours présents", "label5": "Totalement disparus"},
    {"question": "Avez-vous retrouvé une meilleure mobilité de la tête ?", "type": "scale", "label1": "Toujours limité", "label5": "Mobilité normale"},
    {"question": "Les conseils ergonomiques vous ont-ils été utiles ?", "type": "scale", "label1": "Peu utiles", "label5": "Très utiles"},
    {"question": "Satisfaction globale concernant le soulagement ?", "type": "scale", "label1": "Insatisfait", "label5": "Très satisfait"}
  ]'::JSONB
WHERE NOT EXISTS (SELECT 1 FROM public.public_templates WHERE name = 'Kiné - Cervicalgie/Bureau');

-- Verify insertions
SELECT name, category, suggested_delay_days FROM public.public_templates WHERE category = 'Kinésithérapie';
