-- Fonction pour récupérer le classement des praticiens (Top 5/5)
-- Basé sur le nombre de réponses avec un score moyen de 5/5

CREATE OR REPLACE FUNCTION get_leaderboard()
RETURNS TABLE (
  user_id uuid,
  nom_complet text,
  cabinet text,
  city text,
  department_code text,
  perfect_score_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as user_id,
    COALESCE(p.nom_complet, 'Membre Medi.Link ' || SUBSTRING(p.id::text, 1, 4)) as nom_complet,
    COALESCE(p.cabinet, 'Cabinet') as cabinet,
    COALESCE(p.city, '') as city,
    -- Priorité : department_code explicite > extrait du zip_code > extrait du code_postal
    COALESCE(
      NULLIF(p.department_code, ''),
      SUBSTRING(NULLIF(p.zip_code, ''), 1, 2),
      SUBSTRING(NULLIF(p.code_postal, ''), 1, 2),
      ''
    ) as department_code,
    COUNT(r.id) as perfect_score_count
  FROM
    profiles p
  JOIN
    responses r ON p.id = r.user_id
  WHERE
    -- On considère un score parfait si la moyenne est >= 4.5 (arrondi à 5)
    -- Ou strictement 5 si on veut être puriste. Ici on prend average_score >= 4.8 pour être "très bon"
    -- Mais la demande est "note 5/5". Le front-end envoie "score_total" arrondi.
    -- Allons avec score_total = 5 (donc >= 4.5 de moyenne)
    r.score_total = 5
  GROUP BY
    p.id, p.nom_complet, p.cabinet, p.city, p.department_code, p.zip_code, p.code_postal
  ORDER BY
    perfect_score_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note : SECURITY DEFINER permet à tout le monde d'appeler la fonction et de voir les scores agrégés
-- sans avoir accès direct aux données brutes des autres utilisateurs via RLS.
