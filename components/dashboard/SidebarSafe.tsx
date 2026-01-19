'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Target,
  TrendingUp,
  BarChart3,
  History,
  FileText,
  Gift,
  Settings,
  LogOut,
  TestTube,
  X,
  Library,
  Shield,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react'
import NotificationsBell from './NotificationsBell'

interface SidebarSafeProps {
  onLogout: () => void
  sidebarOpen?: boolean
  isCollapsed?: boolean
  onToggleSidebar?: () => void
  onToggleCollapse?: () => void
}

function getInitials(nomComplet: string | null | undefined): string {
  if (!nomComplet || nomComplet.trim() === '') return 'U'
  const mots = nomComplet.trim().split(/\s+/)
  if (mots.length === 0) return 'U'
  if (mots.length === 1) return mots[0].substring(0, 2).toUpperCase()
  const premiereLettre = mots[0].charAt(0).toUpperCase()
  const derniereLettre = mots[mots.length - 1].charAt(0).toUpperCase()
  return premiereLettre + derniereLettre
}

export default function SidebarSafe({
  onLogout,
  sidebarOpen = true,
  isCollapsed = false,
  onToggleSidebar,
  onToggleCollapse
}: SidebarSafeProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [praticienNom, setPraticienNom] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const loadPraticienName = async () => {
      try {
        const { supabase } = await import('@/lib/supabase') as any
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('nom_complet')
          .eq('id', user.id)
          .single()

        if (!profileError && profile?.nom_complet) {
          setPraticienNom(profile.nom_complet)
        }

        // Check for admin status
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()

        if (adminProfile?.is_admin) {
          setIsAdmin(true)
        }
      } catch (err) {
        console.error('Erreur lors du chargement du nom du praticien:', err)
      }
    }
    if (isMounted) loadPraticienName()
  }, [isMounted])

  const menuItems = [
    { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/dashboard/resolution', label: 'Centre de Résolution', icon: Target },
    { href: '/dashboard/statistics', label: 'Statistiques', icon: TrendingUp },

    { href: '/dashboard/history', label: 'Historique', icon: History },
    { href: '/dashboard/questionnaire', label: 'Questionnaire', icon: FileText },
    { href: '/dashboard/parrainage', label: 'Parrainage', icon: Gift },
    { href: '/dashboard/library', label: 'Bibliothèque', icon: Library },
    { href: '/dashboard/contact', label: 'Contact / Support', icon: MessageSquare },
    { href: '/dashboard/settings', label: 'Paramètres', icon: Settings },
    ...(isAdmin ? [{ href: '/admin', label: 'Administration', icon: Shield }] : [])
  ]



  const handleLinkClick = (href: string, e: React.MouseEvent) => {
    try {
      if (!href || href.trim() === '') {
        e.preventDefault()
        return
      }
    } catch (err) {
      console.error('Erreur lors du clic sur le lien:', err)
      e.preventDefault()
    }
  }

  if (!isMounted) return null

  // Determine width based on state
  const sidebarWidth = !sidebarOpen ? 'w-0' : isCollapsed ? 'w-20' : 'w-64'

  return (
    <>
      {/* Overlay mobile - ferme la sidebar au clic */}
      {sidebarOpen && onToggleSidebar && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
          onClick={onToggleSidebar}
          aria-label="Fermer le menu"
        />
      )}

      <aside
        className={`${sidebarWidth} fixed h-screen gradient-sidebar transition-all duration-300 ease-in-out overflow-hidden z-40 shadow-xl`}
      >
        <div className={`${isCollapsed ? 'p-3' : 'p-6'} flex flex-col h-full transition-all duration-300`}>
          {/* Header with Logo and Toggle */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-8 ${isCollapsed ? '' : 'pl-2'}`}>
            {/* Logo */}
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 hover:opacity-90 transition-opacity no-underline ${isCollapsed ? 'justify-center' : ''}`}
            >
              {/* Croix médicale TopLinkSanté */}
              <svg className={`transition-all duration-300 ${isCollapsed ? 'h-7 w-7' : 'h-8 w-8'}`} viewBox="0 0 40 40" fill="none">
                <rect x="14" y="4" width="12" height="32" rx="2" fill="#5EEAD4" />
                <rect x="4" y="14" width="32" height="12" rx="2" fill="#60A5FA" />
              </svg>
              <span className={`text-xl font-bold text-white tracking-tight transition-all duration-300 ${isCollapsed ? 'hidden' : 'block'}`}>TopLinkSanté</span>
            </Link>

            {/* Toggle buttons - only show when not collapsed */}
            {!isCollapsed && (
              <div className="flex items-center space-x-2">
                <div className="lg:hidden">
                  <NotificationsBell variant="sidebar" />
                </div>
                {onToggleSidebar && (
                  <button
                    onClick={onToggleSidebar}
                    className="lg:hidden text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Collapse Toggle Button - Desktop */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className={`hidden lg:flex items-center ${isCollapsed ? 'justify-center' : 'justify-end'} mb-4 text-slate-400 hover:text-white transition-colors`}
              title={isCollapsed ? 'Ouvrir le menu' : 'Réduire le menu'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <div className="flex items-center gap-2 text-xs">
                  <span>Réduire</span>
                  <ChevronLeft className="w-4 h-4" />
                </div>
              )}
            </button>
          )}

          {/* Navigation */}
          <nav className="space-y-1 flex-grow">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/dashboard')

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleLinkClick(item.href, e)}
                  title={isCollapsed ? item.label : undefined}
                  className={`group flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                    ? 'bg-white/15 text-white font-semibold shadow-lg backdrop-blur-sm'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                  {/* Label - hidden when collapsed */}
                  <span className={`transition-all duration-300 ${isCollapsed ? 'hidden' : 'block'}`}>
                    {item.label}
                  </span>
                  {isActive && !isCollapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-lg shadow-white/50" />
                  )}
                </Link>
              )
            })}
          </nav>



          {/* Footer */}
          <div className={`mt-4 pt-4 border-t border-white/10 ${isCollapsed ? 'px-1' : ''}`}>
            {/* User Profile - only when not collapsed */}
            {praticienNom && !isCollapsed && (
              <div className="flex items-center space-x-3 px-3 py-3 mb-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg text-white font-bold text-sm">
                  {getInitials(praticienNom)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate mr-2">
                    {praticienNom}
                  </p>
                  <p className="text-xs text-slate-400 truncate">Praticien</p>
                </div>
              </div>
            )}

            {/* Collapsed user avatar */}
            {praticienNom && isCollapsed && (
              <div className="flex justify-center mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-400 rounded-full flex items-center justify-center shadow-lg text-white font-bold text-sm">
                  {getInitials(praticienNom)}
                </div>
              </div>
            )}

            {/* Logout button */}
            <button
              onClick={onLogout}
              title={isCollapsed ? 'Déconnexion' : undefined}
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 text-slate-400 hover:bg-red-500/20 hover:text-red-400 rounded-xl w-full transition-all duration-200 group`}
            >
              <LogOut className="w-5 h-5 group-hover:text-red-400 transition-colors flex-shrink-0" />
              <span className={`font-medium transition-all duration-300 ${isCollapsed ? 'hidden' : 'block'}`}>
                Déconnexion
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
