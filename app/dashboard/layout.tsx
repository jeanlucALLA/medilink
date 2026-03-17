'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Menu, Shield } from 'lucide-react'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { Toaster } from 'react-hot-toast'
import Confetti from 'react-confetti'
import SidebarSafe from '@/components/dashboard/SidebarSafe'
import NotificationsBell from '@/components/dashboard/NotificationsBell'
import TrialBanner from '@/components/dashboard/TrialBanner'
import InstallButton from '@/components/InstallButton'
import { checkPerformanceNotification } from '@/lib/performance-detection'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<{
    nom_complet: string | null;
    specialite: string | null;
    city: string | null;
    subscription_tier: string | null;
    trial_ends_at: string | null;
  } | null>(null)
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
    let isEffectActive = true
    let retryCount = 0
    const MAX_RETRIES = 5

    const getUserAndCheckProfile = async () => {
      try {
        setLoading(true)
        // Import dynamique pour éviter les problèmes de chargement
        const { supabase }: { supabase: SupabaseClient } = await import('@/lib/supabase')

        // Vérifier d'abord la session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session) {
          console.log('🚫 Aucune session dans le layout, redirection vers /login')
          if (isEffectActive) {
            router.push('/login')
            setLoading(false)
          }
          return
        }

        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
          console.log('🚫 Aucun utilisateur dans le layout, redirection vers /login')
          if (isEffectActive) {
            router.push('/login')
            setLoading(false)
          }
          return
        }

        if (isEffectActive) {
          setUser(user)
        }

        // Si on est sur la page welcome, ne pas vérifier le profil (laisser la page gérer)
        if (pathname === '/dashboard/welcome') {
          if (isEffectActive) {
            setLoading(false)
          }
          return
        }

        // Vérifier le profil pour la redirection onboarding (seulement si pas déjà vérifié)
        if (!profileChecked) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('nom_complet, full_name, specialite, speciality, city, subscription_tier, trial_ends_at')
            .eq('id', user.id)
            .single()

          // Si erreur autre que "non trouvé", logger
          if (profileError && profileError.code !== 'PGRST116') {
            console.warn('Erreur lors de la récupération du profil:', profileError)
          }

          // ✅ RETRY LOGIC : Si profil vide mais utilisateur existe, réessayer
          if (!profileData && retryCount < MAX_RETRIES) {
            retryCount++
            console.log(`[Dashboard] Profil non trouvé, tentative ${retryCount}/${MAX_RETRIES}...`)
            setTimeout(() => {
              if (isEffectActive) getUserAndCheckProfile()
            }, 800)
            return
          }

          if (isEffectActive) {
            // Normaliser les données du profil (full_name ou nom_complet)
            const normalizedProfile = profileData ? {
              nom_complet: profileData.full_name || profileData.nom_complet,
              specialite: profileData.speciality || profileData.specialite,
              city: profileData.city,
              subscription_tier: profileData.subscription_tier,
              trial_ends_at: profileData.trial_ends_at
            } : null
            setProfile(normalizedProfile)
            setProfileChecked(true)

            // ✅ SUBSCRIPTION GUARD: Bloquer les abonnements inactifs ou trials expirés
            const tier = profileData?.subscription_tier
            const trialEndsAt = profileData?.trial_ends_at
            const isProOrPremium = tier === 'pro' || tier === 'premium'
            const isTrialActive = tier === 'trial' && trialEndsAt && new Date(trialEndsAt) > new Date()

            if (!isProOrPremium && !isTrialActive && pathname !== '/dashboard/welcome') {
              console.log('🚫 Abonnement inactif ou trial expiré, redirection vers /abonnement')
              router.push('/abonnement?expired=true')
              setLoading(false)
              return
            }
          }

          // Logique de redirection onboarding
          const displayName = profileData?.full_name || profileData?.nom_complet
          const displaySpeciality = profileData?.speciality || profileData?.specialite
          const isProfileComplete = profileData &&
            displayName &&
            displaySpeciality &&
            displayName.trim() !== '' &&
            displaySpeciality.trim() !== ''

          // Si profil incomplet, rediriger vers welcome
          if (!isProfileComplete) {
            if (isEffectActive) {
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
            if (isEffectActive) {
              router.push('/dashboard/welcome')
              setLoading(false)
            }
            return
          }
        }

        // Si tout est OK, arrêter le loading
        if (isEffectActive) {
          setLoading(false)
        }

      } catch (err) {
        console.error('Erreur lors de la vérification de l\'utilisateur:', err)
        if (isEffectActive) {
          router.push('/login')
          setLoading(false)
        }
      }
    }

    getUserAndCheckProfile()

    return () => {
      isEffectActive = false
    }
  }, [router, pathname, profileChecked, profile])



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

      {/* Trial Banner - affichée au-dessus de tout pour visibilité maximale */}
      {profile?.subscription_tier === 'trial' && profile?.trial_ends_at && (
        <TrialBanner
          trialEndsAt={profile.trial_ends_at}
          subscriptionTier={profile.subscription_tier}
        />
      )}

      <div className="flex">
        {/* Sidebar Safe - masquée sur la page welcome */}
        {!isWelcomePage && isMounted && (
          <SidebarSafe
            onLogout={handleLogout}
            sidebarOpen={sidebarOpen}
            isCollapsed={isCollapsed}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          />
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          <main className={`flex-1 ${!isWelcomePage && sidebarOpen ? (isCollapsed ? 'lg:ml-20' : 'lg:ml-64') : 'ml-0'} transition-all duration-300 ease-in-out`}>
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
                  <div className="hidden lg:flex lg:items-center lg:gap-4">
                    {/* User Profile Info */}
                    <div className="flex flex-col items-end mr-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {profile?.nom_complet || user?.email?.split('@')[0] || 'Utilisateur'}
                      </span>
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        Médecin
                      </span>
                    </div>

                    {/* Install PWA Button */}
                    <InstallButton />

                    {/* Badge Zero-Data */}
                    <Link
                      href="/confidentialite"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-full hover:bg-green-100 transition-colors border border-green-200"
                      title="Mode Zero-Data actif - Aucune donnée de santé stockée"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Zero-Data
                    </Link>

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
    </div>
  )
}

