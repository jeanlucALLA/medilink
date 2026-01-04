'use client'

import { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import type { SupabaseClient } from '@supabase/supabase-js'

interface LeaderBadgeProps {
  userId: string
  className?: string
}

export default function LeaderBadge({ userId, className = '' }: LeaderBadgeProps) {
  const [isLeader, setIsLeader] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkLeaderStatus = async () => {
      try {
        const { supabase }: { supabase: SupabaseClient } = await import('@/lib/supabase')
        
        // Récupérer le code département du profil
        const { data: profileData } = await supabase
          .from('profiles')
          .select('department_code, zip_code, code_postal')
          .eq('id', userId)
          .single()

        const departmentCode = profileData?.department_code || 
          (profileData?.zip_code || profileData?.code_postal)?.substring(0, 2) || null

        // Ne pas afficher le badge si pas de localisation
        if (!departmentCode && !profileData?.zip_code && !profileData?.code_postal) {
          setIsLeader(false)
          setLoading(false)
          return
        }

        // Calculer le score du cabinet actuel
        const { data: ownData } = await supabase
          .rpc('get_own_satisfaction_score', { user_id_param: userId })

        if (!ownData || ownData.length === 0 || ownData[0].total_responses < 5) {
          setIsLeader(false)
          setLoading(false)
          return
        }

        // Calculer la moyenne régionale ou nationale
        let benchmarkScore = 0
        if (departmentCode) {
          const { data: regionalData } = await supabase
            .rpc('get_regional_benchmark', {
              department_code_param: departmentCode,
              user_id_param: userId
            })
          
          if (regionalData && regionalData.length > 0) {
            benchmarkScore = parseFloat(regionalData[0].average_score)
          }
        }

        // Fallback sur la moyenne nationale
        if (benchmarkScore === 0) {
          const { data: nationalData } = await supabase
            .rpc('get_national_satisfaction_average', { user_id_param: userId })
          
          if (nationalData && nationalData.length > 0) {
            benchmarkScore = parseFloat(nationalData[0].average_score)
          }
        }

        if (benchmarkScore === 0) {
          setIsLeader(false)
          setLoading(false)
          return
        }

        const ownScore = parseFloat(ownData[0].average_score)
        const percentageDiff = ((ownScore - benchmarkScore) / benchmarkScore) * 100

        // Vérifier si on dépasse de 20% ou plus
        setIsLeader(percentageDiff >= 20)
      } catch (err) {
        console.error('[LeaderBadge] Erreur vérification:', err)
        setIsLeader(false)
      } finally {
        setLoading(false)
      }
    }

    checkLeaderStatus()
  }, [userId])

  if (loading || !isLeader) {
    return null
  }

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-full shadow-lg ${className}`}>
      <Trophy className="w-4 h-4" />
      <span className="text-sm font-bold">🥇 Leader Régional</span>
    </div>
  )
}

