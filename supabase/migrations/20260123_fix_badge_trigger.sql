-- ============================================================================
-- CORRECTION: Trigger check_and_award_badges
-- Erreur: "record 'new' has no field 'average_score'"
-- Le trigger fait référence à NEW.average_score mais s'exécute sur des tables
-- qui n'ont pas ce champ (ex: questionnaires)
-- ============================================================================

-- Supprimer l'ancien trigger sur questionnaires (source de l'erreur)
DROP TRIGGER IF EXISTS check_badges_on_questionnaire ON questionnaires;

-- Recréer la fonction avec une vérification conditionnelle
CREATE OR REPLACE FUNCTION check_and_award_badges()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_questionnaire_count INT;
    v_response_count INT;
    v_avg_score DECIMAL;
    v_referral_count INT;
    v_days_since_signup INT;
BEGIN
    -- Déterminer l'user_id selon la table source
    IF TG_TABLE_NAME = 'questionnaires' THEN
        v_user_id := NEW.user_id;
    ELSIF TG_TABLE_NAME = 'responses' THEN
        v_user_id := NEW.user_id;
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
    FROM questionnaires
    WHERE user_id = v_user_id;
    
    -- Compter les réponses et calculer la moyenne
    SELECT COUNT(*), COALESCE(AVG(average_score), 0) INTO v_response_count, v_avg_score
    FROM responses
    WHERE user_id = v_user_id AND average_score IS NOT NULL;
    
    -- Compter les parrainages
    SELECT COUNT(*) INTO v_referral_count
    FROM referrals
    WHERE referrer_id = v_user_id AND status = 'completed';
    
    -- Jours depuis inscription
    SELECT EXTRACT(DAY FROM NOW() - created_at)::INT INTO v_days_since_signup
    FROM profiles
    WHERE id = v_user_id;
    
    -- Attribution des badges (questionnaires)
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
    
    -- Badge score parfait - SEULEMENT pour la table responses
    IF TG_TABLE_NAME = 'responses' THEN
        IF NEW.average_score = 5 THEN
            INSERT INTO user_badges (user_id, badge_id)
            SELECT v_user_id, id FROM badges WHERE code = 'perfect_score'
            ON CONFLICT (user_id, badge_id) DO NOTHING;
        END IF;
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

-- Recréer les triggers
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

-- Vérification
SELECT 'Correction appliquée avec succès!' as message;

