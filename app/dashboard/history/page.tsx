'use client'

import { useState, useEffect } from 'react'
import { Eye, Calendar, FileText, Loader2, X, CheckCircle, Clock, Mail } from 'lucide-react'

interface Questionnaire {
  id: string
  pathologie: string
  status: string
  created_at: string
  updated_at?: string
  reponses?: any
  score_resultat?: number
  questions?: any[]
  send_after_days?: number | null
  patient_email?: string | null
}

export default function HistoryPage() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<Questionnaire | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Charger les questionnaires depuis Supabase
  useEffect(() => {
    const loadQuestionnaires = async () => {
      try {
        setLoading(true)
        const { supabase } = await import('@/lib/supabase') as any
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          console.error('Erreur authentification:', authError)
          setLoading(false)
          return
        }

        // Récupérer tous les questionnaires de l'utilisateur, triés par date de création (plus récents en premier)
        const { data, error } = await supabase
          .from('questionnaires')
          .select('id, pathologie, status, created_at, updated_at, reponses, score_resultat, questions, send_after_days, patient_email')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Erreur lors du chargement:', error)
          setLoading(false)
          return
        }

        setQuestionnaires(data || [])
      } catch (err: any) {
        console.error('Erreur lors du chargement des questionnaires:', err)
      } finally {
        setLoading(false)
      }
    }

    loadQuestionnaires()
  }, [])

  // Ouvrir le modal avec les détails du questionnaire
  const handleViewDetails = (questionnaire: Questionnaire) => {
    setSelectedQuestionnaire(questionnaire)
    setShowModal(true)
  }

  // Fermer le modal
  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedQuestionnaire(null)
  }

  // Formater la date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Calculer la date d'envoi programmée
  const getScheduledDate = (questionnaire: Questionnaire): Date | null => {
    if (questionnaire.status !== 'pending' || !questionnaire.send_after_days || !questionnaire.created_at) {
      return null
    }
    const createdDate = new Date(questionnaire.created_at)
    const scheduledDate = new Date(createdDate)
    scheduledDate.setDate(scheduledDate.getDate() + questionnaire.send_after_days)
    return scheduledDate
  }

  // Calculer le nombre de jours restants
  const getDaysUntilScheduled = (questionnaire: Questionnaire): number | null => {
    const scheduledDate = getScheduledDate(questionnaire)
    if (!scheduledDate) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const scheduled = new Date(scheduledDate)
    scheduled.setHours(0, 0, 0, 0)

    const diffTime = scheduled.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  }

  // Compter les emails programmés dans les 30 prochains jours
  const getScheduledEmailsCount = (): number => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const in30Days = new Date(today)
    in30Days.setDate(in30Days.getDate() + 30)

    return questionnaires.filter((q) => {
      const scheduledDate = getScheduledDate(q)
      if (!scheduledDate) return false
      const scheduled = new Date(scheduledDate)
      scheduled.setHours(0, 0, 0, 0)
      return scheduled >= today && scheduled <= in30Days
    }).length
  }

  // Obtenir le badge de statut avec décompte pour les emails programmés
  const getStatusBadgeWithSchedule = (questionnaire: Questionnaire) => {
    if (questionnaire.status === 'pending' && questionnaire.send_after_days && questionnaire.patient_email) {
      const daysRemaining = getDaysUntilScheduled(questionnaire)
      
      if (daysRemaining !== null) {
        if (daysRemaining === 0) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              <Clock className="w-3 h-3 mr-1" />
              Envoi prévu aujourd&apos;hui
            </span>
          )
        } else if (daysRemaining > 0) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              <Clock className="w-3 h-3 mr-1" />
              Envoi dans {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}
            </span>
          )
        }
      }
    }

    // Retourner le badge de statut normal
    return getStatusBadge(questionnaire.status)
  }

  // Obtenir le badge de suivi temporel pour la colonne dédiée
  const getScheduleBadge = (questionnaire: Questionnaire) => {
    if (questionnaire.status === 'pending' && questionnaire.send_after_days && questionnaire.patient_email) {
      const daysRemaining = getDaysUntilScheduled(questionnaire)
      
      if (daysRemaining !== null) {
        if (daysRemaining === 0) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              ⏳ Envoi prévu aujourd&apos;hui
            </span>
          )
        } else if (daysRemaining > 0) {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              ⏳ Envoi dans {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}
            </span>
          )
        }
      }
    }
    return <span className="text-sm text-gray-400">—</span>
  }

  // Vérifier si l'email est visible (pas encore purgé)
  const isEmailVisible = (questionnaire: Questionnaire): boolean => {
    return questionnaire.status === 'pending' && 
           typeof questionnaire.patient_email === 'string' &&
           questionnaire.patient_email !== 'PURGED' &&
           questionnaire.patient_email.trim() !== ''
  }

  // Obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Complété':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Complété
          </span>
        )
      case 'sent':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            Envoyé
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <div className="text-lg font-medium text-gray-900 mb-1">Chargement...</div>
          <div className="text-sm text-gray-500">Récupération de l&apos;historique</div>
        </div>
      </div>
    )
  }

  const scheduledEmailsCount = getScheduledEmailsCount()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Historique</h1>
            <p className="text-gray-600 mt-2">Consultez l&apos;historique de vos questionnaires et les réponses des patients</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <FileText className="w-5 h-5" />
            <span>{questionnaires.length} questionnaire(s)</span>
          </div>
        </div>
      </div>

      {/* Bandeau de résumé - Suivi automatique */}
      {scheduledEmailsCount > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg shadow-sm p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center text-2xl">
                📧
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Suivi automatique</h2>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-medium text-orange-700">{scheduledEmailsCount}</span> envoi{scheduledEmailsCount > 1 ? 's' : ''} programmé{scheduledEmailsCount > 1 ? 's' : ''} prochainement
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600">Les emails seront envoyés automatiquement aux patients</p>
            </div>
          </div>
        </div>
      )}

      {/* Tableau des questionnaires */}
      {questionnaires.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun questionnaire</h3>
          <p className="text-gray-500">Vous n&apos;avez pas encore de questionnaires dans votre historique.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pathologie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date de création
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Envoi programmé
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {questionnaires.map((questionnaire) => (
                  <tr key={questionnaire.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{questionnaire.pathologie || 'Sans nom'}</div>
                      {/* Message RGPD pour les emails visibles */}
                      {isEmailVisible(questionnaire) && (
                        <p className="text-xs text-orange-600 mt-1 flex items-center">
                          <span className="mr-1">🔒</span>
                          L&apos;email sera automatiquement remplacé par &apos;PURGED&apos; dès l&apos;envoi
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(questionnaire.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(questionnaire.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getScheduleBadge(questionnaire)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {questionnaire.score_resultat ? (
                        <div className="flex items-center">
                          <span className="text-sm font-semibold text-gray-900">
                            {questionnaire.score_resultat}/5
                          </span>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                questionnaire.score_resultat >= 4
                                  ? 'bg-green-500'
                                  : questionnaire.score_resultat >= 3
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${(questionnaire.score_resultat / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {questionnaire.status === 'Complété' ? (
                        <button
                          onClick={() => handleViewDetails(questionnaire)}
                          className="inline-flex items-center px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors text-sm"
                        >
                          <Eye className="w-4 h-4 mr-1.5" />
                          Détails
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {showModal && selectedQuestionnaire && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header du modal */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Détails de la réponse</h2>
                <p className="text-sm text-gray-600 mt-1">{selectedQuestionnaire.pathologie || 'Sans nom'}</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Contenu du modal */}
            <div className="p-6 space-y-6">
              {/* Informations générales */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Date de réponse</p>
                    <p className="text-sm text-blue-900 font-medium">
                      {selectedQuestionnaire.updated_at
                        ? formatDate(selectedQuestionnaire.updated_at)
                        : formatDate(selectedQuestionnaire.created_at)}
                    </p>
                  </div>
                  {selectedQuestionnaire.score_resultat && (
                    <div>
                      <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">Score global</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-blue-900">
                          {selectedQuestionnaire.score_resultat}/5
                        </span>
                        <div className="flex-1 bg-blue-200 rounded-full h-2 max-w-24">
                          <div
                            className={`h-2 rounded-full ${
                              selectedQuestionnaire.score_resultat >= 4
                                ? 'bg-green-500'
                                : selectedQuestionnaire.score_resultat >= 3
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${(selectedQuestionnaire.score_resultat / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Questions et réponses */}
              {selectedQuestionnaire.reponses && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-primary" />
                    Questions et réponses
                  </h3>

                  {/* Afficher les questions depuis le champ questions */}
                  {selectedQuestionnaire.questions && Array.isArray(selectedQuestionnaire.questions) && selectedQuestionnaire.questions.length > 0 ? (
                    selectedQuestionnaire.questions.map((question: any, index: number) => {
                      const questionText = typeof question === 'string' ? question : question.question || question.text || `Question ${index + 1}`
                      const answer = selectedQuestionnaire.reponses?.answers?.[index] || 
                                     selectedQuestionnaire.reponses?.painLevel || 
                                     selectedQuestionnaire.reponses?.feeling || 
                                     selectedQuestionnaire.reponses?.remarks || 
                                     'Non répondue'

                      return (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                              Question {index + 1}
                            </h4>
                            {typeof answer === 'number' && (
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm bg-primary/10 text-primary">
                                {answer}/5
                              </span>
                            )}
                          </div>
                          <p className="text-base font-medium text-gray-900 mb-3">{questionText}</p>
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            {typeof answer === 'number' ? (
                              <div className="flex items-center space-x-3">
                                <span className="text-2xl font-bold text-gray-900">{answer}</span>
                                <span className="text-sm text-gray-600">sur 5</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-32">
                                  <div
                                    className={`h-2 rounded-full ${
                                      answer >= 4
                                        ? 'bg-green-500'
                                        : answer >= 3
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                    }`}
                                    style={{ width: `${(answer / 5) * 100}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{String(answer)}</p>
                            )}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    // Fallback : afficher les réponses brutes si pas de questions structurées
                    <div className="space-y-4">
                      {selectedQuestionnaire.reponses.painLevel && (
                        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                            Niveau de douleur / Évaluation
                          </h4>
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl font-bold text-gray-900">{selectedQuestionnaire.reponses.painLevel}</span>
                              <span className="text-sm text-gray-600">sur 10</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {selectedQuestionnaire.reponses.feeling && (
                        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                            Comment vous sentez-vous ?
                          </h4>
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedQuestionnaire.reponses.feeling}</p>
                          </div>
                        </div>
                      )}
                      {selectedQuestionnaire.reponses.remarks && (
                        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                            Remarques particulières
                          </h4>
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedQuestionnaire.reponses.remarks}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Message si pas de réponses */}
              {!selectedQuestionnaire.reponses && (
                <div className="text-center py-8 text-gray-500">
                  <p>Aucune réponse disponible pour ce questionnaire.</p>
                </div>
              )}
            </div>

            {/* Footer du modal */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
