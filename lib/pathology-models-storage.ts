// Gestion des modèles de pathologies personnalisés dans LocalStorage
// Les modèles appartiennent au praticien et ne quittent jamais son ordinateur

export interface QuestionModel {
  question: string
  type: 'scale' // Standardisé sur échelle 1-5
  label1?: string // Libellé pour la valeur 1 (ex: "Pas du tout")
  label5?: string // Libellé pour la valeur 5 (ex: "Énormément")
}

export interface PathologyModel {
  id: string
  name: string
  description?: string
  questions: QuestionModel[]
  createdAt: number
}

const STORAGE_KEY = 'medilink_pathology_models'

// Récupérer tous les modèles depuis LocalStorage
export function getCustomModels(): PathologyModel[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    console.error('Erreur lors de la lecture des modèles:', error)
    return []
  }
}

// Sauvegarder un modèle
export function saveCustomModel(model: Omit<PathologyModel, 'id' | 'createdAt'>): PathologyModel {
  if (typeof window === 'undefined') {
    throw new Error('LocalStorage non disponible')
  }

  const models = getCustomModels()
  const newModel: PathologyModel = {
    ...model,
    id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
  }

  models.push(newModel)
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(models))
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
    throw new Error('Impossible de sauvegarder le modèle')
  }

  return newModel
}

// Mettre à jour un modèle existant
export function updateCustomModel(id: string, updates: Partial<Omit<PathologyModel, 'id' | 'createdAt'>>): PathologyModel | null {
  if (typeof window === 'undefined') {
    throw new Error('LocalStorage non disponible')
  }

  const models = getCustomModels()
  const index = models.findIndex(m => m.id === id)
  
  if (index === -1) return null

  models[index] = { ...models[index], ...updates }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(models))
    return models[index]
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error)
    throw new Error('Impossible de mettre à jour le modèle')
  }
}

// Supprimer un modèle
export function deleteCustomModel(id: string): boolean {
  if (typeof window === 'undefined') {
    throw new Error('LocalStorage non disponible')
  }

  const models = getCustomModels()
  const filtered = models.filter(m => m.id !== id)
  
  if (filtered.length === models.length) return false // Modèle non trouvé

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
    throw new Error('Impossible de supprimer le modèle')
  }
}

// Récupérer un modèle par ID
export function getCustomModelById(id: string): PathologyModel | null {
  const models = getCustomModels()
  return models.find(m => m.id === id) || null
}

// Exporter tous les modèles en JSON
export function exportModels(): string {
  const models = getCustomModels()
  return JSON.stringify(models, null, 2)
}

// Importer des modèles depuis JSON
export function importModels(jsonString: string): { success: number; errors: string[] } {
  if (typeof window === 'undefined') {
    throw new Error('LocalStorage non disponible')
  }

  try {
    const imported = JSON.parse(jsonString)
    
    if (!Array.isArray(imported)) {
      throw new Error('Format invalide: doit être un tableau')
    }

    const existing = getCustomModels()
    const existingIds = new Set(existing.map(m => m.id))
    const errors: string[] = []
    let success = 0

    imported.forEach((model: any, index: number) => {
      try {
        // Valider la structure
        if (!model.name || !Array.isArray(model.questions)) {
          errors.push(`Modèle ${index + 1}: structure invalide`)
          return
        }

        // Générer un nouvel ID si le modèle existe déjà
        const newModel: PathologyModel = {
          id: existingIds.has(model.id) 
            ? `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            : model.id || `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: model.name,
          description: model.description || '',
          questions: model.questions || [],
          createdAt: model.createdAt || Date.now(),
        }

        existing.push(newModel)
        existingIds.add(newModel.id)
        success++
      } catch (err: any) {
        errors.push(`Modèle ${index + 1}: ${err.message}`)
      }
    })

    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
    
    return { success, errors }
  } catch (error: any) {
    throw new Error(`Erreur lors de l'import: ${error.message}`)
  }
}

