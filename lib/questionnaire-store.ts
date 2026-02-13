/**
 * ⚠️ AVERTISSEMENT ARCHITECTURE ⚠️
 * Ce module utilise des Map JavaScript en mémoire et setInterval.
 * Sur Vercel (serverless), ces données sont PERDUES entre les requêtes
 * car chaque invocation peut utiliser un processus différent.
 * 
 * Ce module est utilisé par 4 routes API (/api/questionnaire, /api/survey, /api/responses).
 * Pour une fiabilité en production, migrer vers :
 * - Upstash Redis (recommandé) pour le stockage éphémère
 * - Ou Supabase avec TTL pour l'expiration automatique
 */

// Stockage en mémoire pour les questionnaires et réponses
// Ce fichier est partagé entre toutes les routes API

export interface Question {
  question: string
  type: 'scale' // Standardisé sur échelle 1-5
  label1?: string // Libellé pour la valeur 1 (ex: "Pas du tout")
  label5?: string // Libellé pour la valeur 5 (ex: "Énormément")
}

interface Questionnaire {
  id: string
  title: string
  questions: Question[] // Modifié pour supporter les types de questions
  pathologyId?: string // ID de la pathologie
  pathologyName?: string // Nom de la pathologie pour affichage patient
  googleReviewUrl?: string // Lien Google Review pour redirection automatique
  createdAt: number
  expiresAt: number
  practitionerId?: string
  isScheduled?: boolean // Si true, le questionnaire est en attente d'envoi programmé
  scheduledSendAt?: number // Timestamp de l'envoi programmé (si isScheduled = true)
}

interface Response {
  questionnaireId: string
  answers: number[] // Réponses stockées comme nombres (1-5)
  submittedAt: number
  viewedAt: number | null
  expiresAt: number
}

// Maps en mémoire
export const questionnairesMap = new Map<string, Questionnaire>()
export const responsesMap = new Map<string, Response>()

// Nettoyage automatique
const cleanupExpired = () => {
  const now = Date.now()
  let deletedQuestionnaires = 0
  let deletedResponses = 0

  // Nettoyer les questionnaires expirés
  for (const [id, questionnaire] of questionnairesMap.entries()) {
    if (questionnaire.expiresAt <= now) {
      questionnairesMap.delete(id)
      responsesMap.delete(id)
      deletedQuestionnaires++
    }
  }

  // Nettoyer les réponses expirées
  for (const [id, response] of responsesMap.entries()) {
    if (response.expiresAt <= now) {
      responsesMap.delete(id)
      deletedResponses++
    }
  }

  if (deletedQuestionnaires > 0 || deletedResponses > 0) {
    console.log(`[Cleanup] ${deletedQuestionnaires} questionnaire(s) et ${deletedResponses} réponse(s) supprimé(s)`)
  }
}

// Nettoyage toutes les 5 minutes
setInterval(cleanupExpired, 5 * 60 * 1000)

export type { Questionnaire, Response }

