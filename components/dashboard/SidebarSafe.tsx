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
    <aside
      className={`${sidebarWidth} fixed h-screen bg-white/80 backdrop-blur-xl border-r border-gray-100 transition-all duration-300 ease-in-out overflow-hidden z-40 shadow-sm`}
    >
      <div className={`${isCollapsed ? 'p-3' : 'p-6'} flex flex-col h-full transition-all duration-300`}>
        {/* Header with Logo and Toggle */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-8 ${isCollapsed ? '' : 'pl-2'}`}>
          {/* Logo */}
          <Link
            href="/dashboard"
            className={`flex items-center gap-2 text-2xl font-bold text-gray-900 tracking-tight hover:opacity-80 transition-opacity no-underline ${isCollapsed ? 'justify-center' : ''}`}
          >
            {/* Simple Logo Icon */}
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </div>
            {/* Text - hidden when collapsed */}
            <span className={`transition-all duration-300 ${isCollapsed ? 'hidden' : 'block'}`}>
              TopLinkSante
            </span>
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
                  className="lg:hidden text-gray-500 hover:text-gray-900"
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
            className={`hidden lg:flex items-center ${isCollapsed ? 'justify-center' : 'justify-end'} mb-4 text-gray-400 hover:text-primary transition-colors`}
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
        <nav className="space-y-1.5 flex-grow">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/dashboard')

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleLinkClick(item.href, e)}
                title={isCollapsed ? item.label : undefined}
                className={`group flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-2xl transition-all duration-200 ${isActive
                  ? 'bg-primary/5 text-primary font-semibold shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {/* Label - hidden when collapsed */}
                <span className={`transition-all duration-300 ${isCollapsed ? 'hidden' : 'block'}`}>
                  {item.label}
                </span>
                {isActive && !isCollapsed && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </Link>
            )
          })}
        </nav>



        {/* Footer */}
        <div className={`mt-4 pt-4 border-t border-gray-100 ${isCollapsed ? 'px-1' : ''}`}>
          {/* User Profile - only when not collapsed */}
          {praticienNom && !isCollapsed && (
            <div className="flex items-center space-x-3 px-2 py-3 mb-2 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100 text-primary font-bold">
                {getInitials(praticienNom)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 font-semibold text-sm truncate mr-2">
                  {praticienNom}
                </p>
                <p className="text-xs text-gray-400 truncate">Praticien</p>
              </div>
            </div>
          )}

          {/* Collapsed user avatar */}
          {praticienNom && isCollapsed && (
            <div className="flex justify-center mb-2">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-primary font-bold text-sm">
                {getInitials(praticienNom)}
              </div>
            </div>
          )}

          {/* Logout button */}
          <button
            onClick={onLogout}
            title={isCollapsed ? 'Déconnexion' : undefined}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-2xl w-full transition-colors group`}
          >
            <LogOut className="w-5 h-5 group-hover:text-red-600 transition-colors flex-shrink-0" />
            <span className={`font-medium transition-all duration-300 ${isCollapsed ? 'hidden' : 'block'}`}>
              Déconnexion
            </span>
          </button>
        </div>
      </div>
    </aside>
  )
}
