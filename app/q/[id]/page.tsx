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
  questions?: Array<{ text: string;[key: string]: any }> | any[]
}

export default function QuestionnairePage() {
  const params = useParams()
  const router = useRouter()
  const questionnaireId = params.id as string

  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null)
  const [questions, setQuestions] = useState<string[]>([])
  const [answers, setAnswers] = useState<number[]>([])
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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

        console.log('📋 Questionnaire loaded:', data)
        console.log('❓ Raw questions:', data.questions)

        // Initialiser les questions
        let initQuestions: string[] = []
        if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
          // Gérer si c'est un tableau de strings ou d'objets avec champs variés
          initQuestions = data.questions.map((q: any) => {
            if (typeof q === 'string') return q;
            // Essayer plusieurs clés possibles pour le texte
            return q.text || q.label || q.question || q.title || JSON.stringify(q);
          })
        } else {
          // Questions par défaut si aucune définie
          initQuestions = [
            "Sur une échelle de 1 à 5, comment évaluez-vous votre niveau de douleur ou de confort ?",
            "Comment vous sentez-vous globalement depuis votre dernière séance ?"
          ]
        }
        setQuestions(initQuestions)
        // Initialiser les réponses à 3 (neutre) par défaut
        setAnswers(new Array(initQuestions.length).fill(3))

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

  const handleAnswerChange = (index: number, value: number) => {
    const newAnswers = [...answers]
    newAnswers[index] = value
    setAnswers(newAnswers)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/questionnaire/${questionnaireId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers: answers,
          comment: comment.trim(),
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

  if (!questionnaire) return null

  const patientName = questionnaire.patient_name ||
    (questionnaire.patient_email ? questionnaire.patient_email.split('@')[0] : 'Patient')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
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

          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 md:p-8 space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {questions.map((question, index) => (
              <div key={index} className="space-y-4 pt-4 first:pt-0 border-t first:border-0 border-gray-100">
                <label className="block text-base font-medium text-gray-800">
                  {question}
                </label>

                <div className="flex items-center justify-between space-x-2 mb-2 pb-1">
                  <span className="text-xs text-gray-500 font-medium">Faible / Mauvais</span>
                  <span className="text-xs text-gray-500 font-medium">Élevé / Très bon</span>
                </div>

                <div className="flex items-center justify-between space-x-2 sm:space-x-4">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleAnswerChange(index, value)}
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl font-bold text-lg transition-all transform duration-200 ${answers[index] === value
                        ? 'bg-primary text-white scale-110 shadow-lg ring-4 ring-primary/20 translate-y-[-2px]'
                        : 'bg-white border-2 border-gray-100 text-gray-600 hover:border-primary hover:text-primary hover:bg-blue-50'
                        }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>

                <div className="text-center">
                  <div className="inline-block px-3 py-1 bg-gray-50 rounded-full text-xs font-medium text-gray-500">
                    Votre choix : <span className="text-primary font-bold">{answers[index]}/5</span>
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-6 border-t border-gray-200">
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Commentaire optionnel
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm"
                placeholder="Avez-vous quelque chose à ajouter ? (Détails, remarque, question...)"
              />
            </div>

            <div className="pt-2">
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

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Vos réponses sont confidentielles et sécurisées.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

