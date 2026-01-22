'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface BenchmarkingData {
    user_questionnaires: number
    user_responses: number
    user_avg_score: number | null
    user_response_rate: number | null
    specialty_avg_score: number | null
    specialty_avg_response_rate: number | null
    top_percent_score: number | null
    top_percent_response: number | null
    specialty: string | null
}

interface BenchmarkingCardProps {
    userId?: string
}

export default function BenchmarkingCard({ userId }: BenchmarkingCardProps) {
    const [data, setData] = useState<BenchmarkingData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchBenchmarking = async () => {
            try {
                // Get current user if no userId provided
                let targetUserId = userId
                if (!targetUserId) {
                    const { data: { user } } = await supabase.auth.getUser()
                    targetUserId = user?.id
                }

                if (!targetUserId) {
                    setLoading(false)
                    return
                }

                // Fetch benchmarking data using RPC function
                const { data: benchData, error } = await supabase
                    .rpc('get_practitioner_benchmarking', { p_user_id: targetUserId })

                if (error) {
                    console.error('Erreur récupération benchmarking:', error)
                } else if (benchData && benchData.length > 0) {
                    setData(benchData[0])
                }

            } catch (error) {
                console.error('Erreur:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchBenchmarking()
    }, [userId])

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-20 bg-gray-200 rounded"></div>
                        <div className="h-20 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (!data || !data.specialty) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Benchmarking</h3>
                <div className="text-center py-6 text-gray-500">
                    <span className="text-4xl mb-2 block">📈</span>
                    <p>Renseignez votre spécialité dans les paramètres pour comparer vos performances avec vos confrères.</p>
                </div>
            </div>
        )
    }

    const getPercentileColor = (percent: number | null) => {
        if (percent === null) return 'text-gray-500'
        if (percent <= 10) return 'text-green-600'
        if (percent <= 25) return 'text-blue-600'
        if (percent <= 50) return 'text-yellow-600'
        return 'text-gray-600'
    }

    const getPercentileEmoji = (percent: number | null) => {
        if (percent === null) return '📊'
        if (percent <= 10) return '🏆'
        if (percent <= 25) return '🥈'
        if (percent <= 50) return '🥉'
        return '📊'
    }

    const formatScore = (score: number | null) => {
        if (score === null) return '-'
        return score.toFixed(1)
    }

    const formatPercent = (percent: number | null) => {
        if (percent === null) return '-'
        return `${percent.toFixed(0)}%`
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">📊 Benchmarking</h3>
                    <p className="text-sm text-gray-500">Comparez-vous aux autres {data.specialty}</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Satisfaction Score */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-600">Score Satisfaction</span>
                        <span className="text-2xl">{getPercentileEmoji(data.top_percent_score)}</span>
                    </div>

                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-3xl font-bold text-gray-900">
                            {formatScore(data.user_avg_score)}
                        </span>
                        <span className="text-lg text-gray-500">/5</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                            Moyenne {data.specialty}: {formatScore(data.specialty_avg_score)}/5
                        </span>
                        {data.top_percent_score !== null && (
                            <span className={`font-semibold ${getPercentileColor(data.top_percent_score)}`}>
                                Top {data.top_percent_score}%
                            </span>
                        )}
                    </div>

                    {/* Progress bar comparison */}
                    <div className="mt-3 space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-12">Vous</span>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                    style={{ width: `${((data.user_avg_score || 0) / 5) * 100}%` }}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-12">Moy.</span>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gray-400 rounded-full transition-all duration-500"
                                    style={{ width: `${((data.specialty_avg_score || 0) / 5) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Response Rate */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-600">Taux de Réponse</span>
                        <span className="text-2xl">{getPercentileEmoji(data.top_percent_response)}</span>
                    </div>

                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-3xl font-bold text-gray-900">
                            {formatPercent(data.user_response_rate)}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                            Moyenne {data.specialty}: {formatPercent(data.specialty_avg_response_rate)}
                        </span>
                        {data.top_percent_response !== null && (
                            <span className={`font-semibold ${getPercentileColor(data.top_percent_response)}`}>
                                Top {data.top_percent_response}%
                            </span>
                        )}
                    </div>

                    {/* Progress bar comparison */}
                    <div className="mt-3 space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-12">Vous</span>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-600 rounded-full transition-all duration-500"
                                    style={{ width: `${data.user_response_rate || 0}%` }}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-12">Moy.</span>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gray-400 rounded-full transition-all duration-500"
                                    style={{ width: `${data.specialty_avg_response_rate || 0}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                <div className="text-center">
                    <span className="text-2xl font-bold text-gray-900">{data.user_questionnaires}</span>
                    <p className="text-sm text-gray-500">Questionnaires envoyés</p>
                </div>
                <div className="text-center">
                    <span className="text-2xl font-bold text-gray-900">{data.user_responses}</span>
                    <p className="text-sm text-gray-500">Réponses reçues</p>
                </div>
            </div>

            {/* Motivational message */}
            {data.top_percent_score !== null && data.top_percent_score <= 25 && (
                <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800 font-medium">
                        🌟 Bravo ! Vous êtes dans le Top {data.top_percent_score}% des {data.specialty} pour la satisfaction patient !
                    </p>
                </div>
            )}
        </div>
    )
}
