-- ============================================================================
-- EXEMPLES DE REQUÊTES SQL POUR LE BENCHMARKING
-- ============================================================================
-- Ce fichier contient des exemples de requêtes SQL pour utiliser les nouvelles
-- colonnes de benchmarking ajoutées à la table profiles
-- ============================================================================

-- ----------------------------------------------------------------------------
-- EXEMPLE 1: Tarif moyen par spécialité dans une région donnée
-- ----------------------------------------------------------------------------
-- Note: Cette requête suppose que vous avez une table "tarifs" ou une colonne
-- "tarif" dans une autre table. Adaptez selon votre schéma.

-- Version complète avec statistiques détaillées
SELECT 
  p.specialty_id,
  p.specialty_group,
  p.region_code,
  p.department_code,
  COUNT(DISTINCT p.id) as nombre_praticiens,
  AVG(t.tarif)::NUMERIC(10,2) as tarif_moyen,
  MIN(t.tarif)::NUMERIC(10,2) as tarif_min,
  MAX(t.tarif)::NUMERIC(10,2) as tarif_max,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY t.tarif)::NUMERIC(10,2) as tarif_q1,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY t.tarif)::NUMERIC(10,2) as tarif_median,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY t.tarif)::NUMERIC(10,2) as tarif_q3,
  STDDEV(t.tarif)::NUMERIC(10,2) as ecart_type,
  COUNT(t.id) as nombre_tarifs
FROM profiles p
LEFT JOIN tarifs t ON t.user_id = p.id
WHERE p.region_code = '11'  -- Exemple: Île-de-France
  AND p.specialty_id IS NOT NULL
  AND t.tarif IS NOT NULL
  AND t.tarif > 0  -- Exclure les tarifs invalides
GROUP BY p.specialty_id, p.specialty_group, p.region_code, p.department_code
HAVING COUNT(t.id) >= 5  -- Au moins 5 tarifs pour être significatif
ORDER BY tarif_moyen DESC;

-- Version simplifiée (si vous n'avez pas de table tarifs séparée)
-- Supposons que vous avez une colonne "tarif_consultation" dans profiles
SELECT 
  p.specialty_id,
  p.specialty_group,
  p.region_code,
  COUNT(DISTINCT p.id) as nombre_praticiens,
  AVG(p.tarif_consultation)::NUMERIC(10,2) as tarif_moyen,
  MIN(p.tarif_consultation)::NUMERIC(10,2) as tarif_min,
  MAX(p.tarif_consultation)::NUMERIC(10,2) as tarif_max,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY p.tarif_consultation)::NUMERIC(10,2) as tarif_median
FROM profiles p
WHERE p.region_code = '11'  -- Exemple: Île-de-France
  AND p.specialty_id IS NOT NULL
  AND p.tarif_consultation IS NOT NULL
  AND p.tarif_consultation > 0
GROUP BY p.specialty_id, p.specialty_group, p.region_code
ORDER BY tarif_moyen DESC;

-- ----------------------------------------------------------------------------
-- EXEMPLE 2: Utilisation de la fonction get_benchmark_average
-- ----------------------------------------------------------------------------
-- Benchmark général pour une région (toutes spécialités confondues)
SELECT * FROM get_benchmark_average(
  p_specialty_id := NULL,           -- Toutes les spécialités
  p_region_code := '11',            -- Île-de-France
  p_department_code := NULL,        -- Tous les départements
  p_specialty_group := NULL,        -- Tous les groupes
  p_practice_type := NULL,          -- Tous les types
  p_sector := NULL                  -- Tous les secteurs
);

-- Benchmark pour une spécialité spécifique dans une région
SELECT * FROM get_benchmark_average(
  p_specialty_id := 'PODOLOGIE',    -- Spécialité Podologie
  p_region_code := '11',            -- Île-de-France
  p_department_code := NULL,
  p_specialty_group := NULL,
  p_practice_type := 'LIBERAL',     -- Seulement libéral
  p_sector := 1                     -- Secteur 1
);

-- Benchmark par département
SELECT * FROM get_benchmark_average(
  p_specialty_id := NULL,
  p_region_code := NULL,
  p_department_code := '75',        -- Paris
  p_specialty_group := NULL,
  p_practice_type := NULL,
  p_sector := NULL
);

-- ----------------------------------------------------------------------------
-- EXEMPLE 3: Benchmark d'un praticien spécifique
-- ----------------------------------------------------------------------------
-- Compare les performances d'un praticien avec les moyennes régionales
SELECT * FROM get_practitioner_benchmark('user-uuid-here');

-- ----------------------------------------------------------------------------
-- EXEMPLE 4: Top 10 des praticiens par région et spécialité
-- ----------------------------------------------------------------------------
WITH practitioner_scores AS (
  SELECT 
    p.id,
    p.nom_complet,
    p.specialty_id,
    p.region_code,
    p.department_code,
    AVG(r.score_total)::NUMERIC(5,2) as avg_score,
    COUNT(r.id) as total_responses
  FROM profiles p
  JOIN responses r ON r.user_id = p.id
  WHERE p.region_code = '11'
    AND p.specialty_id = 'PODOLOGIE'
    AND r.score_total IS NOT NULL
  GROUP BY p.id, p.nom_complet, p.specialty_id, p.region_code, p.department_code
  HAVING COUNT(r.id) >= 5  -- Au moins 5 réponses pour être significatif
)
SELECT 
  ps.*,
  RANK() OVER (ORDER BY ps.avg_score DESC) as rank
