-- ============================================================================
-- MIGRATION: Engagement & Retention Features
-- - Feature 2: Gamification & Badges
-- - Feature 3: Benchmarking Anonyme
-- - Feature 5: Templates Personnalisés
-- ============================================================================

-- ============================================================================
-- FEATURE 2: GAMIFICATION & BADGES
-- ============================================================================

-- Table des badges disponibles
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) DEFAULT '🏆',
    category VARCHAR(50) DEFAULT 'engagement', -- engagement, performance, loyalty
    threshold INTEGER DEFAULT 1, -- Seuil pour débloquer (ex: 10 questionnaires)
    points INTEGER DEFAULT 10, -- Points XP gagnés
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table des badges gagnés par les utilisateurs
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT now(),
    notified BOOLEAN DEFAULT false,
    UNIQUE(user_id, badge_id)
);

-- Insertion des badges par défaut
INSERT INTO badges (code, name, description, icon, category, threshold, points) VALUES
-- Badges de démarrage
('first_questionnaire', 'Premier Pas', 'Vous avez envoyé votre premier questionnaire !', '🎯', 'engagement', 1, 10),
('first_response', 'Première Réponse', 'Vous avez reçu votre première réponse patient !', '📬', 'engagement', 1, 15),

-- Badges d'engagement
('questionnaire_10', 'Praticien Actif', '10 questionnaires envoyés', '📋', 'engagement', 10, 25),
('questionnaire_50', 'Expert du Suivi', '50 questionnaires envoyés', '⭐', 'engagement', 50, 50),
('questionnaire_100', 'Maître du Suivi', '100 questionnaires envoyés', '🏆', 'engagement', 100, 100),
('questionnaire_500', 'Légende TopLinkSante', '500 questionnaires envoyés', '👑', 'engagement', 500, 250),

-- Badges de performance
('high_satisfaction', 'Patients Satisfaits', 'Score moyen de satisfaction ≥ 4.5/5', '😊', 'performance', 1, 30),
('response_rate_80', 'Excellent Taux de Réponse', 'Taux de réponse supérieur à 80%', '📈', 'performance', 80, 40),
('perfect_score', 'Score Parfait', 'Avoir reçu une note de 5/5', '💯', 'performance', 1, 20),

-- Badges de fidélité
('loyalty_30_days', 'Fidèle', 'Inscrit depuis plus de 30 jours', '🌟', 'loyalty', 30, 20),
('loyalty_90_days', 'Ambassadeur', 'Inscrit depuis plus de 90 jours', '🎖️', 'loyalty', 90, 50),
('loyalty_365_days', 'Partenaire Fondateur', 'Inscrit depuis plus d''un an', '💎', 'loyalty', 365, 150),

-- Badges de parrainage
('referral_1', 'Parrain', 'Vous avez parrainé votre premier confrère', '🤝', 'engagement', 1, 30),
('referral_5', 'Super Parrain', '5 parrainages réussis', '🌐', 'engagement', 5, 75)

ON CONFLICT (code) DO NOTHING;

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);

-- ============================================================================
-- FEATURE 3: BENCHMARKING ANONYME
-- ============================================================================

-- Vue pour les statistiques agrégées par spécialité (anonymisées)
CREATE OR REPLACE VIEW benchmarking_by_specialty AS
SELECT 
    p.specialty,
    COUNT(DISTINCT p.id) as practitioner_count,
    COUNT(DISTINCT q.id) as total_questionnaires,
    COUNT(DISTINCT r.id) as total_responses,
    ROUND(AVG(r.average_score)::numeric, 2) as avg_satisfaction_score,
    ROUND((COUNT(DISTINCT r.id)::numeric / NULLIF(COUNT(DISTINCT q.id), 0) * 100)::numeric, 1) as avg_response_rate
