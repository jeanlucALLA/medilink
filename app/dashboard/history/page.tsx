'use client'

import { useState, useEffect } from 'react'
import { Eye, Calendar, FileText, Loader2, X, CheckCircle, Clock, Mail, Search, User, Send, XCircle } from 'lucide-react'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'programmé' | 'envoyé' | 'Complété'>('all')

  // Charger les questionnaires depuis Supabase
  useEffect(() => {
    let channel: any

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

        console.log('Chargement historique pour user:', user.id)

        // 1. Récupérer les RÉPONSES (Questionnaires complétés)
        const { data: responsesData, error: responsesError } = await supabase
          .from('responses')
          .select('id, questionnaire_id, pathologie, score_total, submitted_at, answers, metadata')
          .eq('user_id', user.id)
          .order('submitted_at', { ascending: false })

        if (responsesError) console.error('Erreur loading responses:', responsesError)

        // 2. Récupérer les questionnaires (Tous pour avoir les infos, ou juste les non-complétés)
        // On récupère tout pour avoir les métadonnées (titre, etc) des réponses
        const { data: questionnairesData, error: questionnairesError } = await supabase
          .from('questionnaires')
          .select('id, pathologie, statut, created_at, send_after_days, patient_email, questions')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (questionnairesError) {
          console.error('Erreur SQL questionnaires:', questionnairesError)
          setLoading(false)
          return
        }

        // Créer une Map des questionnaires pour accès rapide
        const questionnairesMap = new Map(questionnairesData?.map((q: any) => [q.id, q]))

        // Fusionner les données
        const mergedList: Questionnaire[] = []

        // Ajouter les réponses (Complétés)
        if (responsesData) {
          responsesData.forEach((r: any) => {
            const qDetails = questionnairesMap.get(r.questionnaire_id) as any
            mergedList.push({
              id: r.id, // ID de la réponse
              pathologie: r.pathologie || qDetails?.pathologie || 'Sans nom',
              status: 'Complété',
              created_at: qDetails?.created_at || r.submitted_at, // Date de création du questionnaire
              updated_at: r.submitted_at, // Date de réponse
              reponses: {
                answers: r.answers,
                ...r.metadata // Inclure metadata si existe
              },
              score_resultat: r.score_total,
              questions: qDetails?.questions || [],
              send_after_days: qDetails?.send_after_days,
              patient_email: qDetails?.patient_email
            })
          })
        }

        // Ajouter les questionnaires NON complétés (En attente / Programmé / Envoyé)
        if (questionnairesData) {
          questionnairesData.forEach((q: any) => {
            // Si le statut n'est PAS complété (ou si on n'a pas trouvé de réponse correspondante dans responsesData)
            // Note: On se base sur le fait que s'il y a une réponse, elle est dans mergedList via le bloc précédent.
            // On veut afficher ceux qui n'ont PAS encore de réponse.
            // Une façon simple : vérifier si l'ID du questionnaire est déjà référencé dans une réponse ?
            // Ou se fier au statut 'Complété'.
            const isCompleted = responsesData?.some((r: any) => r.questionnaire_id === q.id)

            if (!isCompleted && q.statut !== 'Complété') {
              mergedList.push({
                id: q.id,
                pathologie: q.pathologie,
                status: q.statut,
                created_at: q.created_at,
                updated_at: undefined,
                reponses: undefined,
                score_resultat: undefined,
                questions: q.questions,
                send_after_days: q.send_after_days,
                patient_email: q.patient_email
              })
            }
          })
        }

        // Trier par date la plus récente (updated_at ou created_at)
        mergedList.sort((a, b) => {
          const dateA = new Date(a.updated_at || a.created_at).getTime()
          const dateB = new Date(b.updated_at || b.created_at).getTime()
          return dateB - dateA
        })

        console.log('Données fusionnées:', mergedList.length)
        setQuestionnaires(mergedList)
        setLoading(false)

        // Subscription Realtime (Simplifiée : recharger tout si changement)
        channel = supabase
          .channel('realtime-history-global')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'responses', filter: `user_id=eq.${user.id}` },
            () => loadQuestionnaires()
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'questionnaires', filter: `user_id=eq.${user.id}` },
            () => loadQuestionnaires()
          )
          .subscribe()

      } catch (err: any) {
        console.error('Erreur chargement:', err)
        setLoading(false)
      }
    }

    loadQuestionnaires()

    // Cleanup
    return () => {
      if (channel) {
        import('@/lib/supabase').then(({ supabase }) => {
          supabase.removeChannel(channel)
        })
      }
    }
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
    const isPending = questionnaire.status === 'pending' || questionnaire.status === 'programmé' || questionnaire.status === 'en_attente'
    if (!isPending || !questionnaire.send_after_days || !questionnaire.created_at) {
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
    const isPending = questionnaire.status === 'pending' || questionnaire.status === 'programmé' || questionnaire.status === 'en_attente'
    if (isPending && questionnaire.send_after_days && questionnaire.patient_email) {
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
    const isPending = questionnaire.status === 'pending' || questionnaire.status === 'programmé' || questionnaire.status === 'en_attente'
    if (isPending && questionnaire.send_after_days && questionnaire.patient_email) {
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
      case 'envoyé':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Send className="w-3 h-3 mr-1" />
            Envoyé
          </span>
        )
      case 'expiré':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Expiré
          </span>
        )
      case 'en_attente':
      case 'programmé':
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

  // Compteurs pour les stats
  const countProgramme = questionnaires.filter(q => q.status === 'programmé' || q.status === 'pending' || q.status === 'en_attente').length
  const countEnvoye = questionnaires.filter(q => q.status === 'envoyé' || q.status === 'sent').length
  const countComplete = questionnaires.filter(q => q.status === 'Complété').length

  // Filtrer les questionnaires
  const filteredQuestionnaires = questionnaires.filter(q => {
    // Filtre de recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const matchesPathologie = q.pathologie?.toLowerCase().includes(query)
      const matchesEmail = q.patient_email?.toLowerCase().includes(query)
      if (!matchesPathologie && !matchesEmail) return false
    }

    // Filtre par statut
    if (selectedFilter === 'programmé') return q.status === 'programmé' || q.status === 'pending' || q.status === 'en_attente'
    if (selectedFilter === 'envoyé') return q.status === 'envoyé' || q.status === 'sent'
    if (selectedFilter === 'Complété') return q.status === 'Complété'
    return true
  })

  // Extraire le nom depuis l'email
  const extractName = (email: string | null | undefined): string => {
    if (!email || email === 'PURGED') return '—'
    const namePart = email.split('@')[0]
    return namePart
      .split(/[._-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ')
  }

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

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{questionnaires.length}</p>
          <p className="text-sm text-gray-500">Total</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{countProgramme}</p>
          <p className="text-sm text-gray-500">Programmés</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Send className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{countEnvoye}</p>
          <p className="text-sm text-gray-500">Envoyés</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{countComplete}</p>
          <p className="text-sm text-gray-500">Réponses</p>
        </div>
      </div>

      {/* Barre de recherche + Filtres */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex flex-wrap items-center gap-3">
          {/* Filtres */}
          {[
            { id: 'all', label: 'Tous', count: questionnaires.length },
            { id: 'programmé', label: 'Programmés', count: countProgramme },
            { id: 'envoyé', label: 'Envoyés', count: countEnvoye },
            { id: 'Complété', label: 'Réponses', count: countComplete },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${selectedFilter === filter.id
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {filter.label}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${selectedFilter === filter.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
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
                placeholder="Rechercher par pathologie ou email..."
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
      {filteredQuestionnaires.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun résultat</h3>
          <p className="text-gray-500">
            {searchQuery || selectedFilter !== 'all'
              ? 'Aucun questionnaire ne correspond à vos critères.'
              : 'Vous n&apos;avez pas encore de questionnaires dans votre historique.'
            }
          </p>
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
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date de création
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Envoi prévu
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
                {filteredQuestionnaires.map((questionnaire) => (
                  <tr key={questionnaire.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{questionnaire.pathologie || 'Sans nom'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{extractName(questionnaire.patient_email)}</div>
                          {questionnaire.patient_email && questionnaire.patient_email !== 'PURGED' && (
                            <div className="text-xs text-gray-500">{questionnaire.patient_email}</div>
                          )}
                        </div>
                      </div>
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
                      {(() => {
                        const scheduledDate = getScheduledDate(questionnaire)
                        if (scheduledDate) {
                          const daysRemaining = getDaysUntilScheduled(questionnaire)
                          return (
                            <div className="flex flex-col">
                              <div className="flex items-center text-sm text-gray-700">
                                <Mail className="w-4 h-4 mr-2 text-orange-500" />
                                {scheduledDate.toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                              {daysRemaining !== null && daysRemaining >= 0 && (
                                <span className="text-xs text-orange-600 mt-1 ml-6">
                                  {daysRemaining === 0 ? "Aujourd'hui" : `Dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`}
                                </span>
                              )}
                            </div>
                          )
                        }
                        return <span className="text-sm text-gray-400">—</span>
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {questionnaire.score_resultat ? (
                        <div className="flex items-center">
                          <span className="text-sm font-semibold text-gray-900">
                            {questionnaire.score_resultat}/5
                          </span>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${questionnaire.score_resultat >= 4
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
                            className={`h-2 rounded-full ${selectedQuestionnaire.score_resultat >= 4
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
                                    className={`h-2 rounded-full ${answer >= 4
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
