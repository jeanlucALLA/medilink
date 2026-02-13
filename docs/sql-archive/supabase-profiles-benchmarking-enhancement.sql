-- ============================================================================
-- Migration : Enrichissement de la table profiles pour le benchmarking
-- régional et par spécialité médicale
-- ============================================================================
-- Date : 2024
-- Description : Ajoute les colonnes nécessaires pour permettre le 
--               benchmarking régional et sectoriel des praticiens
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Création du type ENUM pour le type de pratique
-- ----------------------------------------------------------------------------
DO $$ 
BEGIN
  -- Créer le type ENUM s'il n'existe pas
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'practice_type_enum') THEN
    CREATE TYPE practice_type_enum AS ENUM ('LIBERAL', 'HOPITAL', 'CLINIQUE');
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Ajout des colonnes pour la spécialité médicale
-- ----------------------------------------------------------------------------
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS specialty_id TEXT,
ADD COLUMN IF NOT EXISTS specialty_group TEXT;

-- Commentaires pour la documentation
COMMENT ON COLUMN profiles.specialty_id IS 'Identifiant de la spécialité médicale (peut être un code RPPS ou un ID de table spécialités)';
COMMENT ON COLUMN profiles.specialty_group IS 'Groupe de spécialités pour le clustering (ex: "Chirurgie", "Médecine générale", "Spécialités médicales")';

-- ----------------------------------------------------------------------------
-- 3. Ajout des colonnes géographiques avancées
-- ----------------------------------------------------------------------------
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS region_code TEXT,
ADD COLUMN IF NOT EXISTS city_zip_code TEXT;

-- Commentaires
COMMENT ON COLUMN profiles.region_code IS 'Code de la région administrative (ex: "11" pour Île-de-France, "84" pour Auvergne-Rhône-Alpes)';
COMMENT ON COLUMN profiles.city_zip_code IS 'Code postal complet avec ville pour géolocalisation précise';

-- ----------------------------------------------------------------------------
-- 4. Ajout des colonnes pour le type de pratique et le secteur
-- ----------------------------------------------------------------------------
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS practice_type practice_type_enum,
ADD COLUMN IF NOT EXISTS sector INTEGER,
ADD COLUMN IF NOT EXISTS is_optam BOOLEAN DEFAULT FALSE;

-- Commentaires
COMMENT ON COLUMN profiles.practice_type IS 'Type de structure d''exercice : LIBERAL, HOPITAL, ou CLINIQUE';
COMMENT ON COLUMN profiles.sector IS 'Secteur de conventionnement : 1 (Secteur 1), 2 (Secteur 2), ou 3 (Non conventionné)';
COMMENT ON COLUMN profiles.is_optam IS 'Indique si le praticien a signé un contrat OPTAM (Option Pratique Tarifaire Maîtrisée)';

-- ----------------------------------------------------------------------------
-- 5. Création des index pour optimiser les requêtes de benchmarking
-- ----------------------------------------------------------------------------

-- Index composite sur (specialty_id, region_code) pour les requêtes de benchmarking régional par spécialité
CREATE INDEX IF NOT EXISTS profiles_specialty_region_idx 
ON profiles(specialty_id, region_code) 
WHERE specialty_id IS NOT NULL AND region_code IS NOT NULL;

-- Index composite sur (specialty_group, department_code) pour le clustering
CREATE INDEX IF NOT EXISTS profiles_specialty_group_dept_idx 
ON profiles(specialty_group, department_code) 
WHERE specialty_group IS NOT NULL AND department_code IS NOT NULL;

-- Index sur region_code seul (utilisé fréquemment)
CREATE INDEX IF NOT EXISTS profiles_region_code_idx 
ON profiles(region_code) 
WHERE region_code IS NOT NULL;

-- Index sur specialty_id seul
CREATE INDEX IF NOT EXISTS profiles_specialty_id_idx 
ON profiles(specialty_id) 
WHERE specialty_id IS NOT NULL;

