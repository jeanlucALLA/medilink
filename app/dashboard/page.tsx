'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LogOut, Building2, MapPin, FileText, Mail, Calendar, Plus, Loader2, Send, Clock, Users, AlertTriangle, Filter, CheckCircle, Circle, Activity, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import AddMedicalActModal from '@/components/dashboard/AddMedicalActModal'
import LeaderBadge from '@/components/dashboard/LeaderBadge'
import BadgesCard from '@/components/dashboard/BadgesCard'
import BenchmarkingCard from '@/components/dashboard/BenchmarkingCard'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

interface Profile {
  nom_complet: string
  cabinet: string
  adresse_cabinet: string
  specialite?: string
}

interface Questionnaire {
  id: string
  pathologie: string
  patient_email: string | null
  questions: any[]
  status: string
  send_after_days: number | null
  created_at: string
}

interface MedicalAct {
  id: string
  act_name: string
  patient_name: string | null
  act_date: string
  created_at: string
}

export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingQuestionnaires, setLoadingQuestionnaires] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sendingEmail, setSendingEmail] = useState<string | null>(null)
  const [criticalAlerts, setCriticalAlerts] = useState<any[]>([])
  const [showAlertsOnly, setShowAlertsOnly] = useState(false)
  const [loadingAlerts, setLoadingAlerts] = useState(false)
  const [profileIncomplete, setProfileIncomplete] = useState(false)
  const [isAddActModalOpen, setIsAddActModalOpen] = useState(false)
  const [medicalActsCount, setMedicalActsCount] = useState(0)
  const [hasFirstAct, setHasFirstAct] = useState(false)
  const [hasQuestionnaireSettings, setHasQuestionnaireSettings] = useState(false)
  const [medicalActs, setMedicalActs] = useState<MedicalAct[]>([])
  const [loadingMedicalActs, setLoadingMedicalActs] = useState(false)
  const [statsData, setStatsData] = useState({
    totalActs: 0,
    actsThisMonth: 0,
    uniquePatients: 0,
    actsThisWeek: 0
  })
  const [showLocationBanner, setShowLocationBanner] = useState(false)
  const [showRetry, setShowRetry] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      toast.success("Votre abonnement est activé ! La Boucle de Suivi est en place. 🚀", {
        duration: 6000,
        icon: '🎉'
      })
      router.replace('/dashboard')
    } else if (searchParams.get('payment') === 'cancelled') {
      toast.error("Le paiement a été annulé.")
    }
  }, [searchParams, router])

  const isMountedRef = useRef(true)

  useEffect(() => {
    setIsMounted(true)
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Timer pour le bouton réessayer
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) setShowRetry(true)
    }, 5000)
    return () => clearTimeout(timer)
  }, [loading])

  useEffect(() => {
    const checkLocation = async () => {
      try {
        if (!isMountedRef.current) return
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('zip_code, code_postal, department_code')
            .eq('id', user.id)
            .single()

          const hasPostalCode = profile?.zip_code || profile?.code_postal
          if (!hasPostalCode && isMountedRef.current) {
            setShowLocationBanner(true)
          } else if (hasPostalCode && isMountedRef.current) {
            setShowLocationBanner(false)
          }
        }
      } catch (err) {
        console.error('[Dashboard] Erreur vérification localisation:', err)
      }
    }
    if (isMountedRef.current) {
      checkLocation()
    }
  }, [])

  const loadCriticalAlerts = async () => {
    try {
      if (isMountedRef.current) {
        setLoadingAlerts(true)
      }
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        if (isMountedRef.current) {
          setCriticalAlerts([])
        }
        return
      }

      const { data: alertsData, error: alertsError } = await supabase
        .from('responses')
        .select('id, questionnaire_id, pathologie, score_total, submitted_at, patient_email, status')
        .eq('user_id', user.id)
        .lte('score_total', 2)
        .neq('status', 'resolved')
        .order('submitted_at', { ascending: false })
        .limit(50)

      if (alertsError) {
        console.error('[Dashboard] Erreur chargement alertes:', alertsError.message)
        if (isMountedRef.current) {
          setCriticalAlerts([])
        }
        return
      }

      if (alertsData && isMountedRef.current) {
        setCriticalAlerts(alertsData)
      }
    } catch (err: any) {
      console.error('[Dashboard] Erreur chargement alertes:', err?.message)
      if (isMountedRef.current) {
        setCriticalAlerts([])
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingAlerts(false)
      }
    }
  }

  const loadMedicalActs = async () => {
    try {
      if (isMountedRef.current) {
        setLoadingMedicalActs(true)
      }
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        if (isMountedRef.current) {
          setMedicalActsCount(0)
          setHasFirstAct(false)
          setMedicalActs([])
          setStatsData({ totalActs: 0, actsThisMonth: 0, uniquePatients: 0, actsThisWeek: 0 })
        }
        return
      }

      const { data, error } = await supabase
        .from('medical_acts')
        .select('id, act_name, patient_name, act_date, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) {
        if (error.code !== '42P01') {
          console.error('[Dashboard] Erreur chargement actes:', error.message)
        }
        if (isMountedRef.current) {
          setMedicalActsCount(0)
          setHasFirstAct(false)
          setMedicalActs([])
          setStatsData({ totalActs: 0, actsThisMonth: 0, uniquePatients: 0, actsThisWeek: 0 })
        }
        return
      }

      const acts = data || []
      const count = acts.length
      if (isMountedRef.current) {
        setMedicalActsCount(count)
        setHasFirstAct(count > 0)
        setMedicalActs(acts)
      }

      const now = new Date()
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const thisWeek = new Date(now)
      thisWeek.setDate(thisWeek.getDate() - 7)

      const actsThisMonth = acts.filter((act: MedicalAct) => {
        const actDate = new Date(act.created_at || act.act_date)
        return actDate >= thisMonth
      }).length

      const actsThisWeek = acts.filter((act: MedicalAct) => {
        const actDate = new Date(act.created_at || act.act_date)
        return actDate >= thisWeek
      }).length

      const uniquePatients = new Set(
        acts
          .filter((act: MedicalAct) => act.patient_name && act.patient_name.trim() !== '')
          .map((act: MedicalAct) => act.patient_name)
      ).size

      if (isMountedRef.current) {
        setStatsData({
          totalActs: count,
          actsThisMonth,
          uniquePatients,
          actsThisWeek
        })
      }
    } catch (err: any) {
      console.error('[Dashboard] Erreur chargement actes:', err?.message)
      if (isMountedRef.current) {
        setMedicalActsCount(0)
        setHasFirstAct(false)
        setMedicalActs([])
        setStatsData({ totalActs: 0, actsThisMonth: 0, uniquePatients: 0, actsThisWeek: 0 })
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingMedicalActs(false)
      }
    }
  }

  const loadQuestionnaires = async () => {
    try {
      if (isMountedRef.current) {
        setLoadingQuestionnaires(true)
      }
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        if (isMountedRef.current) {
          setQuestionnaires([])
        }
        return
      }

      const { data, error } = await supabase
        .from('questionnaires')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        if (error.code !== '42P01') {
          console.error('[Dashboard] Erreur chargement questionnaires:', error.message)
        }
        if (isMountedRef.current) {
          setQuestionnaires([])
        }
        return
      }

      if (data && isMountedRef.current) {
        setQuestionnaires(data)
      }
    } catch (err: any) {
      console.error('[Dashboard] Erreur chargement questionnaires:', err?.message)
      if (isMountedRef.current) {
        setQuestionnaires([])
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingQuestionnaires(false)
      }
    }
  }

  const hasCriticalAlert = (questionnaireId: string) => {
    return criticalAlerts.some(alert => alert.questionnaire_id === questionnaireId)
  }

  useEffect(() => {

    let authStateSubscription: { data: { subscription: { unsubscribe: () => void } } } | null = null

    const checkAuthAndLoadProfile = async () => {
      if (!isMountedRef.current) return

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session) {
          if (isMountedRef.current) {
            setLoading(false)
            router.push('/login')
          }
          return
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          if (isMountedRef.current) {
            setLoading(false)
            router.push('/login')
          }
          return
        }

        if (isMountedRef.current && user.id) {
          setUserId(user.id)
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('nom_complet, cabinet, adresse_cabinet, email, specialite, zip_code, department_code')
          .eq('id', user.id)
          .single()

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            if (isMountedRef.current) {
              setProfileIncomplete(true)
              setProfile(null)
            }
          } else {
            console.error('[Dashboard] Erreur profil:', profileError)
            if (isMountedRef.current) {
              setProfileIncomplete(true)
              setProfile(null)
            }
          }
        } else if (profileData) {
          if (isMountedRef.current) {
            setProfile(profileData)
            setProfileIncomplete(false)
          }
        }

        // Always stop loading and fetch data
        if (isMountedRef.current) {
          setLoading(false)
          setError(null)
          loadQuestionnaires()
          loadCriticalAlerts()
          loadMedicalActs()
          loadQuestionnaireSettings()
        }
      } catch (err: any) {
        console.error('[Dashboard] Erreur lors du chargement:', err?.message || 'Erreur inconnue')

        if (isMountedRef.current) {
          try {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
              setLoading(false)
              setProfileIncomplete(true)
              setProfile(null)
              loadQuestionnaires()
              loadCriticalAlerts()
            } else {
              setLoading(false)
              router.push('/login')
            }
          } catch (sessionErr) {
            console.error('[Dashboard] Erreur vérification session:', sessionErr)
            if (isMountedRef.current) {
              setLoading(false)
              router.push('/login')
            }
          }
        }
      }
    }

    const setupAuthListener = async () => {
      try {
        authStateSubscription = supabase.auth.onAuthStateChange((event: string, session: any) => {
          if (!isMountedRef.current) return

          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            checkAuthAndLoadProfile()
          } else if (event === 'SIGNED_OUT') {
            if (isMountedRef.current) {
              setLoading(false)
              router.push('/login')
            }
          }
        })
      } catch (err) {
        console.error('[Dashboard] Erreur setup auth listener:', err)
      }
    }

    setupAuthListener()
    checkAuthAndLoadProfile()



    return () => {
      isMountedRef.current = false

      if (authStateSubscription?.data?.subscription) {
        try {
          authStateSubscription.data.subscription.unsubscribe()
        } catch (err) {
          // Ignorer les erreurs de désabonnement
        }
      }
    }
  }, [router])

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>

    if (loading) {
      timeoutId = setTimeout(async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) {
            console.error('[Dashboard] Timeout: Session introuvable')
            router.push('/login')
          }
        } catch (err) {
          console.error('[Dashboard] Erreur timeout check:', err)
        }
      }, 20000)
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [loading, router])

  useEffect(() => {
    if (!loading && profile) {
      loadQuestionnaires()
      loadMedicalActs()
      const interval = setInterval(() => {
        loadQuestionnaires()
        loadMedicalActs()
      }, 10000)
      return () => clearInterval(interval)
    }
  }, [loading, profile])

  const loadQuestionnaireSettings = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        setHasQuestionnaireSettings(false)
        return
      }

      const { data, error } = await supabase
        .from('questionnaire_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('[Dashboard] Erreur chargement paramètres questionnaire:', error.message)
        if (isMountedRef.current) {
          setHasQuestionnaireSettings(false)
        }
        return
      }

      if (isMountedRef.current) {
        setHasQuestionnaireSettings(!!data)
      }
    } catch (err: any) {
      console.error('[Dashboard] Erreur chargement paramètres questionnaire:', err?.message)
      if (isMountedRef.current) {
        setHasQuestionnaireSettings(false)
      }
    }
  }

  const handleActCreated = () => {
    loadMedicalActs()
    loadQuestionnaires()
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (err: any) {
      console.error('[Dashboard] Erreur déconnexion:', err?.message)
      router.push('/login')
    }
  }

  const getScheduledSendDate = (createdAt: string, sendAfterDays: number | null) => {
    if (!sendAfterDays) return null
    const createdDate = new Date(createdAt)
    const sendDate = new Date(createdDate)
    sendDate.setDate(sendDate.getDate() + sendAfterDays)
    return sendDate
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'programmé':
        return 'bg-orange-100 text-orange-800'
      case 'envoyé':
        return 'bg-green-100 text-green-800'
      case 'échec':
      case 'erreur':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const emailQuestionnaires = questionnaires.filter(q => q.patient_email)

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <div className="text-gray-600">Chargement...</div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center mb-6">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <div className="text-lg font-medium text-gray-900 mb-1">Chargement...</div>
          <div className="text-sm text-gray-500">Vérification de l&apos;authentification</div>
        </div>
        {showRetry && (
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cliquer ici si le chargement est bloqué
          </button>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <div className="text-lg font-medium text-gray-900 mb-1">Chargement des données...</div>
          <div className="text-sm text-gray-500">Veuillez patienter</div>
        </div>
      </div>
    )
  }

  const displayName = (profile?.nom_complet || profile?.specialite || 'Professionnel').replace(/^Dr\.?\s*/i, '')

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Bandeau de profil incomplet */}
      {isMountedRef.current && showLocationBanner && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-red-700">Complétez votre profil</span> pour profiter de toutes les fonctionnalités.
            </p>
          </div>
          <Link
            href="/dashboard/settings"
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-lg"
          >
            Compléter
          </Link>
        </div>
      )}

      {/* Message d'avertissement si le profil est incomplet */}
      {profileIncomplete && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                Complétez votre profil pour profiter de toutes les fonctionnalités.
              </p>
              <Link
                href="/dashboard/settings"
                className="mt-1 inline-flex items-center text-sm font-medium text-amber-700 hover:text-amber-900"
              >
                Accéder aux paramètres →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Banner - Design Moderne */}
      <div className="gradient-welcome rounded-3xl p-8 text-white relative overflow-hidden">
        {/* Pattern décoratif */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Bienvenue, {profile ? displayName : 'Docteur'} ! 👋
            </h1>
            <p className="text-white/80 text-lg">
              Voici l&apos;aperçu de votre activité aujourd&apos;hui.
            </p>
          </div>
          {/* Desktop buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Link
              href="/dashboard/questionnaire"
              className="flex items-center space-x-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold rounded-xl transition-all duration-200 border border-white/20"
            >
              <Plus className="w-5 h-5" />
              <span>Créer un questionnaire</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2.5 bg-white/10 hover:bg-red-500/30 backdrop-blur-sm text-white/90 hover:text-white font-medium rounded-xl transition-all duration-200 border border-white/10 hover:border-red-400/30"
            >
              <LogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </button>
          </div>
          {/* Mobile logout button */}
          <div className="flex md:hidden">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-3 py-2 bg-white/10 hover:bg-red-500/30 backdrop-blur-sm text-white/90 hover:text-white font-medium rounded-xl transition-all duration-200 border border-white/10"
            >
              <LogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>

        {/* Badge Leader */}
        {isMountedRef.current && userId && (
          <div className="absolute top-4 right-4">
            <LeaderBadge userId={userId} />
          </div>
        )}
      </div>

      {/* Checklist de Bienvenue - Version Compacte */}
      {(!hasFirstAct || !hasQuestionnaireSettings) && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
            <span className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center mr-2">
              <CheckCircle className="w-4 h-4 text-primary" />
            </span>
            Pour bien démarrer
          </h2>
          <div className="flex flex-wrap gap-3">
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-xl ${hasFirstAct ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-600'}`}>
              {hasFirstAct ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
              <span className="text-sm font-medium">Premier acte</span>
              {!hasFirstAct && (
                <button onClick={() => setIsAddActModalOpen(true)} className="ml-2 text-primary hover:underline text-xs">Créer</button>
              )}
            </div>
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-xl ${hasQuestionnaireSettings ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-600'}`}>
              {hasQuestionnaireSettings ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
              <span className="text-sm font-medium">Questionnaire personnalisé</span>
              {!hasQuestionnaireSettings && (
                <Link href="/dashboard/questionnaire" className="ml-2 text-primary hover:underline text-xs">Configurer</Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Statistiques - Design Moderne 4 colonnes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Questionnaires */}
        <Link href="/dashboard/history" className="stat-card group relative overflow-hidden cursor-pointer">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-100 rounded-full opacity-50 group-hover:opacity-70 transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {loadingQuestionnaires ? (
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              ) : (
                questionnaires.length
              )}
            </p>
            <p className="text-sm text-gray-500">Questionnaires</p>
          </div>
        </Link>

        {/* Envois en attente */}
        <Link href="/dashboard/resolution" className="stat-card group relative overflow-hidden cursor-pointer">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-100 rounded-full opacity-50 group-hover:opacity-70 transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {questionnaires.filter(q => q.status === 'programmé' && q.patient_email).length}
            </p>
            <p className="text-sm text-gray-500">En attente</p>
          </div>
        </Link>

        {/* Patients suivis */}
        <Link href="/dashboard/history" className="stat-card group relative overflow-hidden cursor-pointer">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-100 rounded-full opacity-50 group-hover:opacity-70 transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <span className="trend-neutral flex items-center space-x-1">
                <span>stable</span>
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {(() => {
                const uniqueEmails = new Set(
                  questionnaires
                    .filter(q => q.patient_email)
                    .map(q => q.patient_email)
                )
                return uniqueEmails.size
              })()}
            </p>
            <p className="text-sm text-gray-500">Patients suivis</p>
          </div>
        </Link>

        {/* Alertes critiques */}
        <div className={`stat-card group relative overflow-hidden ${criticalAlerts.length > 0 ? 'border-red-200 bg-red-50/50' : ''}`}>
          <div className={`absolute -right-4 -top-4 w-24 h-24 ${criticalAlerts.length > 0 ? 'bg-red-100' : 'bg-amber-100'} rounded-full opacity-50 group-hover:opacity-70 transition-opacity`} />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${criticalAlerts.length > 0 ? 'bg-red-100' : 'bg-amber-100'} rounded-xl flex items-center justify-center`}>
                <AlertTriangle className={`w-5 h-5 ${criticalAlerts.length > 0 ? 'text-red-600' : 'text-amber-600'}`} />
              </div>
              {criticalAlerts.length > 0 && (
                <span className="trend-down flex items-center space-x-1 animate-pulse">
                  <span>Action</span>
                </span>
              )}
            </div>
            <p className={`text-3xl font-bold mb-1 ${criticalAlerts.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {criticalAlerts.length}
            </p>
            <p className="text-sm text-gray-500">Alertes</p>
          </div>
        </div>
      </div>



      {/* Carte d'alerte critique */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-semibold text-red-900">
              Alertes Critiques ({criticalAlerts.length})
            </h2>
          </div>
          <p className="text-red-700 mb-4">
            {criticalAlerts.length} patient(s) ont soumis un score ≤ 2/5. Action recommandée : contactez-les rapidement.
          </p>
          <div className="flex flex-wrap gap-2">
            {criticalAlerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className="bg-white border border-red-200 rounded-lg px-4 py-2 text-sm"
              >
                <span className="font-medium text-red-900">{alert.pathologie}</span>
                <span className="text-red-600 ml-2">({alert.score_total}/5)</span>
              </div>
            ))}
            {criticalAlerts.length > 5 && (
              <div className="bg-white border border-red-200 rounded-lg px-4 py-2 text-sm text-red-600">
                +{criticalAlerts.length - 5} autre(s)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section Engagement - Badges & Benchmarking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BadgesCard />
        <BenchmarkingCard />
      </div>

      {/* Liste des questionnaires */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Questionnaires récents</h2>
            <div className="flex items-center space-x-3">
              {/* Filtre Alertes Critiques */}
              <button
                onClick={() => setShowAlertsOnly(!showAlertsOnly)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm ${showAlertsOnly
                  ? 'bg-red-100 text-red-700 hover:bg-red-200 border-2 border-red-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                  }`}
              >
                <Filter className="w-4 h-4" />
                <span>Alertes critiques</span>
                {criticalAlerts.length > 0 && (
                  <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {criticalAlerts.length}
                  </span>
                )}
              </button>
              <Link
                href="/dashboard/questionnaire"
                className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Créer un questionnaire</span>
              </Link>
            </div>
          </div>
        </div>

        {loadingQuestionnaires ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-gray-600">Chargement des questionnaires...</p>
          </div>
        ) : questionnaires.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Vous n&apos;avez pas encore créé de questionnaire
            </h3>
            <p className="text-gray-600 mb-6">
              Commencez par en créer un dans l&apos;onglet dédié.
            </p>
            <Link
              href="/dashboard/questionnaire"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Créer un questionnaire</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pathologie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email du patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Questions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date de création
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(showAlertsOnly
                  ? questionnaires.filter(q => hasCriticalAlert(q.id))
                  : questionnaires
                ).map((questionnaire) => {
                  const hasAlert = hasCriticalAlert(questionnaire.id)
                  const alertData = criticalAlerts.find(a => a.questionnaire_id === questionnaire.id)

                  return (
                    <tr
                      key={questionnaire.id}
                      className={`hover:bg-gray-50 ${hasAlert ? 'bg-red-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {hasAlert && (
                            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                          )}
                          <div className="text-sm font-medium text-gray-900">
                            {questionnaire.pathologie}
                            {hasAlert && alertData && (
                              <span className="ml-2 text-xs text-red-600 font-semibold">
                                (Score: {alertData.score_total}/5)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {questionnaire.patient_email || (
                            <span className="text-gray-400 italic">Non renseigné</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {Array.isArray(questionnaire.questions)
                            ? questionnaire.questions.length
                            : 0} question(s)
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {questionnaire.status === 'programmé' && questionnaire.send_after_days ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            Programmé pour J+{questionnaire.send_after_days}
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            {questionnaire.status || 'Non programmé'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(questionnaire.created_at).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Suivi des envois automatiques */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Suivi des envois automatiques</h2>
        </div>

        {loadingQuestionnaires ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-gray-600">Chargement des envois...</p>
          </div>
        ) : emailQuestionnaires.length === 0 ? (
          <div className="p-12 text-center">
            <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun envoi programmé
            </h3>
            <p className="text-gray-600 mb-6">
              Les questionnaires avec un email de patient apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient (Email)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pathologie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date d&apos;envoi prévue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {emailQuestionnaires.map((questionnaire) => {
                  const scheduledDate = getScheduledSendDate(
                    questionnaire.created_at,
                    questionnaire.send_after_days
                  )

                  return (
                    <tr key={questionnaire.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {questionnaire.patient_email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {questionnaire.pathologie}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {scheduledDate ? (
                            scheduledDate.toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          ) : (
                            <span className="text-gray-400 italic">Non programmé</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(questionnaire.status)}`}>
                          {questionnaire.status || 'Non programmé'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {questionnaire.status === 'programmé' && (
                          <span className="text-xs text-gray-500 italic">Envoi programmé</span>
                        )}
                        {questionnaire.status === 'envoyé' && (
                          <span className="text-xs text-gray-500 italic">Déjà envoyé</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddMedicalActModal
        isOpen={isAddActModalOpen}
        onClose={() => setIsAddActModalOpen(false)}
        onSuccess={handleActCreated}
      />
    </div>
  )
}
