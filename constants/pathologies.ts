// Bibliothèque de modèles de questionnaires par pathologie
// Chaque modèle contient un titre et des questions avec leur type d'input

export interface QuestionModel {
  question: string
  type: 'scale' // Standardisé sur échelle 1-5
  label1?: string // Libellé pour la valeur 1 (ex: "Pas du tout")
  label5?: string // Libellé pour la valeur 5 (ex: "Énormément")
}

export interface PathologyModel {
  id: string
  name: string
  description: string
  questions: QuestionModel[]
}

export const pathologyModels: PathologyModel[] = [
  {
    id: 'post-operative',
    name: 'Post-Opératoire',
    description: 'Suivi post-opératoire standard',
    questions: [
      {
        question: 'Évaluez votre niveau de douleur',
        type: 'scale',
        label1: 'Aucune douleur',
        label5: 'Douleur maximale',
      },
      {
        question: 'Comment évaluez-vous l\'état de votre cicatrisation ?',
        type: 'scale',
        label1: 'Très mauvaise',
        label5: 'Excellente',
      },
      {
        question: 'Avez-vous de la fièvre ?',
        type: 'scale',
        label1: 'Non',
        label5: 'Oui, importante',
      },
      {
        question: 'Avez-vous pris vos médicaments comme prescrit ?',
        type: 'scale',
        label1: 'Pas du tout',
        label5: 'Toujours',
      },
      {
        question: 'Niveau de préoccupation concernant votre état',
        type: 'scale',
        label1: 'Aucune',
        label5: 'Très élevée',
      },
    ],
  },
  {
    id: 'diabetes',
    name: 'Suivi Diabète',
    description: 'Questionnaire de suivi pour patients diabétiques',
    questions: [
      {
        question: 'Niveau de fatigue ressenti',
        type: 'scale',
        label1: 'Aucune',
        label5: 'Très élevé',
      },
      {
        question: 'Respect de votre régime alimentaire',
        type: 'scale',
        label1: 'Pas du tout',
        label5: 'Parfaitement',
      },
      {
        question: 'Fréquence de vos exercices physiques',
        type: 'scale',
        label1: 'Jamais',
        label5: 'Très régulièrement',
      },
      {
        question: 'Changements dans votre vision',
        type: 'scale',
        label1: 'Aucun',
        label5: 'Très importants',
      },
      {
        question: 'Satisfaction globale concernant votre suivi',
        type: 'scale',
        label1: 'Très insatisfait',
        label5: 'Très satisfait',
      },
    ],
  },
  {
    id: 'physiotherapy',
    name: 'Kinésithérapie',
    description: 'Suivi de rééducation et kinésithérapie',
    questions: [
      {
        question: 'Niveau de mobilité actuelle',
        type: 'scale',
        label1: 'Aucune',
        label5: 'Normale',
      },
      {
        question: 'Fréquence de réalisation de vos exercices',
        type: 'scale',
        label1: 'Jamais',
        label5: 'Tous les jours',
      },
      {
        question: 'Niveau de gêne nocturne',
        type: 'scale',
        label1: 'Aucune',
        label5: 'Très importante',
      },
      {
        question: 'Sensation de progression',
        type: 'scale',
        label1: 'Aucune',
        label5: 'Très importante',
      },
      {
        question: 'Difficultés rencontrées',
        type: 'scale',
        label1: 'Aucune',
        label5: 'Très importantes',
      },
    ],
  },
  {
    id: 'generic',
    name: 'Générique',
    description: 'Questionnaire générique de suivi',
    questions: [
      {
        question: 'État général aujourd\'hui',
        type: 'scale',
        label1: 'Très mauvais',
        label5: 'Excellent',
      },
      {
        question: 'Intensité des symptômes',
        type: 'scale',
        label1: 'Aucun',
        label5: 'Très intenses',
      },
      {
        question: 'Niveau de préoccupation',
        type: 'scale',
        label1: 'Aucune',
        label5: 'Très élevé',
      },
    ],
  },
]

// Fonction utilitaire pour obtenir un modèle par ID
export function getPathologyModel(id: string): PathologyModel | undefined {
  return pathologyModels.find((model) => model.id === id)
}

// Fonction pour obtenir tous les noms de pathologies (pour les selects)
export function getPathologyNames(): { id: string; name: string }[] {
  return pathologyModels.map((model) => ({ id: model.id, name: model.name }))
}

