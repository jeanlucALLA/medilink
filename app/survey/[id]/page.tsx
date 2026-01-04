'use client'

import { useState, useEffect } from 'react'
import { Send, AlertCircle, Clock } from 'lucide-react'
import { useParams } from 'next/navigation'

export default function SurveyPage() {
  const params = useParams()
  const id = params.id as string

  const [questionnaire, setQuestionnaire] = useState<any>(null)
  const [answers, setAnswers] = useState<number[]>([]) // Réponses comme nombres 1-5
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadQuestionnaire = async () => {
      try {
        const response = await fetch(`/api/survey/${id}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError('Questionnaire non trouvé ou expiré')
          } else {
            setError('Erreur lors du chargement')
          }
          return
        }

        const data = await response.json()
        setQuestionnaire(data)
        // Initialiser les réponses à 0 (non répondu)
        setAnswers(new Array(data.questions.length).fill(0))
      } catch (err) {
        setError('Erreur de connexion')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadQuestionnaire()
    }
  }, [id])

  const handleAnswerChange = (index: number, value: number) => {
    const newAnswers = [...answers]
    newAnswers[index] = value
    setAnswers(newAnswers)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Vérifier que toutes les questions sont remplies (doivent être entre 1 et 5)
    const allAnswered = questionnaire.questions.every((q: any, index: number) => {
      const answer = answers[index]
      return typeof answer === 'number' && answer >= 1 && answer <= 5
    })
    
    if (!allAnswered) {
      alert('Veuillez répondre à toutes les questions en sélectionnant une valeur de 1 à 5')
      return
    }

    setSubmitting(true)

    try {
      // Envoyer les réponses au serveur
      const response = await fetch(`/api/survey/${id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi')
      }

      // Calculer la moyenne des réponses
      const numericAnswers = answers.filter((a): a is number => typeof a === 'number' && a >= 1 && a <= 5)
      const average = numericAnswers.length > 0
        ? numericAnswers.reduce((sum, val) => sum + val, 0) / numericAnswers.length
        : 0

      // Afficher le message de remerciement
      setSubmitted(true)

      // Attendre 2 secondes avant de rediriger (si score élevé)
      if (average >= 4.5 && questionnaire.googleReviewUrl) {
        setTimeout(() => {
          // Rediriger vers Google Review dans un nouvel onglet
          window.open(questionnaire.googleReviewUrl, '_blank', 'noopener,noreferrer')
        }, 2000)
      }
    } catch (err) {
      alert('Erreur lors de l\'envoi des réponses')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-600 mb-2">Chargement du questionnaire...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    // Calculer la moyenne pour déterminer le message
    const numericAnswers = answers.filter((a): a is number => typeof a === 'number' && a >= 1 && a <= 5)
    const average = numericAnswers.length > 0
      ? numericAnswers.reduce((sum, val) => sum + val, 0) / numericAnswers.length
      : 0
    const willRedirect = average >= 4.5 && questionnaire?.googleReviewUrl

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Merci !</h1>
          <p className="text-gray-600 mb-4">
            {willRedirect 
              ? "Merci pour votre retour ! Votre avis nous est précieux."
              : "Vos réponses ont été enregistrées."}
          </p>
          {willRedirect && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 text-left mb-4">
              <p className="text-sm text-green-800">
                Vous allez être redirigé vers Google Review dans quelques instants...
              </p>
            </div>
          )}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 text-left">
            <p className="text-sm text-blue-800">
              Vos réponses seront supprimées du serveur après lecture par votre praticien ou dans 2 heures maximum.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!questionnaire) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Bandeau d'avertissement */}
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-red-800 mb-1">
                Confidentialité des données
              </h3>
              <p className="text-xs text-red-700">
                Vos réponses seront supprimées du serveur après lecture par votre praticien ou dans 2 heures maximum. 
                Aucune donnée n&apos;est stockée de manière permanente.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {questionnaire.pathologyName 
              ? `Suivi ${questionnaire.pathologyName}`
              : questionnaire.title}
          </h1>
          <p className="text-gray-600 mb-6">
            Veuillez répondre à toutes les questions ci-dessous.
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {questionnaire.questions.map((question: any, index: number) => {
              const questionText = typeof question === 'string' ? question : question.question
              const questionObj = typeof question === 'string' ? { question: question, type: 'scale' } : question
              const answer = answers[index] || 0
              const label1 = questionObj.label1 || '1'
              const label5 = questionObj.label5 || '5'

              return (
                <div key={index} className="border-b border-gray-200 pb-8 last:border-b-0">
                  <label className="block text-base font-medium text-gray-900 mb-4">
                    {index + 1}. {questionText} *
                  </label>

                  {/* Échelle 1-5 avec boutons */}
                  <div className="space-y-4">
                    {/* Boutons 1-5 */}
                    <div className="flex gap-2 sm:gap-3">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleAnswerChange(index, value)}
                          className={`
                            flex-1 min-h-[60px] sm:min-h-[70px] rounded-lg font-semibold text-lg sm:text-xl
                            transition-all duration-200 transform active:scale-95
                            ${answer === value
                              ? 'bg-primary text-white shadow-lg scale-105'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }
                          `}
                        >
                          {value}
                        </button>
                      ))}
                    </div>

                    {/* Libellés sous les boutons */}
                    <div className="flex justify-between text-xs sm:text-sm text-gray-600 px-1">
                      <span className="font-medium">{label1}</span>
                      <span className="font-medium">{label5}</span>
                    </div>

                    {/* Indicateur visuel de sélection */}
                    {answer > 0 && (
                      <div className="text-center">
                        <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium text-sm">
                          Vous avez sélectionné : {answer}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            <div className="flex items-center space-x-2 text-sm text-gray-600 pt-4 border-t border-gray-200">
              <Clock className="w-4 h-4" />
              <span>Ce questionnaire expire dans 2 heures maximum</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center space-x-2 bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
              <span>{submitting ? 'Envoi en cours...' : 'Envoyer les réponses'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

