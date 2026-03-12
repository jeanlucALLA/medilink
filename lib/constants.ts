export const STRIPE_PRICE_IDS = {
    pro: 'price_1So5wmPDDk8vjKdY9jyVwKoz',
} as const;

/**
 * Constantes de statut pour les questionnaires.
 * Source unique de vérité pour éviter les incohérences de nommage.
 */
export const QUESTIONNAIRE_STATUS = {
    DRAFT: 'brouillon',
    PENDING: 'en_attente',
    SCHEDULED: 'programmé',
    SENT: 'envoyé',
    COMPLETED: 'Complété',
    ERROR: 'erreur_envoi',
    EXPIRED: 'expiré',
} as const

export type QuestionnaireStatus = typeof QUESTIONNAIRE_STATUS[keyof typeof QUESTIONNAIRE_STATUS]

/**
 * Statuts acceptés pour l'accès patient au questionnaire
 */
export const PATIENT_ACCESSIBLE_STATUSES: readonly string[] = [
    QUESTIONNAIRE_STATUS.SENT,
    QUESTIONNAIRE_STATUS.SCHEDULED,
    QUESTIONNAIRE_STATUS.PENDING,
] as const

/**
 * Durée maximale de validité d'un lien questionnaire (en jours)
 */
export const QUESTIONNAIRE_LINK_MAX_AGE_DAYS = 30
