'use client'

import { useState, useEffect } from 'react'
import {
    BarChart3,
    Mail,
    CheckCircle,
    XCircle,
    Eye,
    MousePointerClick,
    AlertTriangle,
    Loader2,
    RefreshCw,
    TrendingUp,
    TrendingDown
} from 'lucide-react'

interface EmailStats {
    sent: number
    delivered: number
    opened: number
    clicked: number
    bounced: number
    complained: number
    delivery_delayed: number
}

interface DailyStats {
    day: string
    sent: number
    delivered: number
    opened: number
}

export default function EmailAnalyticsPage() {
    const [stats, setStats] = useState<EmailStats | null>(null)
    const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
    const [recentEvents, setRecentEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadStats = async () => {
        try {
            setLoading(true)
            setError(null)

            const { supabase } = await import('@/lib/supabase') as any

            // Verify admin access
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setError('Non autorisé')
                setLoading(false)
                return
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile?.role !== 'admin') {
                setError('Accès réservé aux administrateurs')
                setLoading(false)
                return
            }

            // Fetch aggregate stats
            const { data: trackingData, error: trackingError } = await supabase
                .from('email_tracking')
                .select('event_type')

            if (trackingError) {
                console.error('Error fetching stats:', trackingError)
                setError('Erreur lors du chargement des statistiques')
                setLoading(false)
                return
            }

            // Calculate stats
            const counts: EmailStats = {
                sent: 0,
                delivered: 0,
                opened: 0,
                clicked: 0,
                bounced: 0,
                complained: 0,
                delivery_delayed: 0
            }

            trackingData?.forEach((event: any) => {
                const type = event.event_type as keyof EmailStats
                if (type in counts) {
                    counts[type]++
                }
            })

            setStats(counts)

            // Fetch recent events
            const { data: recentData } = await supabase
                .from('email_tracking')
                .select('id, event_type, created_at, event_data')
                .order('created_at', { ascending: false })
                .limit(20)

            setRecentEvents(recentData || [])

            // Fetch daily stats using the view
            const { data: dailyData } = await supabase
                .from('email_delivery_stats')
                .select('*')
                .order('day', { ascending: false })
                .limit(30)

            // Group by day
            const dailyMap = new Map<string, DailyStats>()
            dailyData?.forEach((row: any) => {
                const dayStr = new Date(row.day).toLocaleDateString('fr-FR')
                if (!dailyMap.has(dayStr)) {
                    dailyMap.set(dayStr, { day: dayStr, sent: 0, delivered: 0, opened: 0 })
                }
                const entry = dailyMap.get(dayStr)!
                if (row.event_type === 'sent') entry.sent = row.count
                if (row.event_type === 'delivered') entry.delivered = row.count
                if (row.event_type === 'opened') entry.opened = row.count
            })

            setDailyStats(Array.from(dailyMap.values()).slice(0, 7))
            setLoading(false)

        } catch (err: any) {
            console.error('Error:', err)
            setError(err.message || 'Erreur inconnue')
            setLoading(false)
        }
    }

    useEffect(() => {
        loadStats()
    }, [])

    const calculateRate = (numerator: number, denominator: number): string => {
        if (denominator === 0) return '—'
        return ((numerator / denominator) * 100).toFixed(1) + '%'
    }

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'sent': return <Mail className="w-4 h-4 text-blue-500" />
            case 'delivered': return <CheckCircle className="w-4 h-4 text-green-500" />
            case 'opened': return <Eye className="w-4 h-4 text-purple-500" />
            case 'clicked': return <MousePointerClick className="w-4 h-4 text-indigo-500" />
            case 'bounced': return <XCircle className="w-4 h-4 text-red-500" />
            case 'complained': return <AlertTriangle className="w-4 h-4 text-orange-500" />
            default: return <Mail className="w-4 h-4 text-gray-500" />
        }
    }

    const getEventLabel = (type: string) => {
        const labels: Record<string, string> = {
            sent: 'Envoyé',
            delivered: 'Délivré',
            opened: 'Ouvert',
            clicked: 'Cliqué',
            bounced: 'Rejeté',
            complained: 'Signalé spam',
            delivery_delayed: 'Retardé'
        }
        return labels[type] || type
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-red-800 mb-2">Erreur</h2>
                    <p className="text-red-600">{error}</p>
                </div>
            </div>
        )
    }

    const deliveryRate = stats ? calculateRate(stats.delivered, stats.sent) : '—'
    const openRate = stats ? calculateRate(stats.opened, stats.delivered) : '—'
    const clickRate = stats ? calculateRate(stats.clicked, stats.opened) : '—'
    const bounceRate = stats ? calculateRate(stats.bounced, stats.sent) : '—'

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <BarChart3 className="w-7 h-7 text-primary" />
                        Analytics Email
                    </h1>
                    <p className="text-gray-500 mt-1">Suivi de la délivrabilité des questionnaires</p>
                </div>
                <button
                    onClick={loadStats}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700"
                >
                    <RefreshCw className="w-4 h-4" />
                    Actualiser
                </button>
            </div>

            {/* Main Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Sent */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats?.sent || 0}</p>
                    <p className="text-sm text-gray-500">Emails envoyés</p>
                </div>

                {/* Delivered */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <span className={`text-sm font-medium ${parseFloat(deliveryRate) >= 95 ? 'text-green-600' : parseFloat(deliveryRate) >= 80 ? 'text-orange-600' : 'text-red-600'}`}>
                            {deliveryRate}
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats?.delivered || 0}</p>
                    <p className="text-sm text-gray-500">Délivrés</p>
                </div>

                {/* Opened */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Eye className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-purple-600">{openRate}</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats?.opened || 0}</p>
                    <p className="text-sm text-gray-500">Ouverts</p>
                </div>

                {/* Bounced */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <XCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <span className={`text-sm font-medium ${parseFloat(bounceRate) <= 2 ? 'text-green-600' : parseFloat(bounceRate) <= 5 ? 'text-orange-600' : 'text-red-600'}`}>
                            {bounceRate}
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats?.bounced || 0}</p>
                    <p className="text-sm text-gray-500">Rejetés (bounce)</p>
                </div>
            </div>

            {/* Performance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Funnel */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Entonnoir de conversion</h2>
                    <div className="space-y-4">
                        {[
                            { label: 'Envoyés', value: stats?.sent || 0, color: 'bg-blue-500', rate: '100%' },
                            { label: 'Délivrés', value: stats?.delivered || 0, color: 'bg-green-500', rate: deliveryRate },
                            { label: 'Ouverts', value: stats?.opened || 0, color: 'bg-purple-500', rate: openRate },
                            { label: 'Cliqués', value: stats?.clicked || 0, color: 'bg-indigo-500', rate: clickRate },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-24 text-sm text-gray-600">{item.label}</div>
                                <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                                    <div
                                        className={`${item.color} h-full rounded-full transition-all duration-500`}
                                        style={{ width: `${Math.max(5, (item.value / (stats?.sent || 1)) * 100)}%` }}
                                    />
                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                                        {item.value}
                                    </span>
                                </div>
                                <div className="w-16 text-right text-sm font-medium text-gray-700">{item.rate}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Problems */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Problèmes détectés</h2>
                    {(stats?.bounced || 0) + (stats?.complained || 0) === 0 ? (
                        <div className="text-center py-8">
                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                            <p className="text-green-700 font-medium">Aucun problème détecté</p>
                            <p className="text-sm text-gray-500 mt-1">Tous les emails ont été délivrés avec succès</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {stats?.bounced ? (
                                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <XCircle className="w-5 h-5 text-red-500" />
                                        <span className="text-red-800">Emails rejetés (bounce)</span>
                                    </div>
                                    <span className="text-red-700 font-bold">{stats.bounced}</span>
                                </div>
                            ) : null}
                            {stats?.complained ? (
                                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                                        <span className="text-orange-800">Signalés comme spam</span>
                                    </div>
                                    <span className="text-orange-700 font-bold">{stats.complained}</span>
                                </div>
                            ) : null}
                            {stats?.delivery_delayed ? (
                                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <TrendingDown className="w-5 h-5 text-yellow-600" />
                                        <span className="text-yellow-800">Livraison retardée</span>
                                    </div>
                                    <span className="text-yellow-700 font-bold">{stats.delivery_delayed}</span>
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Events */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Événements récents</h2>
                {recentEvents.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Aucun événement enregistré</p>
                        <p className="text-sm mt-1">Les événements apparaîtront ici une fois le webhook configuré</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {recentEvents.map((event) => (
                            <div key={event.id} className="py-3 flex items-center gap-4">
                                {getEventIcon(event.event_type)}
                                <div className="flex-1">
                                    <span className="font-medium text-gray-900">{getEventLabel(event.event_type)}</span>
                                    {event.event_data?.bounce_message && (
                                        <p className="text-sm text-red-600">{event.event_data.bounce_message}</p>
                                    )}
                                </div>
                                <span className="text-sm text-gray-500">
                                    {new Date(event.created_at).toLocaleString('fr-FR', {
                                        day: 'numeric',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Setup Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Configuration du Webhook Resend</h3>
                <p className="text-blue-800 mb-4">
                    Pour activer le tracking en temps réel, configurez le webhook dans votre dashboard Resend :
                </p>
                <ol className="list-decimal list-inside space-y-2 text-blue-800">
                    <li>Allez sur <strong>resend.com/webhooks</strong></li>
                    <li>Cliquez sur <strong>Add Webhook</strong></li>
                    <li>
                        Entrez l&apos;URL : <code className="bg-blue-100 px-2 py-1 rounded text-sm">
                            https://www.toplinksante.com/api/webhooks/resend
                        </code>
                    </li>
                    <li>Sélectionnez tous les événements (Delivered, Opened, Clicked, Bounced, Complained)</li>
                    <li>Cliquez sur <strong>Create</strong></li>
                </ol>
            </div>
        </div>
    )
}
