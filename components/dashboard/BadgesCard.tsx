'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Badge {
    badge_id: string
    code: string
    name: string
    description: string
    icon: string
    category: string
    points: number
    earned_at: string
    is_new: boolean
}

interface BadgesCardProps {
    userId?: string
}

export default function BadgesCard({ userId }: BadgesCardProps) {
    const [badges, setBadges] = useState<Badge[]>([])
    const [totalXP, setTotalXP] = useState(0)
    const [loading, setLoading] = useState(true)
    const [showAll, setShowAll] = useState(false)

    useEffect(() => {
        const fetchBadges = async () => {
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

                // Fetch badges using RPC function
                const { data: badgesData, error: badgesError } = await supabase
                    .rpc('get_user_badges', { p_user_id: targetUserId })

                if (badgesError) {
                    console.error('Erreur récupération badges:', badgesError)
                } else {
                    setBadges(badgesData || [])
                }

                // Fetch total XP
                const { data: xpData, error: xpError } = await supabase
                    .rpc('get_user_xp', { p_user_id: targetUserId })

                if (!xpError && xpData !== null) {
                    setTotalXP(xpData)
                }

            } catch (error) {
                console.error('Erreur:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchBadges()
    }, [userId])

    const displayedBadges = showAll ? badges : badges.slice(0, 6)
    const newBadges = badges.filter(b => b.is_new)

    // Calculate level from XP
    const level = Math.floor(totalXP / 100) + 1
    const xpForNextLevel = (level * 100) - totalXP
    const progressPercent = ((totalXP % 100) / 100) * 100

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="flex gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 w-16 bg-gray-200 rounded-full"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {/* Header with XP and Level */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        🏆 Mes Badges
                        {newBadges.length > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                                +{newBadges.length} nouveau{newBadges.length > 1 ? 'x' : ''}
                            </span>
                        )}
                    </h3>
                    <p className="text-sm text-gray-500">{badges.length} badge{badges.length > 1 ? 's' : ''} débloqué{badges.length > 1 ? 's' : ''}</p>
                </div>

                {/* Level & XP */}
                <div className="text-right">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-blue-600">Niv. {level}</span>
                        <span className="text-sm text-gray-500">({totalXP} XP)</span>
                    </div>
                    <div className="w-32 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{xpForNextLevel} XP pour niveau {level + 1}</p>
                </div>
            </div>

            {/* Badges Grid */}
            {badges.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <span className="text-4xl mb-2 block">🎯</span>
                    <p>Envoyez votre premier questionnaire pour débloquer votre premier badge !</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                        {displayedBadges.map((badge) => (
                            <div
                                key={badge.badge_id}
                                className={`relative group flex flex-col items-center p-3 rounded-xl transition-all hover:scale-105 cursor-pointer ${badge.is_new
                                    ? 'bg-gradient-to-br from-yellow-50 to-orange-50 ring-2 ring-yellow-400 ring-offset-2'
                                    : 'bg-gray-50 hover:bg-gray-100'
                                    }`}
                                title={badge.description}
                            >
                                {/* New indicator */}
                                {badge.is_new && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                                )}

                                {/* Icon */}
                                <span className="text-3xl mb-1">{badge.icon}</span>

                                {/* Name */}
                                <span className="text-xs text-center font-medium text-gray-700 line-clamp-2">
                                    {badge.name}
                                </span>

                                {/* Points */}
                                <span className="text-xs text-blue-600 font-semibold mt-1">
                                    +{badge.points} XP
                                </span>

                                {/* Tooltip on hover */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    <p className="font-semibold">{badge.name}</p>
                                    <p className="text-gray-300">{badge.description}</p>
                                    <p className="text-gray-400 mt-1">
                                        Obtenu le {new Date(badge.earned_at).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Show more button */}
                    {badges.length > 6 && (
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="mt-4 w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            {showAll ? 'Voir moins' : `Voir tous les badges (${badges.length})`}
                        </button>
                    )}
                </>
            )}
        </div>
    )
}
