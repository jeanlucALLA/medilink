'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle, ArrowRight, PartyPopper } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'

export default function SubscriptionSuccessPage() {
    const { width, height } = useWindowSize()
    const [showConfetti, setShowConfetti] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => setShowConfetti(false), 8000)
        return () => clearTimeout(timer)
    }, [])

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            {showConfetti && <Confetti width={width} height={height} numberOfPieces={200} recycle={false} />}

            <main className="flex items-center justify-center min-h-[80vh] px-4">
                <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center animate-fade-in-up border border-gray-100 relative overflow-hidden">

                    {/* Decorative background circle */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-50 rounded-full blur-3xl -z-10"></div>

                    <div className="mb-8 flex justify-center">
                        <div className="relative">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-bounce-slow">
                                <CheckCircle className="w-12 h-12 text-green-600" />
                            </div>
                            <div className="absolute -top-2 -right-2">
                                <PartyPopper className="w-8 h-8 text-yellow-500 animate-wiggle" />
                            </div>
                        </div>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
                        Paiement validé !
                        <span className="block text-primary mt-2">Bienvenue sur Medi-Link.</span>
                    </h1>

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8">
                        <p className="text-blue-900 font-medium text-lg mb-1">
                            Abonnement Professionnelle actif
                        </p>
                        <div className="flex items-center justify-center gap-2 text-blue-700">
                            <span className="text-2xl font-bold">9,99€</span>
                            <span className="text-sm">/ mois</span>
                        </div>
                        <p className="text-xs text-blue-600 mt-2">
                            Renouvellement automatique • Annulable à tout moment
                        </p>
                    </div>

                    <p className="text-gray-600 text-lg mb-10 leading-relaxed">
                        Votre cabinet est prêt à passer un cap. Commencez dès maintenant à automatiser votre suivi patient.
                    </p>

                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg hover:shadow-primary/30 transform hover:scale-[1.02] transition-all duration-300 w-full md:w-auto"
                    >
                        Accéder à mon espace praticien
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </main>
        </div>
    )
}
