'use client'

import { useState, useEffect, useCallback } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { BarChart3, TrendingUp, Users, Calendar, Loader2, AlertCircle, AlertTriangle, Download, Check, MessageSquare, Plus, X, LineChart } from 'lucide-react'
import { ChartsSkeleton } from '@/components/ChartsSkeleton'
import jsPDF from 'jspdf'

interface StatisticsData {
  date: string
  averageScore: number
  count: number
  dateISO?: string
}

interface SummaryStats {
  globalAverage: number
  progression: number
  totalResponses: number
}

export default function StatisticsPage() {
  const [selectedPathology, setSelectedPathology] = useState<string>('all')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30')
  const [pathologies, setPathologies] = useState<Array<{ value: string; label: string }>>([])
  const [chartData, setChartData] = useState<StatisticsData[]>([])
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [criticalAlerts, setCriticalAlerts] = useState<any[]>([])
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [commentDate, setCommentDate] = useState('')
  const [statisticsNotes, setStatisticsNotes] = useState<any[]>([])
  const [exporting, setExporting] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Statistiques pour les cartes
  const [averageSatisfaction, setAverageSatisfaction] = useState<number | null>(null)
  const [alertResolutionRate, setAlertResolutionRate] = useState<number | null>(null)
  const [globalSatisfaction, setGlobalSatisfaction] = useState<number | null>(null)
  const [completedFollowups, setCompletedFollowups] = useState<number | null>(null)
  const [criticalAlertsCount, setCriticalAlertsCount] = useState<number | null>(null)

  // Charger les statistiques pour les cartes avec try/catch
  const loadCardStatistics = useCallback(async () => {
    try {
      const { supabase } = await import('@/lib/supabase') as any
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setAverageSatisfaction(null)
        setAlertResolutionRate(null)
        setGlobalSatisfaction(null)
        setCompletedFollowups(null)
        setCriticalAlertsCount(null)
        return
      }

      // Helper pour appliquer le filtre de pathologie
      const applyPathologyFilter = (query: any) => {
        if (selectedPathology !== 'all') {
          return query.ilike('pathologie', selectedPathology)
        }
        return query
      }

      // Carte 1: Average Satisfaction
      try {
        let query = supabase
          .from('responses')
          .select('average_score, score_total')
          .eq('user_id', user.id)
          .limit(100)

        const { data: satisfactionData } = await applyPathologyFilter(query)

        if (satisfactionData && satisfactionData.length > 0) {
          const scores = satisfactionData
            .map((r: any) => parseFloat(r.average_score || r.score_total || 0))
            .filter((s: number) => !isNaN(s) && s > 0)

          if (scores.length > 0) {
            const avg = scores.reduce((a: number, b: number) => a + b, 0) / scores.length
            setAverageSatisfaction(Math.round(avg * 100) / 100)
          } else {
            setAverageSatisfaction(null)
          }
        } else {
          setAverageSatisfaction(null)
        }
      } catch (err) {
        console.warn('Erreur lors du chargement de Average Satisfaction:', err)
        setAverageSatisfaction(null)
      }

      // Carte 2: Alert Resolution Rate
      try {
        let query = supabase
          .from('alerts_log')
          .select('treated, pathologie')
          .eq('user_id', user.id)

        // Note: alerts_log doit avoir une colonne pathologie pour que le filtre fonctionne
        // Si elle n'existe pas, on ignore le filtre pour cette carte ou on fait une jointure
        const { data: alertsData } = await applyPathologyFilter(query)

        if (alertsData && alertsData.length > 0) {
          const total = alertsData.length
          const treated = alertsData.filter((a: any) => a.treated === true).length
          const rate = total > 0 ? (treated / total) * 100 : 0
          setAlertResolutionRate(Math.round(rate))
        } else {
          setAlertResolutionRate(null)
        }
      } catch (err) {
        console.warn('Erreur lors du chargement de Alert Resolution Rate:', err)
        setAlertResolutionRate(null)
      }

      // Carte 3: Taux de satisfaction global
      try {
        let query = supabase
          .from('responses')
          .select('average_score, score_total')
          .eq('user_id', user.id)

        const { data: globalData } = await applyPathologyFilter(query)

        if (globalData && globalData.length > 0) {
          const scores = globalData
            .map((r: any) => parseFloat(r.average_score || r.score_total || 0))
            .filter((s: number) => !isNaN(s) && s > 0)

          if (scores.length > 0) {
            const avg = scores.reduce((a: number, b: number) => a + b, 0) / scores.length
            setGlobalSatisfaction(Math.round(avg * 10) / 10) // 4.6/5
          } else {
            setGlobalSatisfaction(null)
          }
        } else {
          setGlobalSatisfaction(null)
        }
      } catch (err) {
        console.warn('Erreur lors du chargement du taux de satisfaction global:', err)
        setGlobalSatisfaction(null)
      }

      // Carte 4: Suivis terminés et Alertes critiques
      try {
        // Pour les questionnaires, on ne filtre pas par pathologie car la colonne n'y est pas forcément
        const { data: completedData } = await supabase
          .from('questionnaires')
          .select('id, status')
          .eq('user_id', user.id)
          .eq('status', 'Complété')

        if (completedData) {
          setCompletedFollowups(completedData.length)
        } else {
          setCompletedFollowups(null)
        }

        let criticalQuery = supabase
          .from('responses')
          .select('id')
          .eq('user_id', user.id)
          .lte('score_total', 2)

        const { data: criticalData } = await applyPathologyFilter(criticalQuery)

        if (criticalData) {
          setCriticalAlertsCount(criticalData.length)
        } else {
          setCriticalAlertsCount(null)
        }
      } catch (err) {
        console.warn('Erreur lors du chargement des suivis et alertes:', err)
        setCompletedFollowups(null)
        setCriticalAlertsCount(null)
      }
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques des cartes:', err)
      setAverageSatisfaction(null)
      setAlertResolutionRate(null)
      setGlobalSatisfaction(null)
      setCompletedFollowups(null)
      setCriticalAlertsCount(null)
    }
  }, [selectedPathology])

  // Charger les pathologies disponibles (dynamique)
  const loadPathologies = async () => {
    try {
      const { supabase } = await import('@/lib/supabase') as any
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      // Récupérer les pathologies distinctes de la table responses
      const { data, error } = await supabase
        .from('responses')
        .select('pathologie')
        .eq('user_id', user.id)

      if (error) {
        console.error('Erreur récupération pathologies:', error)
        // Fallback
        setPathologies([{ value: 'all', label: 'Toutes les spécialités' }])
        return
      }

      if (data) {
        // Extraire les valeurs uniques et filtrer les nulls/vides
        const uniquePathologies = Array.from(new Set(data.map((item: any) => item.pathologie)))
          .filter(p => p && typeof p === 'string' && p.trim() !== '')
          .sort()

        const options = [
          { value: 'all', label: 'Toutes les spécialités' },
          ...uniquePathologies.map((p: any) => ({
            value: p as string,
            label: (p as string).charAt(0).toUpperCase() + (p as string).slice(1)
          }))
        ]

        setPathologies(options)
      }
    } catch (err) {
      console.error('Erreur lors du chargement des pathologies:', err)
      setPathologies([{ value: 'all', label: 'Toutes les spécialités' }])
    }
  }

  // Charger les statistiques
  const loadStatistics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { supabase } = await import('@/lib/supabase') as any
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Utilisateur non authentifié')
        return
      }

      // Calculer la date de début selon la période sélectionnée
      const now = new Date()
      const periodDays = parseInt(selectedPeriod)
      const startDate = new Date(now)
      startDate.setDate(startDate.getDate() - periodDays)
      const startDateISO = startDate.toISOString()

      // Charger les alertes critiques non traitées
      const { data: alertsData } = await supabase
        .from('alerts_log')
        .select('id, response_id, questionnaire_id, pathologie, score_total, submitted_at, patient_email, treated')
        .eq('user_id', user.id)
        .eq('treated', false)
        .order('submitted_at', { ascending: false })
        .limit(20)

      if (alertsData) {
        setCriticalAlerts(alertsData)
      }

      // Charger les notes/commentaires
      const { data: notesData } = await supabase
        .from('statistics_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('note_date', { ascending: false })

      if (notesData) {
        setStatisticsNotes(notesData)
      }

      // Construire la requête
      let query = supabase
        .from('responses')
        .select('submitted_at, score_total, average_score, pathologie')
        .eq('user_id', user.id)
        .gte('submitted_at', startDateISO)
        .order('submitted_at', { ascending: true })

      // Filtrer par pathologie si sélectionnée
      if (selectedPathology !== 'all') {
        query = query.ilike('pathologie', selectedPathology)
      }

      const { data: responses, error: fetchError } = await query

      if (fetchError) {
        // Si la table n'existe pas encore, on affiche un message
        if (fetchError.code === '42P01') {
          setError('Table responses non créée. Exécutez le script supabase-responses-setup.sql')
        } else {
          // Ne pas afficher d'erreur si c'est juste qu'il n'y a pas de données
          // Certaines erreurs Supabase peuvent être normales quand la table est vide
          console.warn('Erreur lors du chargement des données:', fetchError)
          // On considère cela comme un cas vide plutôt qu'une erreur
          setError(null)
        }
        setChartData([])
        setSummaryStats({
          globalAverage: 0,
          progression: 0,
          totalResponses: 0,
        })
        setLoading(false)
        return
      }

      if (!responses || !Array.isArray(responses) || responses.length === 0) {
        setError(null) // Pas d'erreur, juste pas de données
        setChartData([])
        setSummaryStats({
          globalAverage: 0,
          progression: 0,
          totalResponses: 0,
        })
        setLoading(false)
        return
      }

      // Grouper les données par jour avec vérifications optionnelles
      const dataByDate = new Map<string, { scores: number[]; count: number }>()

      responses?.forEach((response: any) => {
        if (!response || !response?.submitted_at) return

        const date = new Date(response.submitted_at)?.toISOString()?.split('T')[0]
        if (!date) return

        // Utiliser average_score pour la précision maximale, sinon score_total
        const score = response?.average_score
          ? parseFloat(response.average_score)
          : (parseFloat(response?.score_total) || 0)

        if (isNaN(score)) return // Ignorer les scores invalides

        if (!dataByDate.has(date)) {
          dataByDate.set(date, { scores: [], count: 0 })
        }

        const dayData = dataByDate.get(date)
        if (dayData) {
          dayData.scores.push(score)
          dayData.count += 1
        }
      })

      // Convertir en format pour le graphique avec vérifications optionnelles
      const chartDataArray = Array.from(dataByDate.entries())
        .map(([date, data]) => {
          if (!data || !data?.scores || data.scores.length === 0) {
            return null
          }
          const sum = data.scores?.reduce((a, b) => (a || 0) + (b || 0), 0) || 0
          const averageScore = sum / (data.scores.length || 1)
          return {
            date: new Date(date)?.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) || date,
            dateISO: date, // Garder la date ISO pour le tri
            averageScore: isNaN(averageScore) ? 0 : averageScore,
            count: data?.count || 0,
          }
        })
        .filter((item): item is any => item !== null)
        .sort((a, b) => (a?.dateISO || '').localeCompare(b?.dateISO || ''))
        .map(({ dateISO, ...rest }) => rest) // Retirer dateISO après le tri

      setChartData(chartDataArray)

      // Calculer les statistiques de résumé avec vérifications optionnelles
      const allScores = responses
        ?.map((r: any) => {
          if (!r) return null
          return r?.average_score
            ? parseFloat(r.average_score)
            : (parseFloat(r?.score_total) || null)
        })
        .filter((score): score is number => score !== null && !isNaN(score)) || []

      const globalAverage = allScores.length > 0
        ? (allScores.reduce((a: number, b: number) => (a || 0) + (b || 0), 0) / allScores.length)
        : 0

      // Calculer la progression (comparer avec la période précédente)
      const previousPeriodStart = new Date(startDate)
      previousPeriodStart.setDate(previousPeriodStart.getDate() - periodDays)

      let previousQuery = supabase
        .from('responses')
        .select('score_total, average_score')
        .eq('user_id', user.id)
        .gte('submitted_at', previousPeriodStart.toISOString())
        .lt('submitted_at', startDateISO)

      if (selectedPathology !== 'all') {
        previousQuery = previousQuery.ilike('pathologie', selectedPathology)
      }

      const { data: previousResponses } = await previousQuery

      const previousScores = (previousResponses && Array.isArray(previousResponses) && previousResponses.length > 0)
        ? previousResponses
          ?.map((r: any) => {
            if (!r) return null
            return r?.average_score
              ? parseFloat(r.average_score)
              : (parseFloat(r?.score_total) || null)
          })
          ?.filter((score): score is number => score !== null && !isNaN(score)) || []
        : []

      const previousAverage = previousScores?.length > 0
        ? (previousScores.reduce((a: number, b: number) => (a || 0) + (b || 0), 0) / previousScores.length)
        : 0

      const progression = previousAverage > 0
        ? ((globalAverage - previousAverage) / previousAverage) * 100
        : 0

      setSummaryStats({
        globalAverage: Math.round(globalAverage * 100) / 100,
        progression: Math.round(progression * 100) / 100,
        totalResponses: responses.length,
      })
    } catch (err: any) {
      console.error('Erreur lors du chargement des statistiques:', err)
      // Ne pas afficher d'erreur si c'est juste qu'il n'y a pas de données
      // Seulement pour les vraies erreurs (problèmes de connexion, etc.)
      if (err?.code !== 'PGRST116' && err?.message?.includes('relation') === false) {
        setError('Erreur lors du chargement des données')
      } else {
        setError(null) // Pas d'erreur, juste pas de données
      }
      setChartData([])
      setSummaryStats({
        globalAverage: 0,
        progression: 0,
        totalResponses: 0,
      })
    } finally {
      setLoading(false)
    }
  }, [selectedPathology, selectedPeriod])

  useEffect(() => {
    setIsMounted(true)
    loadPathologies()
    loadCardStatistics()
  }, [])

  useEffect(() => {
    if (isMounted) {
      loadStatistics()
      loadCardStatistics()
    }
  }, [selectedPathology, loadStatistics, loadCardStatistics, isMounted])

  // Fonction pour marquer une alerte comme traitée
  const markAlertAsTreated = async (alertId: string) => {
    try {
      const { supabase } = await import('@/lib/supabase') as any
      const { error } = await supabase
        .from('alerts_log')
        .update({
          treated: true,
          treated_at: new Date().toISOString()
        })
        .eq('id', alertId)

      if (error) {
        console.error('Erreur lors du marquage de l\'alerte:', error)
        alert('Erreur lors du marquage de l\'alerte')
        return
      }

      // Retirer l'alerte de la liste
      setCriticalAlerts(criticalAlerts.filter(a => a.id !== alertId))
    } catch (err) {
      console.error('Erreur:', err)
      alert('Erreur lors du marquage de l\'alerte')
    }
  }

  // Fonction pour ajouter un commentaire
  const addComment = async () => {
    if (!newComment.trim() || !commentDate) {
      alert('Veuillez remplir tous les champs')
      return
    }

    try {
      const { supabase } = await import('@/lib/supabase') as any
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('statistics_notes')
        .insert({
          user_id: user.id,
          pathologie: selectedPathology !== 'all' ? selectedPathology : null,
          note_date: commentDate,
          comment: newComment.trim(),
        })
        .select()
        .single()

      if (error) {
        console.error('Erreur lors de l\'ajout du commentaire:', error)
        alert('Erreur lors de l\'ajout du commentaire')
        return
      }

      // Ajouter le commentaire à la liste
      setStatisticsNotes([data, ...statisticsNotes])
      setNewComment('')
      setCommentDate('')
      setShowComments(false)
    } catch (err) {
      console.error('Erreur:', err)
      alert('Erreur lors de l\'ajout du commentaire')
    }
  }

  // Fonction pour exporter le rapport en PDF
  const exportToPDF = async () => {
    if (exporting) return

    setExporting(true)
    try {
      const doc = new jsPDF('landscape', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      // Titre
      doc.setFontSize(20)
      doc.text('Rapport de Statistiques', pageWidth / 2, 20, { align: 'center' })

      // Informations de période
      doc.setFontSize(12)
      const periodLabel = selectedPeriod === '7' ? '7 derniers jours' :
        selectedPeriod === '30' ? '30 derniers jours' : '1 an'
      doc.text(`Période: ${periodLabel}`, 20, 30)
      doc.text(`Pathologie: ${selectedPathology !== 'all' ? selectedPathology : 'Toutes'}`, 20, 37)
      doc.text(`Date du rapport: ${new Date().toLocaleDateString('fr-FR')}`, 20, 44)

      // Statistiques de résumé
      if (summaryStats) {
        doc.setFontSize(14)
        doc.text('Résumé', 20, 55)
        doc.setFontSize(11)
        doc.text(`Score Moyen Global: ${summaryStats.globalAverage.toFixed(2)}/5`, 20, 62)
        doc.text(`Tendance: ${summaryStats.progression >= 0 ? '+' : ''}${summaryStats.progression.toFixed(1)}%`, 20, 69)
        doc.text(`Volume: ${summaryStats.totalResponses} réponses`, 20, 76)
      }

      // Alertes critiques
      if (criticalAlerts.length > 0) {
        let yPos = 85
        doc.setFontSize(14)
        doc.setTextColor(220, 38, 38) // Rouge
        doc.text('Alertes Critiques', 20, yPos)
        doc.setTextColor(0, 0, 0) // Noir

        doc.setFontSize(10)
        criticalAlerts.slice(0, 10).forEach((alert, index) => {
          yPos += 7
          if (yPos > pageHeight - 20) {
            doc.addPage()
            yPos = 20
          }
          doc.text(
            `${index + 1}. ${alert.pathologie} - Score: ${alert.score_total}/5 - ${new Date(alert.submitted_at).toLocaleDateString('fr-FR')}`,
            20,
            yPos
          )
        })
      }

      // Notes/Commentaires
      if (statisticsNotes.length > 0) {
        let yPos: number = (85 + (criticalAlerts.length > 0 ? (Math.min(criticalAlerts.length, 10) * 7) + 20 : 0))

        // Si yPos est trop bas, nouvelle page
        if (yPos > pageHeight - 50) {
          doc.addPage()
          yPos = 20
        } else {
          // Petit espace
          yPos += 10
        }

        if (yPos > pageHeight - 30) {
          doc.addPage()
          yPos = 20
        }

        doc.setFontSize(14)
        doc.text('Notes et Commentaires', 20, yPos)
        doc.setFontSize(10)

        statisticsNotes.slice(0, 10).forEach((note, index) => {
          yPos += 7
          if (yPos > pageHeight - 20) {
            doc.addPage()
            yPos = 20
          }
          const noteText = `${new Date(note.note_date).toLocaleDateString('fr-FR')}: ${note.comment}`
          const lines = doc.splitTextToSize(noteText, pageWidth - 40)
          doc.text(lines, 20, yPos)
          yPos += (lines.length - 1) * 5
        })
      }

      // Sauvegarder le PDF
      doc.save(`rapport-statistiques-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (err) {
      console.error('Erreur lors de l\'export PDF:', err)
      alert('Erreur lors de l\'export du rapport')
    } finally {
      setExporting(false)
    }
  }

  // Tooltip personnalisé pour le graphique
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{data.date}</p>
          <p className="text-sm text-gray-700">
            <span className="font-medium">Score moyen:</span> {data.averageScore.toFixed(2)}/5
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-medium">Nombre de patients:</span> {data.count}
          </p>
        </div>
      )
    }
    return null
  }

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header & Titre */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Statistiques</h1>
            <p className="text-gray-600 mt-1">Analyse détaillée des performances et de la satisfaction</p>
          </div>
          <button
            onClick={exportToPDF}
            disabled={exporting}
            className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            <span>Exporter le rapport mensuel</span>
          </button>
        </div>
      </div>

      {/* Filtre Agnostique */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div>
          <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-2">
            Filtrer par spécialité :
          </label>
          <select
            id="specialty"
            value={selectedPathology}
            onChange={(e) => setSelectedPathology(e.target.value)}
            className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">Toutes les spécialités</option>
          </select>
        </div>
      </div>

      {/* Grille de Statistiques (4 Cartes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Carte 1: Average Satisfaction */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Average Satisfaction</h3>
            <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
              <LineChart className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="mb-2">
            <p className="text-2xl font-bold text-gray-900">
              {averageSatisfaction !== null ? averageSatisfaction.toFixed(1) : '--'}
            </p>
          </div>
          <p className="text-xs text-gray-500">Satisfaction moyenne</p>
        </div>

        {/* Carte 2: Alert Resolution Rate */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Alert Resolution Rate</h3>
            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
              <LineChart className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="mb-2">
            <p className="text-2xl font-bold text-gray-900">
              {alertResolutionRate !== null ? `${alertResolutionRate}%` : '--'}
            </p>
          </div>
          <p className="text-xs text-gray-500">Taux de résolution</p>
        </div>

        {/* Carte 3: Taux de satisfaction global */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Taux de satisfaction global</h3>
            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
              <LineChart className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="mb-2">
            <p className="text-2xl font-bold text-gray-900">
              {globalSatisfaction !== null ? `${globalSatisfaction}/5` : '--'}
            </p>
          </div>
          <p className="text-xs text-gray-500">Basé sur les étoiles des patients</p>
        </div>

        {/* Carte 4: Suivis terminés et Alertes critiques */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="space-y-4">
            {/* Suivis terminés */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">Suivis terminés</h3>
                <Check className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {completedFollowups !== null ? completedFollowups : '--'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Sur les 30 derniers jours</p>
            </div>

            {/* Alertes critiques */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">Alertes critiques</h3>
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600">
                {criticalAlertsCount !== null ? criticalAlertsCount : '--'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Douleurs &gt; 7/10 nécessitant un suivi urgent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Graphique */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Évolution des résultats</h2>

        {loading ? (
          <ChartsSkeleton />
        ) : error ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur</h3>
              <p className="text-gray-600">{error}</p>
            </div>
          </div>
        ) : !chartData || chartData.length === 0 ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto px-4">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Bienvenue !
              </h3>
              <p className="text-gray-600 mb-4">
                Envoyez votre premier questionnaire pour voir vos statistiques ici.
              </p>
              <a
                href="/dashboard/questionnaire"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Créer un questionnaire</span>
              </a>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#6b7280"
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
                style={{ fontSize: '12px' }}
                label={{ value: 'Score moyen (1-5)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="averageScore"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorScore)"
                name="Score moyen"
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Alerte critique */}
      {criticalAlerts && Array.isArray(criticalAlerts) && criticalAlerts.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-semibold text-red-900">
              Alertes Critiques ({criticalAlerts.length})
            </h2>
          </div>
          <p className="text-red-700 mb-4">
            {criticalAlerts.length} réponse(s) avec un score ≤ 2/5 détectée(s) sur la période sélectionnée.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {criticalAlerts.slice(0, 6).map((alert: any) => (
              <div
                key={alert.id}
                className="bg-white border border-red-200 rounded-lg px-4 py-3 text-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium text-red-900">{alert.pathologie}</span>
                    <span className="text-red-600 font-bold ml-2">({alert.score_total}/5)</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  {new Date(alert.submitted_at).toLocaleDateString('fr-FR')}
                </p>
                {alert.patient_email && (
                  <p className="text-xs text-gray-600 mb-2">
                    {alert.patient_email}
                  </p>
                )}
                <button
                  onClick={() => markAlertAsTreated(alert.id)}
                  className="w-full mt-2 flex items-center justify-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium transition-colors"
                >
                  <Check className="w-3 h-3" />
                  <span>Marquer comme traité</span>
                </button>
              </div>
            ))}
          </div>
          {criticalAlerts.length > 6 && (
            <p className="text-sm text-red-600 mt-4 text-center">
              +{criticalAlerts.length - 6} autre(s) alerte(s)
            </p>
          )}
        </div>
      )}

      {/* Cartes de résumé */}
      {summaryStats && summaryStats.totalResponses > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Score Moyen Global</p>
                <p className="text-3xl font-bold text-gray-900">
                  {summaryStats.globalAverage.toFixed(2)}/5
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tendance</p>
                <p className={`text-3xl font-bold ${summaryStats.progression >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {summaryStats.progression >= 0 ? '↗' : '↘'} {Math.abs(summaryStats.progression).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {summaryStats.progression >= 0 ? 'En hausse' : 'En baisse'} vs période précédente
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${summaryStats.progression >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <TrendingUp className={`w-6 h-6 ${summaryStats.progression >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Volume</p>
                <p className="text-3xl font-bold text-gray-900">
                  {summaryStats.totalResponses}
                </p>
                <p className="text-xs text-gray-500 mt-1">Réponses reçues</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zone de commentaires */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Notes et Commentaires</h2>
          </div>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
          >
            {showComments ? (
              <>
                <X className="w-4 h-4" />
                <span>Fermer</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Ajouter une note</span>
              </>
            )}
          </button>
        </div>

        {showComments && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de l&apos;événement
                </label>
                <input
                  type="date"
                  value={commentDate}
                  onChange={(e) => setCommentDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commentaire
                </label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Ex: Changement de protocole de rééducation, Nouveau traitement..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>
              <button
                onClick={addComment}
                className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Enregistrer la note
              </button>
            </div>
          </div>
        )}

        {/* Liste des commentaires existants */}
        {statisticsNotes && Array.isArray(statisticsNotes) && statisticsNotes.length > 0 && (
          <div className="space-y-3 mt-4">
            {statisticsNotes
              .filter((note: any) => selectedPathology === 'all' || note.pathologie === selectedPathology || !note.pathologie)
              .slice(0, 5)
              .map((note: any) => (
                <div
                  key={note.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(note.note_date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                    {note.pathologie && (
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                        {note.pathologie}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">{note.comment}</p>
                </div>
              ))}
            {statisticsNotes.length > 5 && (
              <p className="text-xs text-gray-500 text-center mt-2">
                +{statisticsNotes.length - 5} autre(s) note(s)
              </p>
            )}
          </div>
        )}

        {statisticsNotes.length === 0 && !showComments && (
          <p className="text-sm text-gray-500 text-center py-4">
            Aucune note enregistrée. Cliquez sur &quot;Ajouter une note&quot; pour commencer.
          </p>
        )}
      </div>
    </div>
  )
}

