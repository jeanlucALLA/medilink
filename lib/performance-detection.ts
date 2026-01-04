// Fonction pour détecter si le cabinet dépasse le benchmark régional de 20%
// et gérer la fréquence des notifications

interface PerformanceData {
  ownScore: number
  regionalScore: number
  nationalScore: number
  ownResponses: number
}

const STORAGE_KEY = 'medi_link_performance_notification'
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000

export interface PerformanceNotification {
  shouldShow: boolean
  percentageDiff: number
  isFirstTime: boolean
  lastShown?: number
}

/**
 * Vérifie si le cabinet mérite une notification de félicitations
 * @param performanceData Les données de performance du cabinet
 * @returns Un objet indiquant si la notification doit être affichée
 */
export function checkPerformanceNotification(
  performanceData: PerformanceData
): PerformanceNotification {
  // Vérifier qu'on a assez de données
  if (performanceData.ownResponses < 5) {
    return { shouldShow: false, percentageDiff: 0, isFirstTime: false }
  }

  // Utiliser le benchmark régional si disponible, sinon national
  const benchmarkScore = performanceData.regionalScore > 0 
    ? performanceData.regionalScore 
    : performanceData.nationalScore

  if (benchmarkScore === 0) {
    return { shouldShow: false, percentageDiff: 0, isFirstTime: false }
  }

  // Calculer la différence en pourcentage
  const percentageDiff = ((performanceData.ownScore - benchmarkScore) / benchmarkScore) * 100

  // Vérifier si on dépasse de 20% ou plus
  if (percentageDiff < 20) {
    return { shouldShow: false, percentageDiff, isFirstTime: false }
  }

  // Vérifier la fréquence (une fois par semaine maximum)
  const lastShown = getLastNotificationTime()
  const now = Date.now()
  const timeSinceLastShown = now - (lastShown || 0)

  // Si moins d'une semaine s'est écoulée, ne pas afficher
  if (lastShown && timeSinceLastShown < WEEK_IN_MS) {
    return { 
      shouldShow: false, 
      percentageDiff, 
      isFirstTime: false,
      lastShown 
    }
  }

  // Vérifier si c'est la première fois
  const isFirstTime = !lastShown

  // Sauvegarder le timestamp de cette notification
  saveNotificationTime(now)

  return {
    shouldShow: true,
    percentageDiff: Math.round(percentageDiff),
    isFirstTime,
    lastShown: now
  }
}

/**
 * Récupère le timestamp de la dernière notification
 */
function getLastNotificationTime(): number | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    
    const data = JSON.parse(stored)
    return data.lastShown || null
  } catch (err) {
    console.error('[Performance] Erreur lecture localStorage:', err)
    return null
  }
}

/**
 * Sauvegarde le timestamp de la notification
 */
function saveNotificationTime(timestamp: number): void {
  if (typeof window === 'undefined') return
  
  try {
    const data = {
      lastShown: timestamp,
      version: 1
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (err) {
    console.error('[Performance] Erreur sauvegarde localStorage:', err)
  }
}

/**
 * Réinitialise le système de notification (pour les tests)
 */
export function resetNotificationSystem(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    console.error('[Performance] Erreur réinitialisation:', err)
  }
}