-- Index sur practice_type pour filtrer par type de pratique
CREATE INDEX IF NOT EXISTS profiles_practice_type_idx 
ON profiles(practice_type) 
WHERE practice_type IS NOT NULL;

-- Index composite sur (sector, practice_type) pour les analyses sectorielles
CREATE INDEX IF NOT EXISTS profiles_sector_practice_idx 
ON profiles(sector, practice_type) 
WHERE sector IS NOT NULL AND practice_type IS NOT NULL;

-- Index sur is_optam pour filtrer les praticiens OPTAM
CREATE INDEX IF NOT EXISTS profiles_is_optam_idx 
ON profiles(is_optam) 
WHERE is_optam = TRUE;

-- ----------------------------------------------------------------------------
-- 6. Fonction pour calculer la moyenne de benchmark par spécialité et région
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_benchmark_average(
  p_specialty_id TEXT DEFAULT NULL,
  p_region_code TEXT DEFAULT NULL,
  p_department_code TEXT DEFAULT NULL,
  p_specialty_group TEXT DEFAULT NULL,
  p_practice_type practice_type_enum DEFAULT NULL,
  p_sector INTEGER DEFAULT NULL
)
RETURNS TABLE (
  specialty_id TEXT,
  specialty_group TEXT,
  region_code TEXT,
  department_code TEXT,
  practice_type practice_type_enum,
  sector INTEGER,
  average_score NUMERIC,
  total_responses BIGINT,
  practitioner_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.specialty_id,
    p.specialty_group,
    p.region_code,
    p.department_code,
    p.practice_type,
    p.sector,
    AVG(r.score_total)::NUMERIC(5,2) as average_score,
    COUNT(r.id)::BIGINT as total_responses,
    COUNT(DISTINCT p.id)::BIGINT as practitioner_count
  FROM profiles p
  LEFT JOIN responses r ON r.user_id = p.id
  WHERE 
    (p_specialty_id IS NULL OR p.specialty_id = p_specialty_id)
    AND (p_region_code IS NULL OR p.region_code = p_region_code)
    AND (p_department_code IS NULL OR p.department_code = p_department_code)
    AND (p_specialty_group IS NULL OR p.specialty_group = p_specialty_group)
    AND (p_practice_type IS NULL OR p.practice_type = p_practice_type)
    AND (p_sector IS NULL OR p.sector = p_sector)
    AND r.score_total IS NOT NULL
  GROUP BY 
    p.specialty_id,
    p.specialty_group,
    p.region_code,
    p.department_code,
    p.practice_type,
    p.sector;
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION get_benchmark_average IS 'Calcule la moyenne de score de satisfaction par spécialité, région, département, type de pratique et secteur';

-- ----------------------------------------------------------------------------
-- 7. Fonction pour obtenir le benchmark d'un praticien par rapport à sa région/spécialité
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_practitioner_benchmark(
  p_user_id UUID
)
RETURNS TABLE (
  practitioner_score NUMERIC,
  regional_average NUMERIC,
  specialty_average NUMERIC,
  regional_specialty_average NUMERIC,
  percentile_rank NUMERIC,
  total_practitioners BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_specialty_id TEXT;
  v_region_code TEXT;
  v_department_code TEXT;
  v_practitioner_avg NUMERIC;
BEGIN
  -- Récupérer les informations du praticien
  SELECT 
    specialty_id,
    region_code,
    department_code,
    AVG(r.score_total)::NUMERIC(5,2)
  INTO 
    v_specialty_id,
    v_region_code,
    v_department_code,
    v_practitioner_avg
  FROM profiles p
  LEFT JOIN responses r ON r.user_id = p.id
  WHERE p.id = p_user_id
  GROUP BY p.specialty_id, p.region_code, p.department_code;

  -- Retourner les benchmarks comparatifs
  RETURN QUERY
  WITH practitioner_stats AS (
    SELECT 
      AVG(r.score_total)::NUMERIC(5,2) as avg_score
    FROM responses r
    WHERE r.user_id = p_user_id
  ),
  regional_stats AS (
    SELECT 
      AVG(r.score_total)::NUMERIC(5,2) as avg_score,
      COUNT(DISTINCT r.user_id)::BIGINT as practitioner_count
    FROM responses r
    JOIN profiles p ON p.id = r.user_id
    WHERE p.region_code = v_region_code
      AND r.score_total IS NOT NULL
  ),
  specialty_stats AS (
    SELECT 
      AVG(r.score_total)::NUMERIC(5,2) as avg_score
    FROM responses r
    JOIN profiles p ON p.id = r.user_id
    WHERE p.specialty_id = v_specialty_id
      AND r.score_total IS NOT NULL
  ),
  regional_specialty_stats AS (
    SELECT 
      AVG(r.score_total)::NUMERIC(5,2) as avg_score
    FROM responses r
    JOIN profiles p ON p.id = r.user_id
    WHERE p.region_code = v_region_code
      AND p.specialty_id = v_specialty_id
      AND r.score_total IS NOT NULL
  )
  SELECT 
    ps.avg_score as practitioner_score,
    rs.avg_score as regional_average,
    ss.avg_score as specialty_average,
    rss.avg_score as regional_specialty_average,
    CASE 
      WHEN rs.avg_score > 0 THEN 
        ((ps.avg_score - rs.avg_score) / rs.avg_score * 100)::NUMERIC(5,2)
      ELSE NULL
    END as percentile_rank,
    rs.practitioner_count as total_practitioners
  FROM practitioner_stats ps
  CROSS JOIN regional_stats rs
  CROSS JOIN specialty_stats ss
  CROSS JOIN regional_specialty_stats rss;
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION get_practitioner_benchmark IS 'Compare les performances d''un praticien avec les moyennes régionales et par spécialité';

-- ----------------------------------------------------------------------------
-- 8. Mise à jour automatique de region_code depuis department_code
-- ----------------------------------------------------------------------------
-- Fonction pour mettre à jour automatiquement region_code depuis department_code
-- (mapping simplifié France métropolitaine)
CREATE OR REPLACE FUNCTION update_region_code_from_department()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_region_code TEXT;
BEGIN
  -- Mapping simplifié des départements vers les régions
  -- Vous pouvez enrichir ce mapping selon vos besoins
  IF NEW.department_code IS NOT NULL THEN
    SELECT CASE
      WHEN NEW.department_code IN ('75', '77', '78', '91', '92', '93', '94', '95') THEN '11' -- Île-de-France
      WHEN NEW.department_code IN ('01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74') THEN '84' -- Auvergne-Rhône-Alpes
      WHEN NEW.department_code IN ('21', '25', '39', '58', '70', '71', '89', '90') THEN '27' -- Bourgogne-Franche-Comté
      WHEN NEW.department_code IN ('22', '29', '35', '56') THEN '53' -- Bretagne
      WHEN NEW.department_code IN ('18', '28', '36', '37', '41', '45') THEN '24' -- Centre-Val de Loire
      WHEN NEW.department_code IN ('08', '10', '51', '52', '54', '55', '57', '67', '68', '88') THEN '44' -- Grand Est
      WHEN NEW.department_code IN ('11', '30', '34', '48', '66') THEN '76' -- Occitanie
      WHEN NEW.department_code IN ('14', '27', '50', '61', '76') THEN '28' -- Normandie
      WHEN NEW.department_code IN ('02', '59', '60', '62', '80') THEN '32' -- Hauts-de-France
      WHEN NEW.department_code IN ('16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87') THEN '75' -- Nouvelle-Aquitaine
      WHEN NEW.department_code IN ('44', '49', '53', '72', '85') THEN '52' -- Pays de la Loire
      WHEN NEW.department_code IN ('04', '05', '06', '13', '83', '84') THEN '93' -- Provence-Alpes-Côte d'Azur
      WHEN NEW.department_code IN ('2A', '2B') THEN '94' -- Corse
      ELSE NULL
    END INTO v_region_code;
    
    NEW.region_code := v_region_code;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger pour mettre à jour automatiquement region_code
DROP TRIGGER IF EXISTS update_region_code_trigger ON profiles;
CREATE TRIGGER update_region_code_trigger
  BEFORE INSERT OR UPDATE OF department_code ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_region_code_from_department();

-- ----------------------------------------------------------------------------
-- 9. Vérification et migration des données existantes
-- ----------------------------------------------------------------------------
-- Mettre à jour region_code pour les profils existants qui ont un department_code
UPDATE profiles
SET region_code = (
  SELECT CASE
    WHEN department_code IN ('75', '77', '78', '91', '92', '93', '94', '95') THEN '11'
    WHEN department_code IN ('01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74') THEN '84'
    WHEN department_code IN ('21', '25', '39', '58', '70', '71', '89', '90') THEN '27'
    WHEN department_code IN ('22', '29', '35', '56') THEN '53'
    WHEN department_code IN ('18', '28', '36', '37', '41', '45') THEN '24'
    WHEN department_code IN ('08', '10', '51', '52', '54', '55', '57', '67', '68', '88') THEN '44'
    WHEN department_code IN ('11', '30', '34', '48', '66') THEN '76'
    WHEN department_code IN ('14', '27', '50', '61', '76') THEN '28'
    WHEN department_code IN ('02', '59', '60', '62', '80') THEN '32'
    WHEN department_code IN ('16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87') THEN '75'
    WHEN department_code IN ('44', '49', '53', '72', '85') THEN '52'
    WHEN department_code IN ('04', '05', '06', '13', '83', '84') THEN '93'
    WHEN department_code IN ('2A', '2B') THEN '94'
    ELSE NULL
  END
)
WHERE region_code IS NULL AND department_code IS NOT NULL;

-- Migrer la colonne specialite existante vers specialty_id si elle existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'specialite'
  ) THEN
    UPDATE profiles
    SET specialty_id = specialite
    WHERE specialty_id IS NULL AND specialite IS NOT NULL;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 10. Exemple de requête SQL pour calculer le tarif moyen par spécialité 
--     au sein d'une région donnée
-- ----------------------------------------------------------------------------
-- Note: Cette requête suppose que vous avez une table "tarifs" ou une colonne
-- "tarif" dans une autre table. Adaptez selon votre schéma.

/*
-- Exemple 1: Tarif moyen par spécialité dans une région
SELECT 
  p.specialty_id,
  p.specialty_group,
  p.region_code,
  COUNT(DISTINCT p.id) as nombre_praticiens,
  AVG(t.tarif) as tarif_moyen,
  MIN(t.tarif) as tarif_min,
  MAX(t.tarif) as tarif_max,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY t.tarif) as tarif_median
FROM profiles p
LEFT JOIN tarifs t ON t.user_id = p.id
WHERE p.region_code = '11'  -- Exemple: Île-de-France
  AND p.specialty_id IS NOT NULL
  AND t.tarif IS NOT NULL
GROUP BY p.specialty_id, p.specialty_group, p.region_code
ORDER BY tarif_moyen DESC;

-- Exemple 2: Utilisation de la fonction get_benchmark_average
SELECT * FROM get_benchmark_average(
  p_specialty_id := NULL,           -- Toutes les spécialités
  p_region_code := '11',            -- Île-de-France
  p_department_code := NULL,        -- Tous les départements
  p_specialty_group := NULL,        -- Tous les groupes
  p_practice_type := 'LIBERAL',     -- Seulement libéral
  p_sector := 1                     -- Secteur 1
);

-- Exemple 3: Benchmark d'un praticien spécifique
SELECT * FROM get_practitioner_benchmark('user-uuid-here');
*/

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
-- Pour exécuter cette migration :
-- 1. Connectez-vous à votre projet Supabase
-- 2. Ouvrez l'éditeur SQL
-- 3. Copiez-collez ce script
-- 4. Exécutez-le
-- ============================================================================


