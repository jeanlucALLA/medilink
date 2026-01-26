'use client'

import { useState, useEffect, useRef } from 'react'
import {
  CheckCircle,
  Clock,
  User,
  Loader2,
  Search,
  AlertTriangle,
  Inbox,
  CheckSquare,
  Square,
  X
} from 'lucide-react'

// Types
type TabType = 'pending' | 'alerts' | 'resolved'

interface ResolutionItem {
  id: string
  questionnaire_id: string
  pathologie: string
  patient_email: string | null
  patient_name: string
  score: number | null
  date: string
  type: 'sent' | 'response'
  isResolved: boolean
  isAlert: boolean
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

// Formater la date de façon simple
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return `Il y a ${diffDays} jours`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function ResolutionPage() {
  const [isMounted, setIsMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [items, setItems] = useState<ResolutionItem[]>([])
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const isMountedRef = useRef(true)

  // Protection isMounted
  useEffect(() => {
    setIsMounted(true)
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  // Charger les résolutions sauvegardées
  useEffect(() => {
    const saved = localStorage.getItem('resolution_resolved_ids')
    if (saved) {
      try {
        setResolvedIds(new Set(JSON.parse(saved)))
      } catch (e) {
        console.error('Erreur parsing résolutions', e)
      }
    }
  }, [])

  // Charger les données
  useEffect(() => {
    const loadData = async () => {
      if (!isMountedRef.current) return

      try {
        if (isMountedRef.current) setLoading(true)

        const { supabase } = await import('@/lib/supabase') as any
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          if (isMountedRef.current) {
            setItems([])
            setLoading(false)
          }
          return
        }

        // 1. Récupérer les questionnaires ENVOYÉS
        const { data: sentData } = await supabase
          .from('questionnaires')
          .select('id, pathologie, patient_email, sent_at, status')
          .eq('user_id', user.id)
          .eq('status', 'envoyé')
          .order('sent_at', { ascending: false })

        // 2. Récupérer les RÉPONSES
        const { data: responsesData } = await supabase
          .from('responses')
          .select('id, questionnaire_id, pathologie, score_total, submitted_at')
          .eq('user_id', user.id)
          .order('submitted_at', { ascending: false })

        // 3. Récupérer les emails des questionnaires pour les réponses
        const questionnaireIds = [...new Set((responsesData || []).map((r: any) => r.questionnaire_id).filter(Boolean))]
        let qsInfoMap = new Map()

        if (questionnaireIds.length > 0) {
          const { data } = await supabase
            .from('questionnaires')
            .select('id, patient_email')
            .eq('user_id', user.id)
            .in('id', questionnaireIds)

          qsInfoMap = new Map((data || []).map((q: any) => [q.id, q]))
        }

        // IDs des questionnaires qui ont déjà une réponse
        const respondedIds = new Set((responsesData || []).map((r: any) => r.questionnaire_id))

        // Formater les envoyés (sans réponse)
        const sentItems: ResolutionItem[] = (sentData || [])
          .filter((q: any) => !respondedIds.has(q.id))
          .map((q: any) => ({
            id: q.id,
            questionnaire_id: q.id,
            pathologie: q.pathologie,
            patient_email: q.patient_email,
            patient_name: extractNameFromEmail(q.patient_email),
            score: null,
            date: q.sent_at,
            type: 'sent' as const,
            isResolved: false,
            isAlert: false
          }))

        // Formater les réponses
        const responseItems: ResolutionItem[] = (responsesData || []).map((r: any) => {
          const qInfo = qsInfoMap.get(r.questionnaire_id) || {}
          return {
            id: r.id,
            questionnaire_id: r.questionnaire_id,
            pathologie: r.pathologie,
            patient_email: qInfo.patient_email || null,
            patient_name: extractNameFromEmail(qInfo.patient_email),
            score: r.score_total,
            date: r.submitted_at,
            type: 'response' as const,
            isResolved: false,
            isAlert: r.score_total !== null && r.score_total <= 3
          }
        })

        if (isMountedRef.current) {
          setItems([...sentItems, ...responseItems])
          setLoading(false)
        }
      } catch (err: any) {
        console.error('[Resolution] Erreur:', err?.message)
        if (isMountedRef.current) setLoading(false)
      }
    }

    if (isMounted) loadData()
  }, [isMounted])

  // Marquer comme traité
  const markAsResolved = (id: string) => {
    const newResolved = new Set(resolvedIds)
    newResolved.add(id)
    setResolvedIds(newResolved)
    localStorage.setItem('resolution_resolved_ids', JSON.stringify(Array.from(newResolved)))
    setSelectedItems(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  // Annuler résolution
  const unmarkResolved = (id: string) => {
    const newResolved = new Set(resolvedIds)
    newResolved.delete(id)
    setResolvedIds(newResolved)
    localStorage.setItem('resolution_resolved_ids', JSON.stringify(Array.from(newResolved)))
  }

  // Marquer plusieurs comme traités
  const markSelectedAsResolved = () => {
    if (selectedItems.size === 0) return
    const newResolved = new Set(resolvedIds)
    selectedItems.forEach(id => newResolved.add(id))
    setResolvedIds(newResolved)
    localStorage.setItem('resolution_resolved_ids', JSON.stringify(Array.from(newResolved)))
    setSelectedItems(new Set())
  }

  // Toggle sélection
  const toggleSelect = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Filtrer les items selon l'onglet actif
  const getFilteredItems = () => {
    let filtered = items

    // Recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.patient_name.toLowerCase().includes(query) ||
        item.patient_email?.toLowerCase().includes(query) ||
        item.pathologie?.toLowerCase().includes(query)
      )
    }

    // Filtre par onglet
    switch (activeTab) {
      case 'pending':
        return filtered.filter(item => !resolvedIds.has(item.id) && !item.isAlert)
      case 'alerts':
        return filtered.filter(item => !resolvedIds.has(item.id) && item.isAlert)
      case 'resolved':
        return filtered.filter(item => resolvedIds.has(item.id))
      default:
        return filtered
    }
  }

  const filteredItems = getFilteredItems()

  // Compteurs
  const countPending = items.filter(i => !resolvedIds.has(i.id) && !i.isAlert).length
  const countAlerts = items.filter(i => !resolvedIds.has(i.id) && i.isAlert).length
  const countResolved = items.filter(i => resolvedIds.has(i.id)).length

  // Sélectionner/désélectionner tous les items visibles
  const selectAll = () => {
    const visibleIds = filteredItems.map(i => i.id)
    setSelectedItems(new Set(visibleIds))
  }

  const clearSelection = () => {
    setSelectedItems(new Set())
  }

  if (!isMounted || loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Centre de Résolution</h1>
        <p className="text-gray-500 mt-1">Gérez vos suivis patients</p>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {/* Onglet À traiter */}
          <button
            onClick={() => { setActiveTab('pending'); clearSelection() }}
            className={`flex-1 px-6 py-4 text-center font-medium transition-all relative ${activeTab === 'pending'
                ? 'text-orange-600 bg-orange-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Inbox className="w-5 h-5" />
              <span>À traiter</span>
              {countPending > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'pending' ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                  {countPending}
                </span>
              )}
            </div>
            {activeTab === 'pending' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
            )}
          </button>

          {/* Onglet Alertes */}
          <button
            onClick={() => { setActiveTab('alerts'); clearSelection() }}
            className={`flex-1 px-6 py-4 text-center font-medium transition-all relative ${activeTab === 'alerts'
                ? 'text-red-600 bg-red-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Alertes</span>
              {countAlerts > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold animate-pulse ${activeTab === 'alerts' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600'
                  }`}>
                  {countAlerts}
                </span>
              )}
            </div>
            {activeTab === 'alerts' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
            )}
          </button>

          {/* Onglet Traités */}
          <button
            onClick={() => { setActiveTab('resolved'); clearSelection() }}
            className={`flex-1 px-6 py-4 text-center font-medium transition-all relative ${activeTab === 'resolved'
                ? 'text-green-600 bg-green-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Traités</span>
              {countResolved > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'resolved' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                  {countResolved}
                </span>
              )}
            </div>
            {activeTab === 'resolved' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500" />
            )}
          </button>
        </div>

        {/* Barre d'actions */}
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center gap-3">
          {/* Actions groupées */}
          {activeTab !== 'resolved' && filteredItems.length > 0 && (
            <>
              {selectedItems.size > 0 ? (
                <>
                  <span className="text-sm text-gray-600">
                    {selectedItems.size} sélectionné(s)
                  </span>
                  <button
                    onClick={clearSelection}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={markSelectedAsResolved}
                    className="px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Marquer traités
                  </button>
                </>
              ) : (
                <button
                  onClick={selectAll}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-white transition-colors flex items-center gap-2"
                >
                  <CheckSquare className="w-4 h-4" />
                  Tout sélectionner
                </button>
              )}
            </>
          )}

          {/* Recherche */}
          <div className="flex-1 min-w-[200px] max-w-md ml-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
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

        {/* Liste des items */}
        <div className="divide-y divide-gray-100">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${activeTab === 'pending' ? 'bg-orange-100' :
                  activeTab === 'alerts' ? 'bg-red-100' : 'bg-green-100'
                }`}>
                {activeTab === 'pending' && <Inbox className="w-8 h-8 text-orange-400" />}
                {activeTab === 'alerts' && <AlertTriangle className="w-8 h-8 text-red-400" />}
                {activeTab === 'resolved' && <CheckCircle className="w-8 h-8 text-green-400" />}
              </div>
              <p className="text-gray-500">
                {activeTab === 'pending' && 'Aucun élément à traiter'}
                {activeTab === 'alerts' && 'Aucune alerte'}
                {activeTab === 'resolved' && 'Aucun élément traité'}
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${selectedItems.has(item.id) ? 'bg-blue-50' : ''
                  }`}
              >
                <div className="flex items-center gap-4">
                  {/* Checkbox (sauf pour onglet Traités) */}
                  {activeTab !== 'resolved' && (
                    <button
                      onClick={() => toggleSelect(item.id)}
                      className="flex-shrink-0"
                    >
                      {selectedItems.has(item.id) ? (
                        <CheckSquare className="w-5 h-5 text-primary" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                      )}
                    </button>
                  )}

                  {/* Info patient */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900 truncate">
                        {item.patient_name}
                      </span>
                      {item.isAlert && !resolvedIds.has(item.id) && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded">
                          Attention
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>{item.pathologie}</span>
                      <span>•</span>
                      <span>{formatDate(item.date)}</span>
                      {item.score !== null && (
                        <>
                          <span>•</span>
                          <span className={`font-medium ${item.score <= 2 ? 'text-red-600' :
                              item.score === 3 ? 'text-orange-600' : 'text-green-600'
                            }`}>
                            Score: {item.score}/5
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  {activeTab !== 'resolved' ? (
                    <button
                      onClick={() => markAsResolved(item.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${item.isAlert
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Traiter
                    </button>
                  ) : (
                    <button
                      onClick={() => unmarkResolved(item.id)}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
