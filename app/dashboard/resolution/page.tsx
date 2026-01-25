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
  Mail,
  Send,
  Search,
  Bell,
  RefreshCw,
  XCircle
} from 'lucide-react'

// Types
type AlertStatus = 'all' | 'critical' | 'in-progress' | 'resolved' | 'sent' | 'reminder'

interface QuestionnaireResponse {
  id: string
  questionnaire_id: string
  pathologie: string
  score_total: number | null // Null pour les programmés
  average_score: number | null
  submitted_at: string // Date de soumission OU de création pour les programmés
  answers: number[]
  patient_email: string | null
  patient_name?: string // Extrait de l'email ou null
  questions?: Array<{ text: string;[key: string]: any }> // Libellés des questions
  // Nouveaux champs pour les questionnaires programmés
  isPending?: boolean
  isSent?: boolean // Pour les questionnaires envoyés
  status?: string // 'programmé', 'envoyé', etc.
  sendDate?: string | null
  sentAt?: string | null // Date réelle d'envoi
  needsReminder?: boolean // Pour les questionnaires envoyés sans réponse
  hasResponse?: boolean // True si une réponse existe pour ce questionnaire
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

  // Si la date est dans le futur (pour les programmés)
  if (diffMs < 0) {
    const diffMins = Math.abs(Math.floor(diffMs / 60000))
    const diffHours = Math.abs(Math.floor(diffMs / 3600000))
    const diffDays = Math.abs(Math.floor(diffMs / 86400000))

    if (diffDays === 1) return 'Demain'
    if (diffDays > 1) return `Dans ${diffDays} jours`
    if (diffHours > 0) return `Dans ${diffHours}h`
    return 'Bientôt'
  }

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
  return namePart
    .split(/[._-]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

// Obtenir la réponse spécifique qui a déclenché l'alerte
const getCriticalResponses = (
  answers: number[],
  questions?: Array<{ text: string;[key: string]: any }>
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
  const [searchQuery, setSearchQuery] = useState('')
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
    return () => { isMountedRef.current = false }
  }, [])

