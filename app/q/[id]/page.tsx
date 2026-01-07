'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, CheckCircle, AlertCircle, Heart, Check, Smile } from 'lucide-react'
import Link from 'next/link'

interface Questionnaire {
  id: string
  pathologie: string
  patient_name?: string
  patient_email?: string
  status: string
}

interface FormData {
  painLevel: number // Échelle 1-10
  feeling: string // Comment vous sentez-vous
  remarks: string // Remarques particulières
}

export default function QuestionnairePage() {
  const params = useParams()
  const router = useRouter()
  const questionnaireId = params.id as string

  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    painLevel: 5,
    feeling: '',
    remarks: '',
  })

  useEffect(() => {
    const loadQuestionnaire = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/questionnaire/${questionnaireId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Questionnaire non trouvé ou expiré')
          } else {
            setError('Erreur lors du chargement du questionnaire')
          }
          return
        }

        const data = await response.json()
        
        // Vérifier si le questionnaire est déjà complété
        if (data.status === 'Complété') {
          setError('Complété')
          return
        }

        setQuestionnaire(data)
      } catch (err: any) {
        console.error('Erreur lors du chargement:', err)
        setError('Une erreur est survenue lors du chargement')
      } finally {
        setLoading(false)
      }
    }

    if (questionnaireId) {
      loadQuestionnaire()
    }
  }, [questionnaireId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePainLevelChange = (value: number) => {
    setFormData(prev => ({
      ...prev,
      painLevel: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // Calculer un score global (moyenne de l'échelle de douleur, normalisée)
      const scoreGlobal = formData.painLevel // Score sur 10, on peut le normaliser sur 5 si nécessaire

      const response = await fetch(`/api/questionnaire/${questionnaireId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          painLevel: formData.painLevel,
          feeling: formData.feeling.trim(),
          remarks: formData.remarks.trim(),
          scoreGlobal: scoreGlobal,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la soumission')
      }

      setSuccess(true)
      
      // Rediriger vers la page de remerciement après 2 secondes
      setTimeout(() => {
        router.push('/questionnaire/merci')
      }, 2000)

    } catch (err: any) {
      console.error('Erreur lors de la soumission:', err)
      setError(err.message || 'Une erreur est survenue lors de la soumission')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Chargement du questionnaire...</p>
        </div>
      </div>
    )
  }

  // Afficher un message si le questionnaire est déjà complété
  if (error === 'Complété') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Questionnaire complété</h1>
          <p className="text-gray-600">Ce questionnaire a déjà été rempli. Merci !</p>
        </div>
      </div>
    )
  }

  if (error && !questionnaire) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Questionnaire non disponible</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Merci !</h1>
          <p className="text-gray-600">Vos réponses ont été enregistrées avec succès.</p>
        </div>
      </div>
    )
  }

  if (!questionnaire) {
    return null
  }

  // Extraire le nom du patient depuis l'email ou utiliser une valeur par défaut
  const patientName = questionnaire.patient_name || 
    (questionnaire.patient_email ? questionnaire.patient_email.split('@')[0] : 'Patient')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Logo Medi.Link en haut */}
      <div className="bg-white border-b border-gray-200 py-4 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center space-x-2">
            <Heart className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold text-primary">Medi.Link</span>
          </Link>
        </div>
      </div>

      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Message de bienvenue personnalisé */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Smile className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Bonjour {patientName}
            </h1>
            <p className="text-lg text-gray-600">
              Votre praticien vous invite à répondre à ce suivi concernant votre{' '}
              <span className="font-semibold text-gray-900">{questionnaire.pathologie}</span>.
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 md:p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Échelle de douleur/confort 1-10 */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Sur une échelle de 1 à 10, comment évaluez-vous votre niveau de douleur ou de confort ?
              </label>
              
              <div className="flex items-center justify-between space-x-2 mb-2">
                <span className="text-xs text-gray-500">1 - Très faible</span>
                <span className="text-xs text-gray-500">10 - Très élevé</span>
              </div>
              
              <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handlePainLevelChange(value)}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg font-semibold text-sm transition-all ${
                      formData.painLevel === value
                        ? 'bg-primary text-white scale-110 shadow-md ring-2 ring-primary ring-offset-2'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              
              <div className="text-center mt-2">
                <span className="text-sm font-medium text-gray-700">
                  Votre sélection : <span className="text-primary">{formData.painLevel}/10</span>
                </span>
              </div>
            </div>

            {/* Champ texte : Comment vous sentez-vous */}
            <div>
              <label htmlFor="feeling" className="block text-sm font-medium text-gray-700 mb-2">
                Comment vous sentez-vous depuis votre dernière séance ?
              </label>
              <textarea
                id="feeling"
                name="feeling"
                value={formData.feeling}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="Décrivez votre état général, vos progrès, vos difficultés..."
              />
            </div>

            {/* Champ texte : Remarques particulières */}
            <div>
              <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-2">
                Avez-vous des remarques particulières pour votre praticien ?
              </label>
              <textarea
                id="remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="Questions, observations, points à aborder lors de votre prochaine consultation..."
              />
            </div>

            {/* Bouton de soumission */}
            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={submitting || success}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-base"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Envoyer mes réponses</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Vos réponses sont confidentielles et sécurisées.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

