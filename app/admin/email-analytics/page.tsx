'use client'

import { useState, useEffect, useCallback } from 'react'
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
    TrendingDown,
    Clock,
    Filter,
    ChevronLeft,
    ChevronRight,
    ArrowUpRight,
    Calendar,
    Search,
    Ban
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────

interface EmailStats {
    sent: number
    delivered: number
    opened: number
    clicked: number
    bounced: number
    complained: number
    delivery_delayed: number
}

interface TrackingEvent {
    id: string
    resend_email_id: string
    questionnaire_id: string | null
    event_type: string
    event_data: Record<string, any> | null
    created_at: string
    recipient_email_hash: string | null
}

type TimePeriod = '24h' | '7d' | '30d' | '90d' | 'all'
type EventFilter = 'all' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'delivery_delayed'

// ─── Constants ───────────────────────────────────────────────────────

const EVENT_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
    sent: { label: 'Envoyé', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Mail },
    delivered: { label: 'Délivré', color: 'text-emerald-600', bgColor: 'bg-emerald-50', icon: CheckCircle },
    opened: { label: 'Ouvert', color: 'text-violet-600', bgColor: 'bg-violet-50', icon: Eye },
    clicked: { label: 'Cliqué', color: 'text-indigo-600', bgColor: 'bg-indigo-50', icon: MousePointerClick },
    bounced: { label: 'Rejeté', color: 'text-red-600', bgColor: 'bg-red-50', icon: XCircle },
    complained: { label: 'Spam', color: 'text-orange-600', bgColor: 'bg-orange-50', icon: AlertTriangle },
    delivery_delayed: { label: 'Retardé', color: 'text-amber-600', bgColor: 'bg-amber-50', icon: Clock },
}

const PERIOD_LABELS: Record<TimePeriod, string> = {
    '24h': '24 heures',
    '7d': '7 jours',
    '30d': '30 jours',
    '90d': '90 jours',
    'all': 'Tout',
}

const PAGE_SIZE = 25

// ─── Component ───────────────────────────────────────────────────────