  // Charger les données (Réponses + Questionnaires programmés)
  useEffect(() => {
    const loadData = async () => {
      if (!isMountedRef.current) return

      try {
        if (isMountedRef.current) setLoading(true)

        const { supabase } = await import('@/lib/supabase') as any
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          if (isMountedRef.current) {
            setResponses([])
            setLoading(false)
          }
          return
        }

        // 1. Récupérer les RÉPONSES (Questionnaires complétés)
        const { data: responsesData, error: responsesError } = await supabase
          .from('responses')
          .select('id, questionnaire_id, pathologie, score_total, average_score, submitted_at, answers')
          .eq('user_id', user.id)
          .order('submitted_at', { ascending: false })

        if (responsesError) console.error('[Resolution] Erreur chargement réponses:', responsesError.message)

        // 2. Récupérer les questionnaires EN ATTENTE / PROGRAMMÉS
        const { data: pendingData, error: pendingError } = await supabase
          .from('questionnaires')
          .select('id, pathologie, patient_email, questions, created_at, send_after_days, status')
          .eq('user_id', user.id)
          .eq('status', 'programmé') // Seulement ceux à venir
          .order('created_at', { ascending: false })

        if (pendingError) console.error('[Resolution] Erreur chargement programmés:', pendingError.message)

        // 3. Récupérer les questionnaires ENVOYÉS
        const { data: sentData, error: sentError } = await supabase
          .from('questionnaires')
          .select('id, pathologie, patient_email, questions, created_at, send_after_days, status, sent_at')
          .eq('user_id', user.id)
          .eq('status', 'envoyé')
          .order('sent_at', { ascending: false })

        if (sentError) console.error('[Resolution] Erreur chargement envoyés:', sentError.message)

        // --- TRAITEMENT DES RÉPONSES ---
        // Récupérer les infos manquantes (email, questions) pour les réponses
        const questionnaireIds = [...new Set((responsesData || []).map((r: any) => r.questionnaire_id).filter(Boolean))]
        let qsInfoMap = new Map()

        if (questionnaireIds.length > 0) {
          const { data } = await supabase
            .from('questionnaires')
            .select('id, patient_email, questions')
            .eq('user_id', user.id)
            .in('id', questionnaireIds)

          qsInfoMap = new Map((data || []).map((q: any) => [q.id, q]))
        }

        const formattedResponses: QuestionnaireResponse[] = (responsesData || []).map((r: any) => {
          const qInfo = qsInfoMap.get(r.questionnaire_id) || {}
          return {
            id: r.id,
            questionnaire_id: r.questionnaire_id,
            pathologie: r.pathologie,
            score_total: r.score_total,
            average_score: r.average_score,
            submitted_at: r.submitted_at,
            answers: Array.isArray(r.answers) ? r.answers : [],
            patient_email: qInfo.patient_email || null,
            patient_name: extractNameFromEmail(qInfo.patient_email),
            questions: Array.isArray(qInfo.questions) ? qInfo.questions : [],
            isPending: false
          }
        })

        // --- TRAITEMENT DES PROGRAMMÉS ---
        const formattedPending: QuestionnaireResponse[] = (pendingData || []).map((q: any) => {
          // Calculer la date d'envoi théorique
          const createdDate = new Date(q.created_at)
          const sendDate = new Date(createdDate)
          if (q.send_after_days) {
            sendDate.setDate(sendDate.getDate() + q.send_after_days)
          }

          return {
            id: q.id,
            questionnaire_id: q.id, // Idem
            pathologie: q.pathologie,
            score_total: null, // Pas de score
            average_score: null,
            submitted_at: q.created_at, // Date de création pour le tri
            answers: [],
            patient_email: q.patient_email,
            patient_name: extractNameFromEmail(q.patient_email),
            questions: q.questions,
            isPending: true,
            isSent: false,
            status: q.status,
            sendDate: sendDate.toISOString(),
            sentAt: null
          }
        })

        // --- TRAITEMENT DES ENVOYÉS ---
        // Identifier les questionnaires envoyés qui ont déjà une réponse
        const sentIdsWithResponses = new Set(
          (responsesData || []).map((r: any) => r.questionnaire_id)
        )

        const formattedSent: QuestionnaireResponse[] = (sentData || []).map((q: any) => {
          const hasResponse = sentIdsWithResponses.has(q.id)
          // Calculer si une relance est nécessaire (envoyé depuis + de 3 jours et pas de réponse)
          const sentDate = q.sent_at ? new Date(q.sent_at) : new Date(q.created_at)
          const daysSinceSent = Math.floor((Date.now() - sentDate.getTime()) / (1000 * 60 * 60 * 24))
          const needsReminder = !hasResponse && daysSinceSent >= 3

          return {
            id: q.id,
            questionnaire_id: q.id,
            pathologie: q.pathologie,
            score_total: null,
            average_score: null,
            submitted_at: q.sent_at || q.created_at,
            answers: [],
            patient_email: q.patient_email,
            patient_name: extractNameFromEmail(q.patient_email),
            questions: q.questions,
            isPending: false,
            isSent: true,
            status: q.status,
            sendDate: null,
            sentAt: q.sent_at,
            needsReminder,
            hasResponse
          }
        })

        if (isMountedRef.current) {
          // Fusionner et trier par date (le plus récent en premier)
          const merged = [...formattedPending, ...formattedSent, ...formattedResponses].sort((a, b) => {
            // Pour le tri, on utilise submitted_at (qui est created_at pour les pending, sent_at pour les envoyés)
            return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
          })

          setResponses(merged)

          // Charger les résolutions localStorage
          const savedResolutions = localStorage.getItem('alert_resolutions')
          if (savedResolutions) {
            try {
              setResolutions(new Map(Object.entries(JSON.parse(savedResolutions))))
            } catch (e) {
              console.error('Erreur parsing résolutions', e)
            }
          }
          setLoading(false)
        }
      } catch (err: any) {
        console.error('[Resolution] Erreur globale:', err?.message)
        if (isMountedRef.current) setLoading(false)
      }
    }

    if (isMounted) loadData()
  }, [isMounted])

  const getAlertStatus = (response: QuestionnaireResponse): 'new' | 'in-progress' | 'resolved' => {
    // Si c'est un questionnaire programmé, il est automatiquement "En cours"
    if (response.isPending) return 'in-progress'
    // Sinon, on regarde les résolutions manuelles
    const resolution = resolutions.get(response.id)
    return resolution?.status || 'new'
  }

  const filteredResponses = responses.filter((response) => {
    const status = getAlertStatus(response)

    // Filtre de recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const matchesName = response.patient_name?.toLowerCase().includes(query)
      const matchesEmail = response.patient_email?.toLowerCase().includes(query)
      const matchesPathologie = response.pathologie?.toLowerCase().includes(query)
      if (!matchesName && !matchesEmail && !matchesPathologie) return false
    }

    if (selectedStatus === 'all') return true
    // Critique seulement si score existe et <= 2
    if (selectedStatus === 'critical') return (response.score_total !== null && response.score_total <= 2)
    if (selectedStatus === 'in-progress') return status === 'in-progress'
    if (selectedStatus === 'resolved') return status === 'resolved'
    if (selectedStatus === 'sent') return response.isSent === true && !response.needsReminder
    if (selectedStatus === 'reminder') return response.needsReminder === true
    return true
  })

  // Compteurs
  const countCritical = responses.filter(r => r.score_total !== null && r.score_total <= 2).length
  // En cours : status 'in-progress' (incluant les pending)
  const countInProgress = responses.filter(r => getAlertStatus(r) === 'in-progress').length
  const countResolved = responses.filter(r => getAlertStatus(r) === 'resolved').length
  const countSent = responses.filter(r => r.isSent === true && !r.needsReminder).length
  const countReminder = responses.filter(r => r.needsReminder === true).length

  const handleTakeAction = (response: QuestionnaireResponse) => {
    const resolution: AlertResolution = {
      response_id: response.id,
      status: 'in-progress',
      assigned_to: 'Vous',
    }
    const newResolutions = new Map(resolutions)
    newResolutions.set(response.id, resolution)
    setResolutions(newResolutions)
    localStorage.setItem('alert_resolutions', JSON.stringify(Object.fromEntries(newResolutions)))
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
      localStorage.setItem('alert_resolutions', JSON.stringify(Object.fromEntries(newResolutions)))
      setSelectedAlert(null)
      setResolutionNote('')
    }
  }

  const [sendingReminder, setSendingReminder] = useState<string | null>(null)
  const [cancellingReminder, setCancellingReminder] = useState<string | null>(null)

  const handleSendReminder = async (response: QuestionnaireResponse) => {
    if (!response.patient_email || sendingReminder) return

    setSendingReminder(response.id)
    try {
      // Get auth token from Supabase session
      const { supabase } = await import('@/lib/supabase') as any
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        alert('❌ Erreur: Session expirée. Veuillez vous reconnecter.')
        return
      }

      const res = await fetch('/api/send-followup-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          patientEmail: response.patient_email,
          pathologie: response.pathologie,
          questionnaireId: response.id,
          isReminder: true,
        }),
      })

      if (res.ok) {
        alert('✅ Relance envoyée avec succès !')
        // Refresh data
        window.location.reload()
      } else {
        const data = await res.json()
        alert(`❌ Erreur: ${data.error || 'Échec de l\'envoi'}`)
      }
    } catch (err) {
      console.error('Erreur envoi relance:', err)
      alert('❌ Erreur lors de l\'envoi de la relance')
    } finally {
      setSendingReminder(null)
    }
  }

  const handleCancelReminder = async (questionnaireId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (cancellingReminder) return

    if (!confirm('Voulez-vous vraiment annuler la relance automatique pour ce questionnaire ?')) {
      return
    }

    setCancellingReminder(questionnaireId)
    try {
      const { supabase } = await import('@/lib/supabase') as any
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        alert('❌ Erreur: Session expirée. Veuillez vous reconnecter.')
        return
      }

      const res = await fetch('/api/cancel-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ questionnaireId }),
      })

      if (res.ok) {
        alert('✅ Relance annulée avec succès !')
        window.location.reload()
      } else {
        const data = await res.json()
        alert(`❌ Erreur: ${data.error || 'Échec de l\'annulation'}`)
      }
    } catch (err) {
      console.error('Erreur annulation relance:', err)
      alert('❌ Erreur lors de l\'annulation de la relance')
    } finally {
      setCancellingReminder(null)
    }
  }

  const statusFilters: { id: AlertStatus; label: string; count: number; highlight?: boolean }[] = [
    { id: 'all', label: 'Toutes', count: responses.length },
    { id: 'critical', label: 'Critiques', count: countCritical },
    { id: 'in-progress', label: 'En cours', count: countInProgress },
    { id: 'resolved', label: 'Résolues', count: countResolved },
    { id: 'sent', label: 'Envoyé', count: countSent },
    { id: 'reminder', label: 'RELANCE', count: countReminder, highlight: true },
  ]

  if (!isMounted) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900">Centre de Résolution</h1>
        <p className="text-gray-600 mt-2">Gérez vos retours patients et visualisez les envois programmés.</p>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex flex-wrap items-center gap-3">
          {statusFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => { setSelectedStatus(filter.id); setSelectedAlert(null); }}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${filter.highlight && filter.count > 0
                ? selectedStatus === filter.id
                  ? 'bg-orange-500 text-white shadow-md animate-pulse'
                  : 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-2 border-orange-300'
                : selectedStatus === filter.id
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {filter.highlight && <RefreshCw className="w-4 h-4" />}
              {filter.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${filter.highlight && filter.count > 0
                ? selectedStatus === filter.id ? 'bg-white/20 text-white' : 'bg-orange-200 text-orange-800'
                : selectedStatus === filter.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                {filter.count}
              </span>
            </button>
          ))}

          {/* Barre de recherche */}
          <div className="flex-1 min-w-[200px] max-w-md ml-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, email ou pathologie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`space-y-4 ${selectedAlert ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          {filteredResponses.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
              <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucun élément</p>
            </div>
          ) : (
            filteredResponses.map((response) => {
              const status = getAlertStatus(response)
              const isSelected = selectedAlert?.id === response.id
              const isCritical = response.score_total !== null && response.score_total <= 2
              const isPending = response.isPending
              const isSent = response.isSent

              return (
                <div
                  key={response.id}
                  onClick={() => setSelectedAlert(response)}
                  className={`bg-white rounded-lg shadow-sm border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${isSelected ? 'border-primary shadow-md' : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="p-5">
                    {/* Header Carte */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${isSent ? 'bg-green-500' : (isPending ? 'bg-blue-400' : (isCritical ? 'bg-red-500' : 'bg-orange-500'))
                          }`} />
                        <div className="flex items-center space-x-2">
                          {isSent ? <Send className="w-5 h-5 text-green-600" /> : (isPending ? <Clock className="w-5 h-5 text-gray-600" /> : <FileText className="w-5 h-5 text-gray-600" />)}
                          <span className="text-sm font-medium text-gray-900">
                            {isSent ? 'Email Envoyé' : (isPending ? 'Envoi Programmé' : 'Retour Questionnaire')}
                          </span>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${isSent ? 'bg-green-100 text-green-800' : (status === 'resolved' ? 'bg-green-100 text-green-800' :
                        status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800')
                        }`}>
                        {isSent ? 'Envoyé' : (status === 'resolved' ? 'Résolue' : status === 'in-progress' ? 'En cours' : 'Nouvelle')}
                      </div>
                    </div>

                    {/* Patient */}
                    <div className="flex items-center space-x-2 mb-3">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold text-gray-900">{response.patient_name}</span>
                      {response.patient_email && <span className="text-sm text-gray-500">({response.patient_email})</span>}
                    </div>

                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-700">Pathologie: </span>
                      <span className="text-sm text-gray-900">{response.pathologie}</span>
                    </div>

                    {/* Score ou Date d'envoi */}
                    <div className="mb-4">
                      {isSent ? (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg w-fit">
                            <Send className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              Envoyé le : {response.sentAt ? new Date(response.sentAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date inconnue'}
                            </span>
                          </div>
                          {/* Badge relance prévue */}
                          {response.sentAt && (() => {
                            const sentDate = new Date(response.sentAt)
                            const reminderDate = new Date(sentDate)
                            reminderDate.setDate(reminderDate.getDate() + 3) // Relance après 3 jours
                            const now = new Date()
                            const daysUntilReminder = Math.ceil((reminderDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

                            if (daysUntilReminder > 0) {
                              return (
                                <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-lg w-fit">
                                  <Bell className="w-4 h-4" />
                                  <span className="text-sm font-medium">
                                    Relance auto dans {daysUntilReminder} jour{daysUntilReminder > 1 ? 's' : ''}
                                  </span>
                                  <button
                                    onClick={(e) => handleCancelReminder(response.id, e)}
                                    disabled={cancellingReminder === response.id}
                                    className="ml-2 p-1 hover:bg-orange-200 rounded-full transition-colors"
                                    title="Annuler la relance"
                                  >
                                    {cancellingReminder === response.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-orange-700 hover:text-red-600" />
                                    )}
                                  </button>
                                </div>
                              )
                            } else if (daysUntilReminder === 0) {
                              return (
                                <div className="flex items-center space-x-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-lg w-fit animate-pulse">
                                  <Bell className="w-4 h-4" />
                                  <span className="text-sm font-medium">⏰ Relance prévue aujourd&apos;hui</span>
                                </div>
                              )
                            }
                            return null
                          })()}
                        </div>
                      ) : isPending ? (
                        <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 px-3 py-2 rounded-lg w-fit">
                          <Mail className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            Prévu pour : {response.sendDate ? formatTimestamp(response.sendDate) : 'Date inconnue'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3">
                          {/* Jauge visuelle du score */}
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <div
                                key={level}
                                className={`w-3 h-6 rounded-sm transition-all ${response.score_total !== null && level <= response.score_total
                                  ? response.score_total <= 2
                                    ? 'bg-red-500'
                                    : response.score_total === 3
                                      ? 'bg-orange-400'
                                      : 'bg-green-500'
                                  : 'bg-gray-200'
                                  }`}
                              />
                            ))}
                          </div>
                          <span className={`text-sm font-bold ${response.score_total !== null && response.score_total <= 2
                            ? 'text-red-600'
                            : response.score_total === 3
                              ? 'text-orange-600'
                              : 'text-green-600'
                            }`}>
                            {response.score_total}/5
                          </span>
                          {isCritical && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded animate-pulse">
                              Critique
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>Créé {formatTimestamp(response.submitted_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {response.needsReminder && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSendReminder(response); }}
                            disabled={sendingReminder === response.id}
                            className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            {sendingReminder === response.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                            Relancer
                          </button>
                        )}
                        {!isPending && !response.needsReminder && status !== 'resolved' && !isSent && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleTakeAction(response); }}
                            className="px-4 py-1.5 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            Prendre en charge
                          </button>
                        )}
                        {isPending && (
                          <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
                            Automatique
                          </span>
                        )}
                        {isSent && !response.needsReminder && (
                          <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                            ✓ Délivré
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Détails Side Panel */}
        {selectedAlert && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
              <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedAlert.isPending ? 'Détails de l\'envoi' : 'Détails du retour'}
                </h2>
                <button onClick={() => setSelectedAlert(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-6">
                {/* Info Patient */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Patient</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 font-medium">{selectedAlert.patient_name}</span>
                    </div>
                    {selectedAlert.patient_email && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600 ml-6">
                        <Mail className="w-4 h-4" /><span>{selectedAlert.patient_email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Specifique Pending vs Response */}
                {selectedAlert.isPending ? (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">Statut de l&apos;envoi</h3>
                    <p className="text-sm text-blue-700 mb-2">
                      Ce questionnaire est programmé pour être envoyé automatiquement via le système de suivi.
                    </p>
                    <div className="flex items-center space-x-2 text-blue-800 font-semibold">
                      <Clock className="w-4 h-4" />
                      <span>
                        Envoi prévu : {selectedAlert.sendDate ? new Date(selectedAlert.sendDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Score */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Score</h3>
                      <span className={`text-2xl font-bold ${selectedAlert.score_total! <= 2 ? 'text-red-600' : 'text-orange-600'}`}>
                        {selectedAlert.score_total}/5
                      </span>
                    </div>

                    {/* Note Resolution */}
                    {getAlertStatus(selectedAlert) !== 'resolved' ? (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Note de résolution</h3>
                        <textarea
                          value={resolutionNote}
                          onChange={(e) => setResolutionNote(e.target.value)}
                          placeholder="Note..."
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                          rows={4}
                        />
                        <button
                          onClick={handleResolve}
                          disabled={!resolutionNote.trim()}
                          className="mt-3 w-full px-4 py-2 bg-primary text-white rounded-lg disabled:bg-gray-300"
                        >
                          Marquer comme résolu
                        </button>
                      </div>
                    ) : (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-green-900 font-medium">Résolue</p>
                        <p className="text-green-700 text-sm">{resolutions.get(selectedAlert.id)?.resolution_note}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