FROM practitioner_scores ps
ORDER BY ps.avg_score DESC
LIMIT 10;

-- ----------------------------------------------------------------------------
-- EXEMPLE 5: Comparaison des secteurs par région
-- ----------------------------------------------------------------------------
SELECT 
  p.region_code,
  p.sector,
  COUNT(DISTINCT p.id) as nombre_praticiens,
  AVG(r.score_total)::NUMERIC(5,2) as score_moyen,
  COUNT(r.id) as total_responses
FROM profiles p
LEFT JOIN responses r ON r.user_id = p.id
WHERE p.region_code = '11'
  AND p.sector IS NOT NULL
  AND r.score_total IS NOT NULL
GROUP BY p.region_code, p.sector
ORDER BY p.region_code, p.sector;

-- ----------------------------------------------------------------------------
-- EXEMPLE 6: Analyse par type de pratique
-- ----------------------------------------------------------------------------
SELECT 
  p.practice_type,
  p.specialty_group,
  COUNT(DISTINCT p.id) as nombre_praticiens,
  AVG(r.score_total)::NUMERIC(5,2) as score_moyen,
  COUNT(r.id) as total_responses
FROM profiles p
LEFT JOIN responses r ON r.user_id = p.id
WHERE p.practice_type IS NOT NULL
  AND r.score_total IS NOT NULL
GROUP BY p.practice_type, p.specialty_group
ORDER BY p.practice_type, score_moyen DESC;

-- ----------------------------------------------------------------------------
-- EXEMPLE 7: Praticiens OPTAM vs non-OPTAM
-- ----------------------------------------------------------------------------
SELECT 
  p.is_optam,
  p.region_code,
  COUNT(DISTINCT p.id) as nombre_praticiens,
  AVG(r.score_total)::NUMERIC(5,2) as score_moyen,
  COUNT(r.id) as total_responses
FROM profiles p
LEFT JOIN responses r ON r.user_id = p.id
WHERE p.is_optam IS NOT NULL
  AND r.score_total IS NOT NULL
GROUP BY p.is_optam, p.region_code
ORDER BY p.region_code, p.is_optam;

-- ----------------------------------------------------------------------------
-- EXEMPLE 8: Distribution géographique des praticiens par spécialité
-- ----------------------------------------------------------------------------
SELECT 
  p.specialty_id,
  p.region_code,
  p.department_code,
  COUNT(DISTINCT p.id) as nombre_praticiens,
  STRING_AGG(DISTINCT p.city, ', ' ORDER BY p.city) as villes
FROM profiles p
WHERE p.specialty_id IS NOT NULL
  AND p.region_code IS NOT NULL
GROUP BY p.specialty_id, p.region_code, p.department_code
ORDER BY p.specialty_id, p.region_code, nombre_praticiens DESC;

-- ----------------------------------------------------------------------------
-- EXEMPLE 9: Évolution temporelle des scores par région
-- ----------------------------------------------------------------------------
SELECT 
  DATE_TRUNC('month', r.submitted_at) as mois,
  p.region_code,
  AVG(r.score_total)::NUMERIC(5,2) as score_moyen,
  COUNT(r.id) as nombre_responses
FROM profiles p
JOIN responses r ON r.user_id = p.id
WHERE p.region_code IS NOT NULL
  AND r.submitted_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', r.submitted_at), p.region_code
ORDER BY mois DESC, p.region_code;

-- ----------------------------------------------------------------------------
-- EXEMPLE 10: Requête complexe avec plusieurs filtres
-- ----------------------------------------------------------------------------
-- Benchmark pour les podologues libéraux secteur 1 en Île-de-France
SELECT 
  p.specialty_id,
  p.specialty_group,
  p.region_code,
  p.department_code,
  p.practice_type,
  p.sector,
  COUNT(DISTINCT p.id) as nombre_praticiens,
  AVG(r.score_total)::NUMERIC(5,2) as score_moyen,
  MIN(r.score_total) as score_min,
  MAX(r.score_total) as score_max,
  PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY r.score_total) as q1,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY r.score_total) as median,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY r.score_total) as q3,
  COUNT(r.id) as total_responses
FROM profiles p
JOIN responses r ON r.user_id = p.id
WHERE p.region_code = '11'
  AND p.specialty_id = 'PODOLOGIE'
  AND p.practice_type = 'LIBERAL'
  AND p.sector = 1
  AND r.score_total IS NOT NULL
GROUP BY 
  p.specialty_id,
  p.specialty_group,
  p.region_code,
  p.department_code,
  p.practice_type,
  p.sector
ORDER BY score_moyen DESC;

-- ============================================================================
-- NOTES D'UTILISATION
-- ============================================================================
-- 1. Remplacez 'user-uuid-here' par l'UUID réel de l'utilisateur
-- 2. Adaptez les valeurs de filtres (region_code, specialty_id, etc.) selon vos besoins
-- 3. Les requêtes utilisent les index créés pour optimiser les performances
-- 4. Pour les requêtes complexes, pensez à utiliser EXPLAIN ANALYZE pour vérifier les performances
-- ============================================================================

