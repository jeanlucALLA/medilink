'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Clock, Sparkles, X } from 'lucide-react'

interface TrialBannerProps {
    trialEndsAt: string | null
    subscriptionTier: string | null
}

export default function TrialBanner({ trialEndsAt, subscriptionTier }: TrialBannerProps) {
    const [dismissed, setDismissed] = useState(false)
    const [daysLeft, setDaysLeft] = useState<number | null>(null)
    const [hoursLeft, setHoursLeft] = useState<number>(0)

    useEffect(() => {
        // Ne pas afficher si pas en trial ou si abonné
        if (subscriptionTier !== 'trial' || !trialEndsAt) {
            return
        }

        const calculateTimeLeft = () => {
            const now = new Date()
            const endDate = new Date(trialEndsAt)
            const diffMs = endDate.getTime() - now.getTime()

            if (diffMs <= 0) {
                setDaysLeft(0)
                setHoursLeft(0)
                return
            }

            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
            const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

            setDaysLeft(diffDays)
            setHoursLeft(diffHours)
        }

        calculateTimeLeft()
        const interval = setInterval(calculateTimeLeft, 60000) // Update every minute

        return () => clearInterval(interval)
    }, [trialEndsAt, subscriptionTier])

    // Ne pas afficher si pas en trial
    if (subscriptionTier !== 'trial' || !trialEndsAt || dismissed) {
        return null
    }

    // Ne pas afficher si déjà expiré (le guard s'en occupe)
    if (daysLeft === null) {
        return null
    }

    // Déterminer la couleur selon les jours restants
    let bgColor = 'bg-green-500' // 5-4 jours
    let textColor = 'text-white'
    let urgency = ''

    if (daysLeft <= 1) {
        bgColor = 'bg-red-500'
        urgency = '🚨 '
    } else if (daysLeft <= 2) {
        bgColor = 'bg-orange-500'
        urgency = '⚠️ '
    }

    const timeText = daysLeft > 0
        ? `${daysLeft} jour${daysLeft > 1 ? 's' : ''} ${hoursLeft > 0 ? `et ${hoursLeft}h` : ''}`
        : `${hoursLeft} heure${hoursLeft > 1 ? 's' : ''}`

    return (
        <div className={`${bgColor} ${textColor} px-4 py-3 relative`}>
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm sm:text-base">
                        {urgency}Essai gratuit : <strong>{timeText}</strong> restant{daysLeft > 1 ? 's' : ''}
                    </span>
                </div>

                <div className="flex items-center space-x-4">
                    <Link
                        href="/abonnement"
                        className="inline-flex items-center space-x-2 bg-white text-gray-900 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-all shadow-sm"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>Passer à Pro - 9,99€/mois</span>
                    </Link>

                    <button
                        onClick={() => setDismissed(true)}
                        className="p-1 hover:bg-white/20 rounded transition-colors"
                        aria-label="Fermer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