FROM profiles p
LEFT JOIN questionnaires q ON q.user_id = p.id
LEFT JOIN responses r ON r.questionnaire_id = q.id
WHERE p.specialty IS NOT NULL
GROUP BY p.specialty
HAVING COUNT(DISTINCT p.id) >= 3; -- Minimum 3 praticiens pour l'anonymat

-- Vue pour le classement individuel (position relative)
CREATE OR REPLACE VIEW practitioner_ranking AS
WITH practitioner_stats AS (
    SELECT 
        p.id as user_id,
        p.specialty,
        COUNT(DISTINCT q.id) as total_questionnaires,
        COUNT(DISTINCT r.id) as total_responses,
        ROUND(AVG(r.average_score)::numeric, 2) as avg_score,
        ROUND((COUNT(DISTINCT r.id)::numeric / NULLIF(COUNT(DISTINCT q.id), 0) * 100)::numeric, 1) as response_rate
    FROM profiles p
    LEFT JOIN questionnaires q ON q.user_id = p.id
    LEFT JOIN responses r ON r.questionnaire_id = q.id
    GROUP BY p.id, p.specialty
),
ranked AS (
    SELECT 
        *,
        PERCENT_RANK() OVER (PARTITION BY specialty ORDER BY avg_score DESC NULLS LAST) as percentile_score,
        PERCENT_RANK() OVER (PARTITION BY specialty ORDER BY response_rate DESC NULLS LAST) as percentile_response
    FROM practitioner_stats
    WHERE specialty IS NOT NULL
)
SELECT 
    user_id,
    specialty,
    total_questionnaires,
    total_responses,
    avg_score,
    response_rate,
    ROUND((1 - percentile_score) * 100) as top_percent_score,
    ROUND((1 - percentile_response) * 100) as top_percent_response
FROM ranked;

