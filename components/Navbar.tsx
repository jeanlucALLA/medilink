'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-lg border-b border-gray-100 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link href="/" className="text-2xl font-bold text-gray-900 tracking-tight">
                            Medi.Link
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="/abonnement" className="text-gray-600 hover:text-primary font-medium transition-colors">
                            Abonnement
                        </Link>
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
