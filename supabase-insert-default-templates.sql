-- Script SQL pour insérer les 3 modèles standards dans community_templates
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase après avoir créé la table

-- Modèle A : Suivi de Satisfaction
INSERT INTO community_templates (
  title, 
  description, 
  pathologie, 
  questions, 
  tags, 
  category, 
  is_approved, 
  is_system_template,
  usage_count,
  vote_count
) VALUES (
  'Suivi de Satisfaction',
  'Questionnaire standard pour évaluer la satisfaction du patient concernant l''accueil, la clarté des explications et la recommandation',
  'Suivi de Satisfaction',
  '[
    {"question": "Comment évaluez-vous l''accueil et la prise en charge ?", "type": "scale", "label1": "Très insatisfait", "label5": "Très satisfait"},
    {"question": "Les explications fournies étaient-elles claires ?", "type": "scale", "label1": "Pas claires du tout", "label5": "Très claires"},
    {"question": "Recommanderiez-vous ce cabinet à un proche ?", "type": "yesno"}
  ]'::jsonb,
  ARRAY['#Satisfaction', '#Suivi'],
  'Satisfaction Globale',
  true,
  true,
  0,
  0
) ON CONFLICT DO NOTHING;

-- Modèle B : Évolution des Symptômes
INSERT INTO community_templates (
  title, 
  description, 
  pathologie, 
  questions, 
  tags, 
  category, 
  is_approved, 
  is_system_template,
  usage_count,
  vote_count
) VALUES (
  'Évolution des Symptômes',
  'Questionnaire pour évaluer l''amélioration ressentie par le patient et les éventuelles gênes',
  'Évolution des Symptômes',
  '[
    {"question": "Comment évaluez-vous l''amélioration de vos symptômes depuis la dernière séance ?", "type": "scale", "label1": "Aucune amélioration", "label5": "Amélioration totale"},
    {"question": "Sur une échelle de 1 à 5, notez l''amélioration ressentie", "type": "scale", "label1": "1 - Aucune amélioration", "label5": "5 - Amélioration complète"},
    {"question": "Avez-vous remarqué des gênes ou des effets secondaires particuliers ?", "type": "text"}
  ]'::jsonb,
  ARRAY['#Suivi', '#Évolution', '#Symptômes'],
  'Suivi de Douleur',
  true,
  true,
  0,
  0
) ON CONFLICT DO NOTHING;

-- Modèle C : Évaluation de la Douleur
INSERT INTO community_templates (
  title, 
  description, 
  pathologie, 
  questions, 
  tags, 
  category, 
  is_approved, 
  is_system_template,
  usage_count,
  vote_count
) VALUES (
  'Évaluation de la Douleur',
  'Questionnaire standard pour évaluer précisément l''intensité de la douleur et son impact sur le quotidien',
  'Évaluation de la Douleur',
  '[
    {"question": "Sur une échelle de 0 à 10, quel est votre niveau de douleur actuel ?", "type": "scale", "label1": "0 - Aucune douleur", "label5": "10 - Douleur insupportable"},
    {"question": "À quel moment de la journée la douleur est-elle la plus forte ?", "type": "text"},
    {"question": "La douleur impacte-t-elle votre quotidien (sommeil, activités) ?", "type": "yesno"}
  ]'::jsonb,
  ARRAY['#Douleur', '#Gêne', '#Évaluation'],
  'Suivi de Douleur',
  true,
  true,
  0,
  0
) ON CONFLICT DO NOTHING;

-- Vérification : Afficher les modèles insérés
SELECT 
  id, 
  title, 
  category, 
  is_approved, 
  is_system_template,
  array_length(tags, 1) as nb_tags,
  jsonb_array_length(questions) as nb_questions
FROM community_templates 
WHERE is_system_template = true
ORDER BY created_at;
