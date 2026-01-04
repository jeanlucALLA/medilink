'use client'

import { useEffect, useState, useRef } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Loader2, 
  BarChart3, 
  Target,
  MapPin,
  Award,
  AlertCircle,
  Sparkles
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import type { SupabaseClient } from '@supabase/supabase-js'

interface BenchmarkData {
  ownScore: number
  ownResponses: number
  regionalScore: number
  regionalResponses: number
  nationalScore: number
  nationalResponses: number
  postalCode: string | null
  departmentCode: string | null
}

export default function AnalyticsPage() {
  const [isMounted, setIsMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    setIsMounted(true)
    isMountedRef.current = true
    loadBenchmarkData()
    
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const loadBenchmarkData = async () => {
    try {
      if (!isMountedRef.current) return
      setLoading(true)
      setError(null)

      const { supabase }: { supabase: SupabaseClient } = await import('@/lib/supabase')
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        if (isMountedRef.current) {
          setError('Utilisateur non authentifié')
          setLoading(false)
        }
        return
      }

      // Récupérer le code postal et département du profil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('code_postal, zip_code, department_code')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('[Analytics] Erreur récupération profil:', profileError)
      }

      const postalCode = profile?.zip_code || profile?.code_postal || null
      const departmentCode = profile?.department_code || (postalCode ? postalCode.substring(0, 2) : null)

      // Calculer le score du cabinet actuel
      const { data: ownData, error: ownError } = await supabase
        .rpc('get_own_satisfaction_score', { user_id_param: user.id })

      if (ownError) {
        console.error('[Analytics] Erreur calcul score propre:', ownError)
      }

      // Calculer la moyenne régionale (si code département disponible)
      let regionalData = null
      if (departmentCode) {
        const { data: regional, error: regionalError } = await supabase
          .rpc('get_regional_benchmark', {
            department_code_param: departmentCode,
            user_id_param: user.id
          })

        if (regionalError) {
          console.error('[Analytics] Erreur calcul benchmark régional:', regionalError)
          // Fallback vers l'ancienne fonction si la nouvelle n'existe pas
          if (postalCode) {
            const { data: regionalOld, error: regionalOldError } = await supabase
              .rpc('get_regional_satisfaction_average', {
                user_code_postal: postalCode,
                user_id_param: user.id
              })
            if (!regionalOldError && regionalOld && regionalOld.length > 0) {
              regionalData = regionalOld[0]
            }
          }
        } else {
          regionalData = regional && regional.length > 0 ? regional[0] : null
        }
      }

      // Calculer la moyenne nationale
      const { data: nationalData, error: nationalError } = await supabase
        .rpc('get_national_satisfaction_average', { user_id_param: user.id })

      if (nationalError) {
        console.error('[Analytics] Erreur calcul moyenne nationale:', nationalError)
      }

      if (isMountedRef.current) {
        setBenchmarkData({
          ownScore: ownData && ownData.length > 0 ? parseFloat(ownData[0].average_score) : 0,
          ownResponses: ownData && ownData.length > 0 ? parseInt(ownData[0].total_responses) : 0,
          regionalScore: regionalData ? parseFloat(regionalData.average_score) : 0,
          regionalResponses: regionalData ? parseInt(regionalData.total_responses) : 0,
          nationalScore: nationalData && nationalData.length > 0 ? parseFloat(nationalData[0].average_score) : 0,
          nationalResponses: nationalData && nationalData.length > 0 ? parseInt(nationalData[0].total_responses) : 0,
          postalCode: postalCode,
          departmentCode: departmentCode
        })
      }
    } catch (err: any) {
      console.error('[Analytics] Erreur chargement benchmark:', err)
      if (isMountedRef.current) {
        setError(err.message || 'Erreur lors du chargement des données')
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  const getPerformanceBadge = () => {
    if (!benchmarkData || benchmarkData.ownResponses === 0) return null

    const { ownScore, regionalScore, nationalScore } = benchmarkData
    const comparisonScore = regionalScore > 0 ? regionalScore : nationalScore

    if (comparisonScore === 0) return null

    const percentageDiff = ((ownScore - comparisonScore) / comparisonScore) * 100

    if (percentageDiff > 10) {
      return {
        icon: <Sparkles className="w-5 h-5 text-yellow-500" />,
        text: '✨ Top 10% Régional',
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      }
    } else if (ownScore >= comparisonScore) {
      return {
        icon: <TrendingUp className="w-5 h-5 text-green-500" />,
        text: '📈 Performance Optimale',
        color: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      }
    } else {
      return {
        icon: <AlertCircle className="w-5 h-5 text-orange-500" />,
        text: '💡 Opportunité de progression',
        color: 'text-orange-700',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      }
    }
  }

  const getGaugePercentage = () => {
    if (!benchmarkData) return 0
    // Convertir le score (1-5) en pourcentage (0-100)
    const score = benchmarkData.ownScore
    return ((score - 1) / 4) * 100 // 1 -> 0%, 5 -> 100%
  }

  const getGaugeColor = () => {
    const percentage = getGaugePercentage()
    if (percentage >= 80) return '#10b981' // Vert
    if (percentage >= 60) return '#3b82f6' // Bleu
    if (percentage >= 40) return '#f59e0b' // Orange
    return '#ef4444' // Rouge
  }

  const getChartData = () => {
    if (!benchmarkData) return []

    return [
      {
        name: 'Mon Cabinet',
        score: parseFloat(benchmarkData.ownScore.toFixed(2)),
        responses: benchmarkData.ownResponses
      },
      {
        name: benchmarkData.departmentCode ? 'Moyenne Régionale' : 'Moyenne Régionale (N/A)',
        score: benchmarkData.regionalScore > 0 ? parseFloat(benchmarkData.regionalScore.toFixed(2)) : null,
        responses: benchmarkData.regionalResponses
      },
      {
        name: 'Moyenne Nationale',
        score: parseFloat(benchmarkData.nationalScore.toFixed(2)),
        responses: benchmarkData.nationalResponses
      }
    ]
  }

  if (!isMounted) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-2">Analyses avancées et benchmarking de performance</p>
          </div>
          <div className="flex items-center space-x-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
            <BarChart3 className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Benchmarking Régional</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-gray-600">Chargement des données de benchmarking...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 rounded-lg shadow-sm p-6 border border-red-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        </div>
      ) : !benchmarkData || benchmarkData.ownResponses === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune donnée de satisfaction disponible</h3>
            <p className="text-gray-600 mb-4">
              Envoyez des questionnaires de satisfaction à vos patients pour voir votre performance comparée à la région.
            </p>
            {!benchmarkData?.postalCode && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2 text-yellow-800">
                  <MapPin className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    Ajoutez votre code postal dans les paramètres pour activer le benchmarking régional.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Carte Performance avec Jauge */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Performance Card</h2>
                  <p className="text-sm text-gray-600">
                    {benchmarkData.departmentCode 
                      ? `Comparaison avec les cabinets du département ${benchmarkData.departmentCode}`
                      : 'Comparaison avec la moyenne nationale'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Jauge (Gauge Chart) */}
            <div className="mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-48 h-48">
                  {/* Cercle de fond */}
                  <svg className="transform -rotate-90 w-48 h-48">
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      stroke="#e5e7eb"
                      strokeWidth="16"
                      fill="none"
                    />
                    {/* Cercle de progression */}
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      stroke={getGaugeColor()}
                      strokeWidth="16"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 80}`}
                      strokeDashoffset={`${2 * Math.PI * 80 * (1 - getGaugePercentage() / 100)}`}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  {/* Score au centre */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-gray-900">
                      {benchmarkData.ownScore.toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500">/ 5.0</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Badge Dynamique */}
            {getPerformanceBadge() && (
              <div className={`p-4 rounded-lg border ${getPerformanceBadge()?.bgColor} ${getPerformanceBadge()?.borderColor} ${getPerformanceBadge()?.color} mb-6`}>
                <div className="flex items-center justify-center space-x-3">
                  {getPerformanceBadge()?.icon}
                  <p className="font-semibold text-lg">{getPerformanceBadge()?.text}</p>
                </div>
              </div>
            )}

            {/* Statistiques Détaillées */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Votre Score</span>
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{benchmarkData.ownScore.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {benchmarkData.ownResponses} réponse{benchmarkData.ownResponses > 1 ? 's' : ''}
                </p>
              </div>
              {benchmarkData.regionalScore > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Moyenne Régionale</span>
                    <MapPin className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{benchmarkData.regionalScore.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {benchmarkData.regionalResponses} réponse{benchmarkData.regionalResponses > 1 ? 's' : ''}
                  </p>
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Moyenne Nationale</span>
                  <Target className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{benchmarkData.nationalScore.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {benchmarkData.nationalResponses} réponse{benchmarkData.nationalResponses > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Graphique Comparatif */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Comparaison des Performances</h2>
                  <p className="text-sm text-gray-600">Score moyen de satisfaction (échelle 1-5)</p>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  stroke="#6b7280"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis 
                  stroke="#6b7280"
                  domain={[0, 5]}
                  label={{ value: 'Score (1-5)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '8px' 
                  }}
                  formatter={(value: any) => {
                    if (value === null || value === undefined) return 'N/A'
                    return `${parseFloat(value).toFixed(2)}/5`
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="score" 
                  name="Score Moyen"
                  radius={[8, 8, 0, 0]}
                >
                  {getChartData().map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        index === 0 
                          ? '#3b82f6' // Bleu pour "Mon Cabinet"
                          : index === 1 
                          ? '#6b7280' // Gris pour "Moyenne Régionale"
                          : '#9ca3af' // Gris clair pour "Moyenne Nationale"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 text-xs text-gray-500 text-center">
              <p>
                * Données de comparaison agrégées et anonymisées pour garantir la confidentialité des confrères
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
