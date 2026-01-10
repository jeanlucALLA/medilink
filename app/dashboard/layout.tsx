'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { Toaster } from 'react-hot-toast'
import Confetti from 'react-confetti'
import SidebarSafe from '@/components/dashboard/SidebarSafe'
import NotificationsBell from '@/components/dashboard/NotificationsBell'
import { checkPerformanceNotification } from '@/lib/performance-detection'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [profileChecked, setProfileChecked] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Protection contre les erreurs d'hydratation
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    let isMounted = true

    const getUserAndCheckProfile = async () => {
      try {
        setLoading(true)
        // Import dynamique pour éviter les problèmes de chargement
        const { supabase }: { supabase: SupabaseClient } = await import('@/lib/supabase')

        // Vérifier d'abord la session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session) {
          console.log('🚫 Aucune session dans le layout, redirection vers /login')
          if (isMounted) {
            router.push('/login')
            setLoading(false)
          }
          return
        }

        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
          console.log('🚫 Aucun utilisateur dans le layout, redirection vers /login')
          if (isMounted) {
            router.push('/login')
            setLoading(false)
          }
          return
        }

        if (isMounted) {
          setUser(user)
        }

        // Si on est sur la page welcome, ne pas vérifier le profil (laisser la page gérer)
        if (pathname === '/dashboard/welcome') {
          if (isMounted) {
            setLoading(false)
          }
          return
        }

        // Vérifier le profil pour la redirection onboarding (seulement si pas déjà vérifié)
        if (!profileChecked) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('nom_complet, specialite')
            .eq('id', user.id)
            .single()

          // Si erreur autre que "non trouvé", logger
          if (profileError && profileError.code !== 'PGRST116') {
            console.warn('Erreur lors de la récupération du profil:', profileError)
          }

          if (isMounted) {
            setProfile(profileData)
            setProfileChecked(true)
          }

          // Logique de redirection onboarding
          const isProfileComplete = profileData &&
            profileData.nom_complet &&
            profileData.specialite &&
            profileData.nom_complet.trim() !== '' &&
            profileData.specialite.trim() !== ''

          // Si profil incomplet, rediriger vers welcome
          if (!isProfileComplete) {
            if (isMounted) {
              router.push('/dashboard/welcome')
              setLoading(false)
            }
            return
          }
        } else {
          // Si déjà vérifié, vérifier si le profil est toujours incomplet
          const isProfileComplete = profile &&
            profile.nom_complet &&
            profile.specialite &&
            profile.nom_complet.trim() !== '' &&
            profile.specialite.trim() !== ''

          // Si profil incomplet, rediriger vers welcome
          if (!isProfileComplete) {
            if (isMounted) {
              router.push('/dashboard/welcome')
              setLoading(false)
            }
            return
          }
        }

        // Si tout est OK, arrêter le loading
        if (isMounted) {
          setLoading(false)
        }

      } catch (err) {
        console.error('Erreur lors de la vérification de l\'utilisateur:', err)
        if (isMounted) {
          router.push('/login')
          setLoading(false)
        }
      }
    }

    getUserAndCheckProfile()

    return () => {
      isMounted = false
    }
  }, [router, pathname, profileChecked, profile])

  // Vérifier les performances pour afficher les notifications de félicitations
  useEffect(() => {
    if (!isMounted || !user || pathname === '/dashboard/welcome') return

    const checkPerformance = async () => {
      try {
        const { supabase }: { supabase: SupabaseClient } = await import('@/lib/supabase')

        // Récupérer le code département du profil
        const { data: profileData } = await supabase
          .from('profiles')
          .select('department_code, zip_code, code_postal')
          .eq('id', user.id)
          .single()

        const departmentCode = profileData?.department_code ||
          (profileData?.zip_code || profileData?.code_postal)?.substring(0, 2) || null

        // Calculer le score du cabinet actuel
        const { data: ownData } = await supabase
          .rpc('get_own_satisfaction_score', { user_id_param: user.id })

        if (!ownData || ownData.length === 0 || ownData[0].total_responses < 5) {
          return // Pas assez de données
        }

        // Calculer la moyenne régionale ou nationale
        let benchmarkScore = 0
        if (departmentCode) {
          const { data: regionalData } = await supabase
            .rpc('get_regional_benchmark', {
              department_code_param: departmentCode,
              user_id_param: user.id
            })

          if (regionalData && regionalData.length > 0) {
            benchmarkScore = parseFloat(regionalData[0].average_score)
          }
        }

        // Fallback sur la moyenne nationale
        if (benchmarkScore === 0) {
          const { data: nationalData } = await supabase
            .rpc('get_national_satisfaction_average', { user_id_param: user.id })

          if (nationalData && nationalData.length > 0) {
            benchmarkScore = parseFloat(nationalData[0].average_score)
          }
        }

        if (benchmarkScore === 0) return

        const performanceData = {
          ownScore: parseFloat(ownData[0].average_score),
          regionalScore: benchmarkScore,
          nationalScore: benchmarkScore,
          ownResponses: parseInt(ownData[0].total_responses)
        }

        const notification = checkPerformanceNotification(performanceData)

        if (notification.shouldShow) {
          // Importer toast dynamiquement
          const toast = (await import('react-hot-toast')).default

          toast.success(
            `✨ Félicitations ! Votre taux de satisfaction est exceptionnel. Vous dépassez la moyenne de votre région de ${notification.percentageDiff}% !`,
            {
              duration: 6000,
              icon: '🥇',
              style: {
                background: '#f0fdf4',
                color: '#166534',
                border: '2px solid #22c55e',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '15px',
                fontWeight: '600',
              },
            }
          )

          // Afficher les confettis si c'est la première fois
          if (notification.isFirstTime) {
            setShowConfetti(true)
            setTimeout(() => setShowConfetti(false), 5000)
          }
        }
      } catch (err) {
        console.error('[Layout] Erreur vérification performance:', err)
      }
    }

    // Attendre un peu avant de vérifier (pour éviter de surcharger au chargement)
    const timeoutId = setTimeout(() => {
      // Temporairement désactivé pour éviter les erreurs 404 sur les RPC manquants
      // checkPerformance()
    }, 2000)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted, user?.id, pathname])

  const handleLogout = async () => {
    try {
      const { supabase }: { supabase: SupabaseClient } = await import('@/lib/supabase')
      await supabase.auth.signOut()
      router.push('/login')
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err)
      router.push('/login')
    }
  }

  // Ne pas afficher la sidebar sur la page welcome
  const isWelcomePage = pathname === '/dashboard/welcome'

  // Protection contre les erreurs d'hydratation
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster
        position="top-right"
        toastOptions={{
          success: {
            duration: 6000,
          },
        }}
      />
      {showConfetti && typeof window !== 'undefined' && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}
      <div className="flex">
        {/* Sidebar Safe - masquée sur la page welcome */}
        {!isWelcomePage && isMounted && (
          <SidebarSafe
            onLogout={handleLogout}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        )}

        {/* Main content */}
        <main className={`flex-1 ${!isWelcomePage && sidebarOpen ? 'lg:ml-64' : 'ml-0'} transition-all duration-300`}>
          <div className={isWelcomePage ? 'p-0' : 'p-6'}>
            {!isWelcomePage && (
              <div className="mb-6 flex items-center justify-between">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden text-gray-500 hover:text-gray-700"
                >
                  <Menu className="w-6 h-6" />
                </button>
                {/* Header avec notifications */}
                <div className="hidden lg:flex lg:items-center">
                  <NotificationsBell variant="header" />
                </div>
              </div>
            )}
            {/* Le layout ne bloque plus l'affichage - chaque page gère son propre loading */}
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