-- Fonction pour obtenir les stats de benchmarking d'un praticien
CREATE OR REPLACE FUNCTION get_practitioner_benchmarking(p_user_id UUID)
RETURNS TABLE (
    user_questionnaires INTEGER,
    user_responses INTEGER,
    user_avg_score NUMERIC,
    user_response_rate NUMERIC,
    specialty_avg_score NUMERIC,
    specialty_avg_response_rate NUMERIC,
    top_percent_score INTEGER,
    top_percent_response INTEGER,
    specialty VARCHAR
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pr.total_questionnaires::INTEGER,
        pr.total_responses::INTEGER,
        pr.avg_score,
        pr.response_rate,
        bs.avg_satisfaction_score,
        bs.avg_response_rate,
        pr.top_percent_score::INTEGER,
        pr.top_percent_response::INTEGER,
        pr.specialty
    FROM practitioner_ranking pr
    LEFT JOIN benchmarking_by_specialty bs ON bs.specialty = pr.specialty
    WHERE pr.user_id = p_user_id;
END;
$$;

-- ============================================================================
-- FEATURE 5: TEMPLATES PERSONNALISÉS
-- ============================================================================

-- Table des templates personnalisés créés par les praticiens
CREATE TABLE IF NOT EXISTS custom_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    pathologie VARCHAR(200) NOT NULL,
    questions JSONB NOT NULL DEFAULT '[]',
    is_favorite BOOLEAN DEFAULT false,
    use_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT false, -- Partager avec la communauté
    approved_public BOOLEAN DEFAULT false, -- Approuvé par admin pour être public
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_custom_templates_user ON custom_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_templates_public ON custom_templates(is_public, approved_public);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_custom_template_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS custom_templates_updated_at ON custom_templates;
CREATE TRIGGER custom_templates_updated_at
    BEFORE UPDATE ON custom_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_custom_template_timestamp();

-- ============================================================================
-- TRIGGERS POUR ATTRIBUTION AUTOMATIQUE DES BADGES
-- ============================================================================

-- Fonction pour vérifier et attribuer les badges
CREATE OR REPLACE FUNCTION check_and_award_badges()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_questionnaire_count INTEGER;
    v_response_count INTEGER;
    v_avg_score NUMERIC;
    v_referral_count INTEGER;
    v_days_since_signup INTEGER;
BEGIN
    -- Déterminer l'user_id selon la table source
    IF TG_TABLE_NAME = 'questionnaires' THEN
        v_user_id := COALESCE(NEW.user_id, OLD.user_id);
    ELSIF TG_TABLE_NAME = 'responses' THEN
        SELECT q.user_id INTO v_user_id FROM questionnaires q WHERE q.id = NEW.questionnaire_id;
    ELSIF TG_TABLE_NAME = 'referrals' THEN
        v_user_id := NEW.referrer_id;
    ELSE
        RETURN NEW;
    END IF;
    
    IF v_user_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Compter les questionnaires
    SELECT COUNT(*) INTO v_questionnaire_count
    FROM questionnaires WHERE user_id = v_user_id;
    
    -- Compter les réponses
    SELECT COUNT(*) INTO v_response_count
    FROM responses r
    JOIN questionnaires q ON q.id = r.questionnaire_id
    WHERE q.user_id = v_user_id;
    
    -- Score moyen
    SELECT AVG(average_score) INTO v_avg_score
    FROM responses r
    JOIN questionnaires q ON q.id = r.questionnaire_id
    WHERE q.user_id = v_user_id;
    
    -- Parrainages
    SELECT COUNT(*) INTO v_referral_count
    FROM referrals WHERE referrer_id = v_user_id;
    
    -- Jours depuis inscription
    SELECT EXTRACT(DAY FROM (now() - created_at))::INTEGER INTO v_days_since_signup
    FROM profiles WHERE id = v_user_id;
    
    -- Attribution des badges (INSERT IGNORE via ON CONFLICT)
    
    -- Premier questionnaire
    IF v_questionnaire_count >= 1 THEN
        INSERT INTO user_badges (user_id, badge_id)
        SELECT v_user_id, id FROM badges WHERE code = 'first_questionnaire'
        ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
    
    -- Première réponse
    IF v_response_count >= 1 THEN
        INSERT INTO user_badges (user_id, badge_id)
        SELECT v_user_id, id FROM badges WHERE code = 'first_response'
        ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
    
    -- Badges de volume
    IF v_questionnaire_count >= 10 THEN
        INSERT INTO user_badges (user_id, badge_id)
        SELECT v_user_id, id FROM badges WHERE code = 'questionnaire_10'
        ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
    
    IF v_questionnaire_count >= 50 THEN
        INSERT INTO user_badges (user_id, badge_id)
        SELECT v_user_id, id FROM badges WHERE code = 'questionnaire_50'
        ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
    
    IF v_questionnaire_count >= 100 THEN
        INSERT INTO user_badges (user_id, badge_id)
        SELECT v_user_id, id FROM badges WHERE code = 'questionnaire_100'
        ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
    
    IF v_questionnaire_count >= 500 THEN
        INSERT INTO user_badges (user_id, badge_id)
        SELECT v_user_id, id FROM badges WHERE code = 'questionnaire_500'
        ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
    
    -- Badge de satisfaction
    IF v_avg_score >= 4.5 AND v_response_count >= 5 THEN
        INSERT INTO user_badges (user_id, badge_id)
        SELECT v_user_id, id FROM badges WHERE code = 'high_satisfaction'
        ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
    
    -- Badge score parfait
    IF TG_TABLE_NAME = 'responses' AND NEW.average_score = 5 THEN
        INSERT INTO user_badges (user_id, badge_id)
        SELECT v_user_id, id FROM badges WHERE code = 'perfect_score'
        ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
    
    -- Badges de parrainage
    IF v_referral_count >= 1 THEN
        INSERT INTO user_badges (user_id, badge_id)
        SELECT v_user_id, id FROM badges WHERE code = 'referral_1'
        ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
    
    IF v_referral_count >= 5 THEN
        INSERT INTO user_badges (user_id, badge_id)
        SELECT v_user_id, id FROM badges WHERE code = 'referral_5'
        ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
    
    -- Badges de fidélité
    IF v_days_since_signup >= 30 THEN
        INSERT INTO user_badges (user_id, badge_id)
        SELECT v_user_id, id FROM badges WHERE code = 'loyalty_30_days'
        ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
    
    IF v_days_since_signup >= 90 THEN
        INSERT INTO user_badges (user_id, badge_id)
        SELECT v_user_id, id FROM badges WHERE code = 'loyalty_90_days'
        ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
    
    IF v_days_since_signup >= 365 THEN
        INSERT INTO user_badges (user_id, badge_id)
        SELECT v_user_id, id FROM badges WHERE code = 'loyalty_365_days'
        ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour déclencher la vérification des badges
DROP TRIGGER IF EXISTS check_badges_on_questionnaire ON questionnaires;
CREATE TRIGGER check_badges_on_questionnaire
    AFTER INSERT ON questionnaires
    FOR EACH ROW
    EXECUTE FUNCTION check_and_award_badges();

DROP TRIGGER IF EXISTS check_badges_on_response ON responses;
CREATE TRIGGER check_badges_on_response
    AFTER INSERT ON responses
    FOR EACH ROW
    EXECUTE FUNCTION check_and_award_badges();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Badges (visible par tous, modifiable par admin)
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges visibles par tous" ON badges
    FOR SELECT USING (is_active = true);

-- User Badges (chaque utilisateur voit les siens)
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User peut voir ses badges" ON user_badges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System peut créer badges" ON user_badges
    FOR INSERT WITH CHECK (true);

-- Custom Templates (chaque utilisateur gère les siens, ou voit les publics approuvés)
ALTER TABLE custom_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User peut voir ses templates" ON custom_templates
    FOR SELECT USING (
        auth.uid() = user_id 
        OR (is_public = true AND approved_public = true)
    );

CREATE POLICY "User peut créer ses templates" ON custom_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User peut modifier ses templates" ON custom_templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "User peut supprimer ses templates" ON custom_templates
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- FONCTION POUR RÉCUPÉRER LES BADGES D'UN UTILISATEUR
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_badges(p_user_id UUID)
RETURNS TABLE (
    badge_id UUID,
    code VARCHAR,
    name VARCHAR,
    description TEXT,
    icon VARCHAR,
    category VARCHAR,
    points INTEGER,
    earned_at TIMESTAMPTZ,
    is_new BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.code,
        b.name,
        b.description,
        b.icon,
        b.category,
        b.points,
        ub.earned_at,
        NOT ub.notified as is_new
    FROM user_badges ub
    JOIN badges b ON b.id = ub.badge_id
    WHERE ub.user_id = p_user_id
    ORDER BY ub.earned_at DESC;
    
    -- Marquer comme notifié
    UPDATE user_badges SET notified = true
    WHERE user_id = p_user_id AND notified = false;
END;
$$;

-- ============================================================================
-- FONCTION POUR CALCULER LE SCORE TOTAL (XP) D'UN UTILISATEUR
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_xp(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_xp INTEGER;
BEGIN
    SELECT COALESCE(SUM(b.points), 0) INTO v_total_xp
    FROM user_badges ub
    JOIN badges b ON b.id = ub.badge_id
    WHERE ub.user_id = p_user_id;
    
    RETURN v_total_xp;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON badges TO authenticated;
GRANT SELECT ON user_badges TO authenticated;
GRANT ALL ON custom_templates TO authenticated;
GRANT SELECT ON benchmarking_by_specialty TO authenticated;
GRANT SELECT ON practitioner_ranking TO authenticated;
GRANT EXECUTE ON FUNCTION get_practitioner_benchmarking TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_badges TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_xp TO authenticated;

-- ============================================================================
-- DONE!
-- ============================================================================