export default function EmailAnalyticsPage() {
    const [stats, setStats] = useState<EmailStats | null>(null)
    const [events, setEvents] = useState<TrackingEvent[]>([])
    const [totalEvents, setTotalEvents] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Filters
    const [period, setPeriod] = useState<TimePeriod>('30d')
    const [eventFilter, setEventFilter] = useState<EventFilter>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [page, setPage] = useState(0)

    // Auto-refresh
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

    const getPeriodDate = useCallback((p: TimePeriod): string | null => {
        if (p === 'all') return null
        const now = new Date()
        const hours = p === '24h' ? 24 : p === '7d' ? 168 : p === '30d' ? 720 : 2160
        now.setHours(now.getHours() - hours)
        return now.toISOString()
    }, [])

    const loadData = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const { supabase } = await import('@/lib/supabase') as any

            // Verify admin
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { setError('Non autorisé'); setLoading(false); return }

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

            const periodDate = getPeriodDate(period)

            // 1. Aggregate stats (for the selected period)
            let statsQuery = supabase
                .from('email_tracking')
                .select('event_type')

            if (periodDate) {
                statsQuery = statsQuery.gte('created_at', periodDate)
            }

            const { data: trackingData, error: trackingError } = await statsQuery

            if (trackingError) {
                setError('Erreur lors du chargement')
                setLoading(false)
                return
            }

            const counts: EmailStats = {
                sent: 0, delivered: 0, opened: 0, clicked: 0,
                bounced: 0, complained: 0, delivery_delayed: 0
            }

            trackingData?.forEach((e: any) => {
                const type = e.event_type as keyof EmailStats
                if (type in counts) counts[type]++
            })

            setStats(counts)

            // 2. Paginated events with filters
            let eventsQuery = supabase
                .from('email_tracking')
                .select('id, resend_email_id, questionnaire_id, event_type, event_data, created_at, recipient_email_hash', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

            if (periodDate) {
                eventsQuery = eventsQuery.gte('created_at', periodDate)
            }

            if (eventFilter !== 'all') {
                eventsQuery = eventsQuery.eq('event_type', eventFilter)
            }

            if (searchQuery.trim()) {
                eventsQuery = eventsQuery.ilike('resend_email_id', `%${searchQuery.trim()}%`)
            }

            const { data: eventsData, count, error: eventsError } = await eventsQuery

            if (eventsError) {
                console.error('Events fetch error:', eventsError)
            }

            setEvents(eventsData || [])
            setTotalEvents(count || 0)
            setLastRefresh(new Date())
            setLoading(false)

        } catch (err: any) {
            setError(err.message || 'Erreur inconnue')
            setLoading(false)
        }
    }, [period, eventFilter, searchQuery, page, getPeriodDate])

    useEffect(() => {
        loadData()
    }, [loadData])

    // Reset page when filters change
    useEffect(() => {
        setPage(0)
    }, [period, eventFilter, searchQuery])

    const calcRate = (num: number, den: number): string => {
        if (den === 0) return '—'
        return ((num / den) * 100).toFixed(1) + '%'
    }

    const totalPages = Math.ceil(totalEvents / PAGE_SIZE)

    // ─── Loading / Error States ──────────────────────────────────────

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
                    <p className="text-gray-500">Chargement des analytics...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-red-800 mb-2">Erreur</h2>
                    <p className="text-red-600">{error}</p>
                </div>
            </div>
        )
    }

    const deliveryRate = stats ? calcRate(stats.delivered, stats.sent) : '—'
    const openRate = stats ? calcRate(stats.opened, stats.delivered) : '—'
    const clickRate = stats ? calcRate(stats.clicked, stats.opened) : '—'
    const bounceRate = stats ? calcRate(stats.bounced, stats.sent) : '—'

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
            {/* ─── Header ─────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <BarChart3 className="w-7 h-7 text-blue-600" />
                        Email Analytics
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        Suivi en temps réel de la délivrabilité • Dernière MAJ : {lastRefresh.toLocaleTimeString('fr-FR')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 text-sm font-medium text-gray-700 shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Actualiser
                    </button>
                </div>
            </div>

            {/* ─── Period Selector ─────────────────────────────────── */}
            <div className="flex items-center gap-2 flex-wrap">
                <Calendar className="w-4 h-4 text-gray-400" />
                {(Object.entries(PERIOD_LABELS) as [TimePeriod, string][]).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setPeriod(key)}
                        className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${period === key
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ─── Main Stats Cards ───────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Envoyés', value: stats?.sent || 0, rate: null, icon: Mail, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', rateColor: '' },
                    { label: 'Délivrés', value: stats?.delivered || 0, rate: deliveryRate, icon: CheckCircle, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', rateColor: parseFloat(deliveryRate) >= 95 ? 'text-emerald-600' : parseFloat(deliveryRate) >= 80 ? 'text-orange-600' : 'text-red-600' },
                    { label: 'Ouverts', value: stats?.opened || 0, rate: openRate, icon: Eye, iconBg: 'bg-violet-100', iconColor: 'text-violet-600', rateColor: 'text-violet-600' },
                    { label: 'Rejetés', value: stats?.bounced || 0, rate: bounceRate, icon: XCircle, iconBg: 'bg-red-100', iconColor: 'text-red-600', rateColor: parseFloat(bounceRate) <= 2 ? 'text-emerald-600' : parseFloat(bounceRate) <= 5 ? 'text-orange-600' : 'text-red-600' },
                ].map((card, i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                            <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                            </div>
                            {card.rate && (
                                <span className={`text-sm font-semibold ${card.rateColor}`}>
                                    {card.rate}
                                </span>
                            )}
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{card.value.toLocaleString('fr-FR')}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* ─── Funnel + Secondary Stats ───────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Funnel */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-5">Entonnoir de conversion</h2>
                    <div className="space-y-3">
                        {[
                            { label: 'Envoyés', value: stats?.sent || 0, color: 'bg-blue-500', rate: '100%' },
                            { label: 'Délivrés', value: stats?.delivered || 0, color: 'bg-emerald-500', rate: deliveryRate },
                            { label: 'Ouverts', value: stats?.opened || 0, color: 'bg-violet-500', rate: openRate },
                            { label: 'Cliqués', value: stats?.clicked || 0, color: 'bg-indigo-500', rate: clickRate },
                        ].map((item, i) => {
                            const pct = stats?.sent ? Math.max(3, (item.value / stats.sent) * 100) : 3
                            return (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-20 text-sm text-gray-600 font-medium">{item.label}</div>
                                    <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                                        <div
                                            className={`${item.color} h-full rounded-full transition-all duration-700 ease-out`}
                                            style={{ width: `${pct}%` }}
                                        />
                                        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-700">
                                            {item.value.toLocaleString('fr-FR')}
                                        </span>
                                    </div>
                                    <div className="w-14 text-right text-sm font-semibold text-gray-700">{item.rate}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Side Panel: Problems + Extra Stats */}
                <div className="space-y-4">
                    {/* Health Score */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Santé email</h3>
                        {(() => {
                            const score = stats?.sent
                                ? Math.round(((stats.delivered - stats.bounced - stats.complained) / stats.sent) * 100)
                                : 100
                            const color = score >= 95 ? 'text-emerald-600' : score >= 80 ? 'text-orange-600' : 'text-red-600'
                            const bg = score >= 95 ? 'bg-emerald-100' : score >= 80 ? 'bg-orange-100' : 'bg-red-100'
                            const label = score >= 95 ? 'Excellent' : score >= 80 ? 'Attention requise' : 'Critique'
                            return (
                                <div className="text-center">
                                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${bg} mb-2`}>
                                        <span className={`text-3xl font-bold ${color}`}>{score}</span>
                                    </div>
                                    <p className={`text-sm font-semibold ${color}`}>{label}</p>
                                    <p className="text-xs text-gray-400 mt-1">(Délivrés − Bounces − Spam) / Envoyés</p>
                                </div>
                            )
                        })()}
                    </div>

                    {/* Problems */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Problèmes</h3>
                        {(stats?.bounced || 0) + (stats?.complained || 0) + (stats?.delivery_delayed || 0) === 0 ? (
                            <div className="text-center py-3">
                                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                <p className="text-sm text-emerald-700 font-medium">Aucun problème</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {[
                                    { type: 'bounced', count: stats?.bounced || 0, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
                                    { type: 'complained', count: stats?.complained || 0, icon: Ban, color: 'text-orange-600', bg: 'bg-orange-50' },
                                    { type: 'delivery_delayed', count: stats?.delivery_delayed || 0, icon: TrendingDown, color: 'text-amber-600', bg: 'bg-amber-50' },
                                ].filter(p => p.count > 0).map((p, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setEventFilter(p.type as EventFilter)}
                                        className={`w-full flex items-center justify-between p-2.5 ${p.bg} rounded-xl hover:opacity-80 transition-opacity`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <p.icon className={`w-4 h-4 ${p.color}`} />
                                            <span className={`text-sm font-medium ${p.color}`}>
                                                {EVENT_CONFIG[p.type]?.label}
                                            </span>
                                        </div>
                                        <span className={`text-sm font-bold ${p.color}`}>{p.count}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── Events Table ────────────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Table Header */}
                <div className="p-5 border-b border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            Journal des événements
                            <span className="text-sm font-normal text-gray-400">
                                ({totalEvents.toLocaleString('fr-FR')} total)
                            </span>
                        </h2>
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Search */}
                            <div className="relative">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Rechercher par email ID..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-56"
                                />
                            </div>
                            {/* Event type filter */}
                            <div className="relative">
                                <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <select
                                    value={eventFilter}
                                    onChange={e => setEventFilter(e.target.value as EventFilter)}
                                    className="pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white cursor-pointer"
                                >
                                    <option value="all">Tous les types</option>
                                    {Object.entries(EVENT_CONFIG).map(([key, cfg]) => (
                                        <option key={key} value={key}>{cfg.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                {events.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium">Aucun événement</p>
                        <p className="text-sm mt-1 text-gray-400">
                            {eventFilter !== 'all'
                                ? 'Aucun événement de ce type pour la période sélectionnée'
                                : 'Les événements apparaîtront ici au prochain email envoyé'
                            }
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/80 text-left">
                                        <th className="pl-5 pr-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email ID</th>
                                        <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Questionnaire</th>
                                        <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Détails</th>
                                        <th className="px-3 pr-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {events.map((event) => {
                                        const config = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.sent
                                        const Icon = config.icon
                                        return (
                                            <tr key={event.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="pl-5 pr-3 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-7 h-7 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                                                            <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                                                        </div>
                                                        <span className={`text-sm font-medium ${config.color}`}>
                                                            {config.label}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded font-mono">
                                                        {event.resend_email_id?.slice(0, 12)}...
                                                    </code>
                                                </td>
                                                <td className="px-3 py-3 hidden md:table-cell">
                                                    {event.questionnaire_id ? (
                                                        <a
                                                            href={`/dashboard/history`}
                                                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                        >
                                                            {event.questionnaire_id.slice(0, 8)}...
                                                            <ArrowUpRight className="w-3 h-3" />
                                                        </a>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 hidden lg:table-cell">
                                                    {event.event_data?.bounce_message ? (
                                                        <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                                            {event.event_data.bounce_message.slice(0, 50)}
                                                        </span>
                                                    ) : event.event_data?.clicked_link ? (
                                                        <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                                                            Lien cliqué
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-3 pr-5 py-3 text-right">
                                                    <span className="text-sm text-gray-500">
                                                        {new Date(event.created_at).toLocaleString('fr-FR', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                                <p className="text-sm text-gray-500">
                                    Page {page + 1} sur {totalPages}
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setPage(Math.max(0, page - 1))}
                                        disabled={page === 0}
                                        className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    {/* Page numbers */}
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        const pageNum = Math.max(0, Math.min(page - 2, totalPages - 5)) + i
                                        if (pageNum >= totalPages) return null
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setPage(pageNum)}
                                                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === pageNum
                                                        ? 'bg-blue-600 text-white'
                                                        : 'hover:bg-gray-200 text-gray-600'
                                                    }`}
                                            >
                                                {pageNum + 1}
                                            </button>
                                        )
                                    })}
                                    <button
                                        onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                                        disabled={page >= totalPages - 1}
                                        className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ─── Webhook Status ──────────────────────────────────── */}
            {totalEvents === 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Webhook Resend configuré ✓
                    </h3>
                    <p className="text-blue-800 text-sm">
                        Le webhook est prêt. Les événements (envoyé, délivré, ouvert, cliqué, rejeté)
                        apparaîtront ici automatiquement au prochain email envoyé depuis la plateforme.
                    </p>
                </div>
            )}
        </div>
    )
}
