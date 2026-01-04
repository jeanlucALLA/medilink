'use client'

import { useState, useEffect } from 'react'
import { 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'
import { 
  Lock, 
  Unlock, 
  TrendingUp, 
  Clock, 
  Users, 
  DollarSign, 
  Calendar, 
  Gift,
  Loader2,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Shield,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Le statut de déverrouillage sera déterminé dynamiquement depuis Supabase

// Données pour l'AreaChart (évolution CA/patients sur l'année)
const revenueData = [
  { month: 'Jan', revenue: 4500, patients: 12 },
  { month: 'Fév', revenue: 5200, patients: 15 },
  { month: 'Mar', revenue: 4800, patients: 14 },
  { month: 'Avr', revenue: 6100, patients: 18 },
  { month: 'Mai', revenue: 5500, patients: 16 },
  { month: 'Juin', revenue: 6800, patients: 20 },
  { month: 'Juil', revenue: 7200, patients: 22 },
  { month: 'Aoû', revenue: 6500, patients: 19 },
  { month: 'Sep', revenue: 7400, patients: 23 },
  { month: 'Oct', revenue: 7900, patients: 24 },
  { month: 'Nov', revenue: 8200, patients: 25 },
  { month: 'Déc', revenue: 8800, patients: 27 }
]

// Données pour le PieChart (répartition des types de consultations)
const consultationTypes = [
  { name: 'Cabinet', value: 65, color: '#3b82f6' },
  { name: 'Téléconsultation', value: 25, color: '#10b981' },
  { name: 'Domicile', value: 10, color: '#f59e0b' }
]

// Données pour la Heatmap (jours et heures les plus chargés)
const heatmapData = [
  { day: 'Lun', '8h': 2, '9h': 5, '10h': 8, '11h': 6, '14h': 7, '15h': 9, '16h': 5, '17h': 3 },
  { day: 'Mar', '8h': 1, '9h': 4, '10h': 7, '11h': 8, '14h': 9, '15h': 10, '16h': 6, '17h': 4 },
  { day: 'Mer', '8h': 3, '9h': 6, '10h': 9, '11h': 7, '14h': 8, '15h': 11, '16h': 7, '17h': 5 },
  { day: 'Jeu', '8h': 2, '9h': 5, '10h': 8, '11h': 9, '14h': 10, '15h': 12, '16h': 8, '17h': 4 },
  { day: 'Ven', '8h': 1, '9h': 4, '10h': 7, '11h': 6, '14h': 8, '15h': 9, '16h': 6, '17h': 2 },
  { day: 'Sam', '8h': 0, '9h': 2, '10h': 3, '11h': 2, '14h': 1, '15h': 0, '16h': 0, '17h': 0 }
]

// KPIs (Indicateurs Clés)
const kpis = {
  averageConsultationTime: 32, // minutes
  patientRetentionRate: 78, // pourcentage
  averageRevenuePerPatient: 285 // euros
}

// Fonction pour obtenir la couleur de la heatmap selon l'intensité
const getHeatmapColor = (value: number) => {
  if (value === 0) return '#f3f4f6'
  if (value <= 3) return '#dbeafe'
  if (value <= 6) return '#93c5fd'
  if (value <= 9) return '#60a5fa'
  return '#3b82f6'
}

export default function AnalyticsProPage() {
  const [loading, setLoading] = useState(true)
  const [isPremium, setIsPremium] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        const { supabase } = await import('@/lib/supabase') as any
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          setLoading(false)
          return
        }

        // Appeler la vue user_premium_status pour récupérer is_premium
        const { data: premiumStatus, error: premiumError } = await supabase
          .from('user_premium_status')
          .select('is_premium')
          .eq('user_id', user.id)
          .single()

        if (premiumError) {
          console.error('[Analytics Pro] Erreur récupération statut premium:', premiumError)
          // Fallback : vérifier manuellement avec get_referral_count
          const { data: referralCountData, error: rpcError } = await supabase
            .rpc('get_referral_count', { user_id_param: user.id })

          if (!rpcError && referralCountData !== null) {
            setIsPremium(referralCountData >= 3)
          } else {
            // Dernier fallback : compter manuellement
            const { count } = await supabase
              .from('referrals')
              .select('*', { count: 'exact', head: true })
              .eq('referrer_id', user.id)

            setIsPremium((count || 0) >= 3)
          }
        } else {
          // Utiliser is_premium depuis la vue
          setIsPremium(premiumStatus?.is_premium || false)
        }

        // Si l'utilisateur n'est pas premium, démarrer le compte à rebours de redirection
        if (!premiumStatus?.is_premium && !premiumError) {
          setTimeout(() => {
            setRedirecting(true)
            router.push('/dashboard/parrainage')
          }, 5000) // 5 secondes
        }
      } catch (err: any) {
        console.error('[Analytics Pro] Erreur vérification statut:', err)
      } finally {
        setLoading(false)
      }
    }

    checkPremiumStatus()
  }, [router])

  // Skeleton Loader pendant le chargement
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-96"></div>
            </div>
          </div>
        </div>

        {/* Skeleton KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="h-10 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-40"></div>
            </div>
          ))}
        </div>

        {/* Skeleton Charts */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  // Si l'utilisateur n'est pas premium, afficher l'écran de verrouillage
  if (!isPremium) {
    return (
      <div className="space-y-6 relative">
        {/* Contenu flouté en arrière-plan */}
        <div className="blur-sm pointer-events-none opacity-50">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Statistiques Avancées</h1>
                  <p className="text-gray-600 mt-1">Module Premium verrouillé</p>
                </div>
              </div>
            </div>
          </div>

          {/* KPIs floutés */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="h-10 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Overlay de verrouillage */}
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-md rounded-lg">
          <div className="bg-white rounded-xl shadow-2xl p-8 border-2 border-primary max-w-md text-center mx-4">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Accès réservé aux membres Premium</h2>
            <p className="text-gray-600 mb-6">
              Parrainez 3 collègues pour débloquer l&apos;accès à vie aux Statistiques Avancées
            </p>
            {redirecting ? (
              <div className="flex items-center justify-center space-x-2 text-primary">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Redirection en cours...</span>
              </div>
            ) : (
              <>
                <Link
                  href="/dashboard/parrainage"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl mb-4"
                >
                  <Gift className="w-5 h-5" />
                  <span>Obtenir mon accès</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <p className="text-xs text-gray-500">
                  Redirection automatique vers la page Parrainage dans quelques secondes...
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // L'utilisateur est Premium, afficher le contenu complet
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center">
              <Unlock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Statistiques Avancées</h1>
              <p className="text-gray-600 mt-1">
                Module Premium activé - Analyses approfondies de votre activité
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 rounded-full border border-green-300">
            <Unlock className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">Premium Actif</span>
          </div>
        </div>
      </div>

      {/* Contenu principal - uniquement visible si Premium */}
      <div className="space-y-6">
        {/* KPIs (Indicateurs Clés) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* KPI 1: Temps moyen de consultation */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Temps moyen de consultation</h3>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="mb-2">
              <p className="text-3xl font-bold text-gray-900">{kpis.averageConsultationTime} min</p>
            </div>
            <p className="text-xs text-gray-500">Durée moyenne par consultation</p>
          </div>

          {/* KPI 2: Taux de rétention des patients */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Taux de rétention</h3>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="mb-2">
              <p className="text-3xl font-bold text-gray-900">{kpis.patientRetentionRate}%</p>
            </div>
            <p className="text-xs text-gray-500">Patients qui reviennent</p>
          </div>

          {/* KPI 3: Revenu moyen par patient */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Revenu moyen par patient</h3>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="mb-2">
              <p className="text-3xl font-bold text-gray-900">{kpis.averageRevenuePerPatient}€</p>
            </div>
            <p className="text-xs text-gray-500">Revenu moyen par patient</p>
          </div>
        </div>

        {/* Graphique 1: AreaChart - Évolution CA/Patients sur l'année */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Évolution annuelle</h2>
                <p className="text-sm text-gray-600">Revenus et nombre de patients sur 12 mois</p>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis yAxisId="left" stroke="#3b82f6" />
              <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px' 
                }} 
              />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Revenus (€)"
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="patients"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorPatients)"
                name="Patients"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Graphique 2: PieChart - Répartition des types de consultations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <PieChartIcon className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Types de consultations</h2>
                  <p className="text-sm text-gray-600">Répartition par mode de consultation</p>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={consultationTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {consultationTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px' 
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Graphique 3: Heatmap - Jours et heures les plus chargés */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Créneaux les plus chargés</h2>
                  <p className="text-sm text-gray-600">Activité par jour et heure</p>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {/* En-têtes des heures */}
                <div className="flex mb-2">
                  <div className="w-16 flex-shrink-0"></div>
                  <div className="flex-1 grid grid-cols-8 gap-1">
                    {['8h', '9h', '10h', '11h', '14h', '15h', '16h', '17h'].map((hour) => (
                      <div key={hour} className="text-center text-xs font-medium text-gray-600">
                        {hour}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Lignes de la heatmap */}
                {heatmapData.map((row, index) => (
                  <div key={index} className="flex mb-1">
                    <div className="w-16 flex-shrink-0 text-sm font-medium text-gray-700 flex items-center">
                      {row.day}
                    </div>
                    <div className="flex-1 grid grid-cols-8 gap-1">
                      {['8h', '9h', '10h', '11h', '14h', '15h', '16h', '17h'].map((hour) => {
                        const value = row[hour as keyof typeof row] as number
                        return (
                          <div
                            key={hour}
                            className={`h-10 rounded flex items-center justify-center text-xs font-medium transition-all hover:scale-110 ${
                              value === 0
                                ? 'bg-gray-100 text-gray-400'
                                : value <= 3
                                ? 'bg-blue-100 text-blue-700'
                                : value <= 6
                                ? 'bg-blue-300 text-blue-800'
                                : value <= 9
                                ? 'bg-blue-500 text-white'
                                : 'bg-blue-700 text-white'
                            }`}
                            title={`${row.day} ${hour}: ${value} consultation(s)`}
                          >
                            {value > 0 && value}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-600 flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-100 rounded"></div>
                <span>0 consultation</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-100 rounded"></div>
                <span>1-3 consultations</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-300 rounded"></div>
                <span>4-6 consultations</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span>7-9 consultations</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-700 rounded"></div>
                <span>10+ consultations</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

