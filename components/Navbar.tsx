'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import NotificationBell from './admin/NotificationBell'

export default function Navbar() {
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        const checkAdmin = async () => {
            const { supabase } = await import('@/lib/supabase') as any
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', user.id)
                    .single()

                if (profile?.is_admin) {
                    setIsAdmin(true)
                }
            }
        }
        checkAdmin()
    }, [])

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-lg border-b border-gray-100 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="flex items-center gap-2">
                            {/* Croix médicale TopLinkSanté */}
                            <svg className="h-8 w-8" viewBox="0 0 40 40" fill="none">
                                <rect x="14" y="4" width="12" height="32" rx="2" fill="#0D9488" />
                                <rect x="4" y="14" width="32" height="12" rx="2" fill="#3B82F6" />
                            </svg>
                            <span className="text-2xl font-bold text-gray-900 tracking-tight">TopLinkSanté</span>
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="/abonnement" className="text-gray-600 hover:text-primary font-medium transition-colors">
                            Abonnement
                        </Link>
                        {isAdmin && (
                            <div className="border-l border-gray-200 pl-8 flex items-center gap-4">
                                <Link href="/admin" className="text-gray-600 hover:text-primary font-medium transition-colors">
                                    Administration
                                </Link>
                                <NotificationBell />
                            </div>
                        )}
                    </div>

                    {/* CTA Button */}
                    <div className="flex items-center">
                        <Link
                            href="/login"
                            className="group relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 bg-primary rounded-3xl hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        >
                            <span>Espace Praticien</span>
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    )
}
