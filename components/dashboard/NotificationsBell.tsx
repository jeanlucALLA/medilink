'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, X, FileText } from 'lucide-react'

interface NotificationCount {
  total: number
  critical: number
  new: number
}

interface NotificationsBellProps {
  variant?: 'sidebar' | 'header' // Variant pour adapter le style
}

export default function NotificationsBell({ variant = 'header' }: NotificationsBellProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [notificationCount, setNotificationCount] = useState<NotificationCount>({
    total: 0,
    critical: 0,
    new: 0,
  })
  const [loading, setLoading] = useState(true)
  const isMountedRef = useRef(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Protection isMounted
  useEffect(() => {
    setIsMounted(true)
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Fermer le dropdown en cliquant en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  // Charger le comptage des notifications
  const loadNotificationCount = async () => {
    if (!isMountedRef.current) return

    try {
      const { supabase } = await import('@/lib/supabase') as any
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        if (isMountedRef.current) {
          setNotificationCount({ total: 0, critical: 0, new: 0 })
          setLoading(false)
        }
        return
      }

      // Récupérer les réponses
      const { data: responsesData, error: responsesError } = await supabase
        .from('responses')
        .select('id, score_total, submitted_at')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false })

      if (responsesError) {
        console.error('[Notifications] Erreur chargement réponses:', responsesError.message)
        if (isMountedRef.current) {
          setNotificationCount({ total: 0, critical: 0, new: 0 })
          setLoading(false)
        }
        return
      }

      // Charger les résolutions depuis localStorage
      const savedResolutions = localStorage.getItem('alert_resolutions')
      let resolutionsMap = new Map<string, any>()
      
      if (savedResolutions) {
        try {
          const parsed = JSON.parse(savedResolutions)
          resolutionsMap = new Map(Object.entries(parsed))
        } catch (e) {
          console.error('Erreur parsing résolutions:', e)
        }
      }

      // Compter les notifications
      const responses = responsesData || []
      
      // Compter les réponses critiques (score ≤ 2)
      const criticalCount = responses.filter((r: any) => r.score_total <= 2).length
      
      // Compter les réponses avec statut 'nouveau' (pas de résolution ou statut 'new')
      const newCount = responses.filter((r: any) => {
        const resolution = resolutionsMap.get(r.id)
        // Pas de résolution OU statut explicitement 'new'
        return !resolution || resolution.status === 'new' || !resolution.status
      }).length
      
      // Le total est le nombre de réponses qui sont nouvelles OU critiques
      // (une réponse peut être à la fois nouvelle et critique)
      const totalCount = responses.filter((r: any) => {
        const resolution = resolutionsMap.get(r.id)
        const isNew = !resolution || resolution.status === 'new' || !resolution.status
        const isCritical = r.score_total <= 2
        return isNew || isCritical
      }).length

      if (isMountedRef.current) {
        setNotificationCount({
          total: totalCount,
          critical: criticalCount,
          new: newCount,
        })
        setLoading(false)
      }
    } catch (err: any) {
      console.error('[Notifications] Erreur:', err?.message)
      if (isMountedRef.current) {
        setNotificationCount({ total: 0, critical: 0, new: 0 })
        setLoading(false)
      }
    }
  }

  // Charger au montage
  useEffect(() => {
    if (isMounted) {
      loadNotificationCount()
    }
  }, [isMounted])

  // Rafraîchir toutes les 30 secondes
  useEffect(() => {
    if (!isMounted) return

    const interval = setInterval(() => {
      loadNotificationCount()
    }, 30000) // 30 secondes

    return () => clearInterval(interval)
  }, [isMounted])

  // Protection contre les erreurs d'hydratation
  if (!isMounted) {
    return null
  }

  const hasNotifications = notificationCount.total > 0
  const isSidebar = variant === 'sidebar'

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton de notification */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`relative p-2 rounded-lg transition-colors ${
          isSidebar
            ? 'text-white/80 hover:text-white hover:bg-white/10'
            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
        }`}
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        
        {/* Badge de notification */}
        {hasNotifications && !loading && (
          <>
            {/* Point rouge pour petites notifications */}
            {notificationCount.total <= 9 && (
              <span className={`absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ${
                isSidebar ? 'border-2 border-primary' : 'border-2 border-white'
              }`}></span>
            )}
            {/* Badge numérique pour plus de notifications */}
            {notificationCount.total > 9 && (
              <span className={`absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5 ${
                isSidebar ? 'border-2 border-primary' : 'border-2 border-white'
              }`}>
                {notificationCount.total > 99 ? '99+' : notificationCount.total}
              </span>
            )}
          </>
        )}
      </button>

      {/* Menu déroulant */}
      {isDropdownOpen && (
        <div className={`absolute ${isSidebar ? 'right-0' : 'right-0'} mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50`}>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <button
                onClick={() => setIsDropdownOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <p className="text-sm text-gray-500 mt-2">Chargement...</p>
              </div>
            ) : hasNotifications ? (
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {notificationCount.total > 0 
                        ? `${notificationCount.total} retour${notificationCount.total > 1 ? 's' : ''} de questionnaire ${notificationCount.new > 0 ? 'nouveau' + (notificationCount.new > 1 ? 'x' : '') : 'à traiter'}`
                        : 'Aucun retour'}
                    </p>
                    {notificationCount.critical > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        {notificationCount.critical} alerte{notificationCount.critical > 1 ? 's' : ''} critique{notificationCount.critical > 1 ? 's' : ''} (score ≤ 2/5)
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false)
                    router.push('/dashboard/resolution')
                  }}
                  className="w-full px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Voir tout</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Aucune notification</p>
                <p className="text-xs text-gray-400 mt-1">
                  Vous serez notifié des nouveaux retours
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

