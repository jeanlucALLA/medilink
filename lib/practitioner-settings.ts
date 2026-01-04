// Gestion des paramètres du praticien dans LocalStorage
// Ces paramètres appartiennent au praticien et ne quittent jamais son ordinateur

const STORAGE_KEY = 'medilink_practitioner_settings'

export interface PractitionerSettings {
  googleReviewUrl?: string
}

// Récupérer les paramètres depuis LocalStorage
export function getPractitionerSettings(): PractitionerSettings {
  if (typeof window === 'undefined') return {}
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return {}
    return JSON.parse(stored)
  } catch (error) {
    console.error('Erreur lors de la lecture des paramètres:', error)
    return {}
  }
}

// Sauvegarder les paramètres
export function savePractitionerSettings(settings: PractitionerSettings): void {
  if (typeof window === 'undefined') {
    throw new Error('LocalStorage non disponible')
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
    throw new Error('Impossible de sauvegarder les paramètres')
  }
}

// Mettre à jour uniquement le lien Google Review
export function updateGoogleReviewUrl(url: string): void {
  const settings = getPractitionerSettings()
  settings.googleReviewUrl = url.trim() || undefined
  savePractitionerSettings(settings)
}

// Récupérer uniquement le lien Google Review
export function getGoogleReviewUrl(): string | undefined {
  return getPractitionerSettings().googleReviewUrl
}



