-- Script SQL pour créer les fonctions de benchmarking régional
-- Exécutez ce script dans l'éditeur SQL de votre projet Supabase

-- Fonction pour calculer le benchmark régional basé sur le code département
CREATE OR REPLACE FUNCTION get_regional_benchmark(
  department_code_param TEXT,
  user_id_param UUID
)
RETURNS TABLE (
  average_score NUMERIC,
  total_responses BIGINT,
  department_code TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(r.score_total), 0)::NUMERIC(10, 2) as average_score,
    COUNT(r.id)::BIGINT as total_responses,
    department_code_param as department_code
  FROM responses r
  INNER JOIN questionnaires q ON r.questionnaire_id = q.id
  INNER JOIN profiles p ON q.user_id = p.id
  WHERE 
    p.department_code = department_code_param
    AND p.department_code IS NOT NULL
    AND q.user_id != user_id_param -- Exclure le cabinet actuel
    AND r.score_total IS NOT NULL
    AND (
      -- Vérifier que le questionnaire a des tags de satisfaction OU que la pathologie contient "satisfaction"
      q.pathologie ILIKE '%satisfaction%'
      OR EXISTS (
        SELECT 1 
        FROM community_templates ct
        WHERE ct.pathologie = q.pathologie
        AND (
          ct.tags && ARRAY['#Satisfaction', '#Satisfaction Globale', 'Satisfaction']
        )
      )
    )
  GROUP BY p.department_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour calculer la moyenne de satisfaction régionale (anonyme) - Ancienne version (basée sur code postal)
CREATE OR REPLACE FUNCTION get_regional_satisfaction_average(
  user_code_postal TEXT,
  user_id_param UUID
)
RETURNS TABLE (
  average_score NUMERIC,
  total_responses BIGINT,
  region_code TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(r.score_total), 0)::NUMERIC(10, 2) as average_score,
    COUNT(r.id)::BIGINT as total_responses,
    user_code_postal as region_code
  FROM responses r
  INNER JOIN questionnaires q ON r.questionnaire_id = q.id
  INNER JOIN profiles p ON q.user_id = p.id
  WHERE 
    p.code_postal = user_code_postal
    AND p.code_postal IS NOT NULL
    AND q.user_id != user_id_param -- Exclure le cabinet actuel
    AND EXISTS (
      -- Vérifier que le questionnaire a des tags de satisfaction
      SELECT 1 
      FROM community_templates ct
      WHERE ct.pathologie = q.pathologie
      AND (
        ct.tags && ARRAY['#Satisfaction', '#Satisfaction Globale', 'Satisfaction']
        OR q.pathologie ILIKE '%satisfaction%'
      )
    )
  GROUP BY p.code_postal;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour calculer la moyenne de satisfaction nationale (anonyme)
CREATE OR REPLACE FUNCTION get_national_satisfaction_average(
  user_id_param UUID
)
RETURNS TABLE (
  average_score NUMERIC,
  total_responses BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(r.score_total), 0)::NUMERIC(10, 2) as average_score,
    COUNT(r.id)::BIGINT as total_responses
  FROM responses r
  INNER JOIN questionnaires q ON r.questionnaire_id = q.id
  WHERE 
    q.user_id != user_id_param -- Exclure le cabinet actuel
    AND r.score_total IS NOT NULL
    AND (
      -- Vérifier que le questionnaire a des tags de satisfaction OU que la pathologie contient "satisfaction"
      q.pathologie ILIKE '%satisfaction%'
      OR EXISTS (
        SELECT 1 
        FROM community_templates ct
        WHERE ct.pathologie = q.pathologie
        AND (
          ct.tags && ARRAY['#Satisfaction', '#Satisfaction Globale', 'Satisfaction']
        )
      )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour calculer le score de satisfaction du cabinet actuel
CREATE OR REPLACE FUNCTION get_own_satisfaction_score(
  user_id_param UUID
)
RETURNS TABLE (
  average_score NUMERIC,
  total_responses BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(r.score_total), 0)::NUMERIC(10, 2) as average_score,
    COUNT(r.id)::BIGINT as total_responses
  FROM responses r
  INNER JOIN questionnaires q ON r.questionnaire_id = q.id
  WHERE 
    q.user_id = user_id_param
    AND r.score_total IS NOT NULL
    AND (
      -- Vérifier que le questionnaire a des tags de satisfaction OU que la pathologie contient "satisfaction"
      q.pathologie ILIKE '%satisfaction%'
      OR EXISTS (
        SELECT 1 
        FROM community_templates ct
        WHERE ct.pathologie = q.pathologie
        AND (
          ct.tags && ARRAY['#Satisfaction', '#Satisfaction Globale', 'Satisfaction']
        )
      )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires pour documenter
COMMENT ON FUNCTION get_regional_satisfaction_average IS 'Calcule la moyenne de satisfaction des autres cabinets de la même région (code postal)';
COMMENT ON FUNCTION get_national_satisfaction_average IS 'Calcule la moyenne de satisfaction nationale (tous les cabinets sauf le cabinet actuel)';
COMMENT ON FUNCTION get_own_satisfaction_score IS 'Calcule le score de satisfaction du cabinet actuel';

