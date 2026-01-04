'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  X,
  FileText,
  Loader2,
  Mail
} from 'lucide-react'

// Types
type AlertStatus = 'all' | 'critical' | 'in-progress' | 'resolved'

interface QuestionnaireResponse {
  id: string
  questionnaire_id: string
  pathologie: string
  score_total: number
  average_score: number | null
  submitted_at: string
  answers: number[]
  patient_email: string | null
  patient_name?: string // Extrait de l'email ou null
  questions?: Array<{ text: string; [key: string]: any }> // Libellés des questions
}

interface AlertResolution {
  response_id: string
  status: 'new' | 'in-progress' | 'resolved'
  resolution_note?: string
  resolved_at?: string
  assigned_to?: string
}

const formatTimestamp = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'À l\'instant'
  if (diffMins < 60) return `Il y a ${diffMins} min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays === 1) return 'Hier'
  return `Il y a ${diffDays} jours`
}

// Extraire le nom du patient depuis l'email
const extractNameFromEmail = (email: string | null): string => {
  if (!email) return 'Patient inconnu'
  const namePart = email.split('@')[0]
  // Convertir email format "prenom.nom" en "Prénom Nom"
  return namePart
    .split(/[._-]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

// Obtenir la réponse spécifique qui a déclenché l'alerte avec le libellé de la question
const getCriticalResponses = (
  answers: number[],
  questions?: Array<{ text: string; [key: string]: any }>
): Array<{ text: string; score: number; index: number }> => {
  const criticalResponses: Array<{ text: string; score: number; index: number }> = []
  
  answers.forEach((answer, index) => {
    if (answer <= 2) {
      const questionText = questions && questions[index] 
        ? questions[index].text 
        : `Question ${index + 1}`
      
      criticalResponses.push({
        text: questionText,
        score: answer,
        index: index + 1,
      })
    }
  })
  
  return criticalResponses
}

export default function ResolutionPage() {
  const [isMounted, setIsMounted] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<AlertStatus>('all')
  const [selectedAlert, setSelectedAlert] = useState<QuestionnaireResponse | null>(null)
  const [resolutionNote, setResolutionNote] = useState('')
  const [responses, setResponses] = useState<QuestionnaireResponse[]>([])
  const [resolutions, setResolutions] = useState<Map<string, AlertResolution>>(new Map())
  const [loading, setLoading] = useState(true)
  const isMountedRef = useRef(true)

  // Protection isMounted
  useEffect(() => {
    setIsMounted(true)
    isMountedRef.current = true
    
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Charger les réponses de questionnaires depuis Supabase
  useEffect(() => {
    const loadQuestionnaireResponses = async () => {
      if (!isMountedRef.current) return

      try {
        if (isMountedRef.current) {
          setLoading(true)
        }

        const { supabase } = await import('@/lib/supabase') as any
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          if (isMountedRef.current) {
            setResponses([])
            setLoading(false)
          }
          return
        }

        // Récupérer les réponses
        const { data: responsesData, error: responsesError } = await supabase
          .from('responses')
          .select('id, questionnaire_id, pathologie, score_total, average_score, submitted_at, answers')
          .eq('user_id', user.id)
          .order('submitted_at', { ascending: false })

        if (responsesError) {
          console.error('[Resolution] Erreur chargement réponses:', responsesError.message)
          if (isMountedRef.current) {
            setResponses([])
            setLoading(false)
          }
          return
        }

        // Récupérer les questionnaires correspondants pour obtenir les emails et les questions
        const questionnaireIds = [...new Set((responsesData || []).map((r: any) => r.questionnaire_id).filter(Boolean))]
        let questionnairesData: any[] = []
        
        if (questionnaireIds.length > 0) {
          const { data } = await supabase
            .from('questionnaires')
            .select('id, patient_email, questions')
            .eq('user_id', user.id)
            .in('id', questionnaireIds)
          
          questionnairesData = data || []
        }

        // Créer un map pour accéder rapidement aux emails et questions
        const questionnaireMap = new Map(
          (questionnairesData || []).map((q: any) => [
            q.id, 
            { 
              patient_email: q.patient_email,
              questions: Array.isArray(q.questions) ? q.questions : []
            }
          ])
        )

        // Transformer les données pour ajouter patient_email et questions
        const formattedResponses: QuestionnaireResponse[] = (responsesData || []).map((r: any) => {
          const questionnaireData = questionnaireMap.get(r.questionnaire_id) || { patient_email: null, questions: [] }
          const patient_email = questionnaireData.patient_email || null
          
          return {
            id: r.id,
            questionnaire_id: r.questionnaire_id,
            pathologie: r.pathologie,
            score_total: r.score_total,
            average_score: r.average_score,
            submitted_at: r.submitted_at,
            answers: Array.isArray(r.answers) ? r.answers : [],
            patient_email,
            patient_name: extractNameFromEmail(patient_email),
            questions: questionnaireData.questions,
          }
        })

        if (isMountedRef.current) {
          setResponses(formattedResponses)
          
          // Charger les résolutions depuis le localStorage (ou depuis une table dédiée plus tard)
          const savedResolutions = localStorage.getItem('alert_resolutions')
          if (savedResolutions) {
            try {
              const parsed = JSON.parse(savedResolutions)
              setResolutions(new Map(Object.entries(parsed)))
            } catch (e) {
              console.error('Erreur parsing résolutions:', e)
            }
          }
          
          setLoading(false)
        }
      } catch (err: any) {
        console.error('[Resolution] Erreur:', err?.message)
        if (isMountedRef.current) {
          setResponses([])
          setLoading(false)
        }
      }
    }

    if (isMounted) {
      loadQuestionnaireResponses()
    }
  }, [isMounted])

  // Obtenir le statut d'une alerte
  const getAlertStatus = (responseId: string): 'new' | 'in-progress' | 'resolved' => {
    const resolution = resolutions.get(responseId)
    return resolution?.status || 'new'
  }

  // Filtrer les alertes selon le statut sélectionné
  const filteredResponses = responses.filter((response) => {
    const status = getAlertStatus(response.id)
    
    if (selectedStatus === 'all') return true
    if (selectedStatus === 'critical') return response.score_total <= 2
    if (selectedStatus === 'in-progress') return status === 'in-progress'
    if (selectedStatus === 'resolved') return status === 'resolved'
    return true
  })

  const handleTakeAction = (response: QuestionnaireResponse) => {
    const resolution: AlertResolution = {
      response_id: response.id,
      status: 'in-progress',
      assigned_to: 'Vous',
    }
    
    const newResolutions = new Map(resolutions)
    newResolutions.set(response.id, resolution)
    setResolutions(newResolutions)
    
    // Sauvegarder dans localStorage
    const toSave = Object.fromEntries(newResolutions)
    localStorage.setItem('alert_resolutions', JSON.stringify(toSave))
    
    setSelectedAlert(response)
    setResolutionNote('')
  }

  const handleResolve = () => {
    if (selectedAlert && resolutionNote.trim()) {
      const resolution: AlertResolution = {
        response_id: selectedAlert.id,
        status: 'resolved',
        resolution_note: resolutionNote.trim(),
        resolved_at: new Date().toISOString(),
        assigned_to: 'Vous',
      }
      
      const newResolutions = new Map(resolutions)
      newResolutions.set(selectedAlert.id, resolution)
      setResolutions(newResolutions)
      
      // Sauvegarder dans localStorage
      const toSave = Object.fromEntries(newResolutions)
      localStorage.setItem('alert_resolutions', JSON.stringify(toSave))
      
      setSelectedAlert(null)
      setResolutionNote('')
    }
  }

  const statusFilters: { id: AlertStatus; label: string; count: number }[] = [
    {
      id: 'all',
      label: 'Toutes',
      count: responses.length,
    },
    {
      id: 'critical',
      label: 'Critiques',
      count: responses.filter((r) => r.score_total <= 2).length,
    },
    {
      id: 'in-progress',
      label: 'En cours',
      count: responses.filter((r) => getAlertStatus(r.id) === 'in-progress').length,
    },
    {
      id: 'resolved',
      label: 'Résolues',
      count: responses.filter((r) => getAlertStatus(r.id) === 'resolved').length,
    },
  ]

  // Protection contre les erreurs d'hydratation
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <div className="text-gray-600">Chargement...</div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <div className="text-lg font-medium text-gray-900 mb-1">Chargement des retours...</div>
          <div className="text-sm text-gray-500">Récupération des questionnaires patients</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900">Centre de Résolution</h1>
        <p className="text-gray-600 mt-2">Gérez et résolvez les retours de questionnaires patients</p>
      </div>

      {/* Filtres de statut */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex flex-wrap gap-3">
          {statusFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => {
                setSelectedStatus(filter.id)
                setSelectedAlert(null)
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                selectedStatus === filter.id
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                selectedStatus === filter.id
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {filter.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Contenu principal - Deux colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche - Liste des alertes */}
        <div className={`space-y-4 ${selectedAlert ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {filteredResponses.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
              <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucun retour à afficher</p>
              <p className="text-gray-400 text-sm mt-2">
                {selectedStatus === 'all' 
                  ? 'Aucun questionnaire retourné pour le moment' 
                  : selectedStatus === 'critical'
                  ? 'Aucune alerte critique'
                  : selectedStatus === 'in-progress'
                  ? 'Aucune alerte en cours'
                  : 'Aucune alerte résolue'}
              </p>
            </div>
          ) : (
            filteredResponses.map((response) => {
              const status = getAlertStatus(response.id)
              const isSelected = selectedAlert?.id === response.id
              const criticalResponses = getCriticalResponses(response.answers, response.questions)
              const isCritical = response.score_total <= 2

              return (
                <div
                  key={response.id}
                  onClick={() => setSelectedAlert(response)}
                  className={`bg-white rounded-lg shadow-sm border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${
                    isSelected
                      ? 'border-primary shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="p-5">
                    {/* En-tête de la carte */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3 flex-1">
                        {/* Indicateur de sévérité */}
                        <div
                          className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            isCritical
                              ? 'bg-red-500'
                              : 'bg-orange-500'
                          }`}
                        />
                        {/* Type d'alerte */}
                        <div className="flex items-center space-x-2">
                          <FileText className="w-5 h-5 text-gray-600" />
                          <span className="text-sm font-medium text-gray-900">
                            Retour Questionnaire
                          </span>
                        </div>
                      </div>
                      {/* Badge de statut */}
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          status === 'resolved'
                            ? 'bg-green-100 text-green-800'
                            : status === 'in-progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {status === 'resolved'
                          ? 'Résolue'
                          : status === 'in-progress'
                          ? 'En cours'
                          : 'Nouvelle'}
                      </div>
                    </div>

                    {/* Informations patient */}
                    <div className="flex items-center space-x-2 mb-3">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold text-gray-900">
                        {response.patient_name || 'Patient inconnu'}
                      </span>
                      {response.patient_email && (
                        <span className="text-sm text-gray-500">({response.patient_email})</span>
                      )}
                    </div>

                    {/* Pathologie */}
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-700">Pathologie: </span>
                      <span className="text-sm text-gray-900">{response.pathologie}</span>
                    </div>

                    {/* Score et réponse spécifique */}
                    <div className="mb-4 space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-semibold ${
                          isCritical ? 'text-red-600' : 'text-orange-600'
                        }`}>
                          Score: {response.score_total}/5
                        </span>
                        {isCritical && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                            Critique
                          </span>
                        )}
                      </div>
                      {criticalResponses.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-gray-600">Réponses critiques:</span>
                          {criticalResponses.slice(0, 2).map((resp, idx) => (
                            <div key={idx} className="text-sm text-gray-700 bg-red-50 p-2 rounded border border-red-100">
                              <span className="font-medium">{resp.text}</span>
                              <span className="text-red-600 ml-2">({resp.score}/5)</span>
                            </div>
                          ))}
                          {criticalResponses.length > 2 && (
                            <div className="text-xs text-gray-500 italic">
                              +{criticalResponses.length - 2} autre{criticalResponses.length - 2 > 1 ? 's' : ''} réponse{criticalResponses.length - 2 > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{formatTimestamp(response.submitted_at)}</span>
                      </div>
                      {status !== 'resolved' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTakeAction(response)
                          }}
                          className="px-4 py-1.5 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Prendre en charge
                        </button>
                      )}
                      {status === 'resolved' && (
                        <span className="text-xs text-gray-500">
                          Résolu par {resolutions.get(response.id)?.assigned_to || 'Vous'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Colonne droite - Panneau de détails (conditionnel) */}
        {selectedAlert && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
              {/* En-tête du panneau */}
              <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Détails du retour</h2>
                <button
                  onClick={() => {
                    setSelectedAlert(null)
                    setResolutionNote('')
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contenu du panneau */}
              <div className="p-5 space-y-6">
                {/* Informations patient */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Patient</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 font-medium">
                        {selectedAlert.patient_name || 'Patient inconnu'}
                      </span>
                    </div>
                    {selectedAlert.patient_email && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600 ml-6">
                        <Mail className="w-4 h-4" />
                        <span>{selectedAlert.patient_email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pathologie */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Pathologie</h3>
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-900">{selectedAlert.pathologie}</span>
                  </div>
                </div>

                {/* Score */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Score</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`text-2xl font-bold ${
                      selectedAlert.score_total <= 2 ? 'text-red-600' : 'text-orange-600'
                    }`}>
                      {selectedAlert.score_total}/5
                    </span>
                    {selectedAlert.score_total <= 2 && (
                      <span className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full font-medium">
                        Critique
                      </span>
                    )}
                  </div>
                  {selectedAlert.average_score && (
                    <div className="text-xs text-gray-500 mt-1">
                      Moyenne précise: {selectedAlert.average_score.toFixed(2)}/5
                    </div>
                  )}
                </div>

                {/* Réponses critiques */}
                {getCriticalResponses(selectedAlert.answers, selectedAlert.questions).length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Réponses critiques</h3>
                    <div className="space-y-2">
                      {getCriticalResponses(selectedAlert.answers, selectedAlert.questions).map((resp, idx) => (
                        <div key={idx} className="text-sm text-gray-700 bg-red-50 p-2 rounded border border-red-100">
                          <div className="font-medium mb-1">{resp.text}</div>
                          <div className="text-xs text-red-600">Score: {resp.score}/5</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Horodatage */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Date de retour</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{formatTimestamp(selectedAlert.submitted_at)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 ml-6">
                    {new Date(selectedAlert.submitted_at).toLocaleString('fr-FR')}
                  </div>
                </div>

                {/* Note de résolution */}
                {getAlertStatus(selectedAlert.id) !== 'resolved' ? (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Note de résolution
                    </h3>
                    <textarea
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      placeholder="Ajoutez une note expliquant la résolution..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none"
                    />
                    <button
                      onClick={handleResolve}
                      disabled={!resolutionNote.trim()}
                      className="mt-3 w-full px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Marquer comme résolu</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Note de résolution
                    </h3>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-green-900 font-medium mb-1">Résolue</p>
                          <p className="text-sm text-green-700">
                            {resolutions.get(selectedAlert.id)?.resolution_note || 'Aucune note'}
                          </p>
                          {resolutions.get(selectedAlert.id)?.resolved_at && (
                            <p className="text-xs text-green-600 mt-1">
                              {formatTimestamp(resolutions.get(selectedAlert.id)!.resolved_at!)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
