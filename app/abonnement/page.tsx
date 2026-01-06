'use client'

import Navbar from '@/components/Navbar'
import { Check, Shield, Zap, Info, Loader2 } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { STRIPE_PRICE_IDS } from '@/lib/constants'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

// Initialisation Stripe (Lazy load)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function AbonnementPage() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubscribe = async () => {
        setLoading(true)

        try {
            // 1. Vérifier l'authentification via Supabase
            const { supabase } = await import('@/lib/supabase') as any
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                toast.error('Veuillez vous connecter ou créer un compte pour vous abonner.')
                router.push('/register')
                return
            }

            // 2. Créer la session Stripe via notre API
            const tier = 'pro' // Single tier now
            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    priceId: STRIPE_PRICE_IDS[tier],
                    tier: tier,
                    userId: user.id
                })
            })

            if (!response.ok) {
                const error = await response.text()
                throw new Error(error)
            }

            const { sessionId } = await response.json()

            // 3. Rediriger vers Stripe Checkout
            const stripe = await stripePromise
            if (!stripe) throw new Error('Stripe non chargé')

            const { error } = await (stripe as any).redirectToCheckout({ sessionId })
            if (error) throw error

        } catch (error: any) {
            console.error('Erreur souscription:', error)
            toast.error("Impossible d'initier le paiement. Veuillez réessayer.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-secondary">
            <Navbar />

            <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in-up">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                        Une offre unique pour les professionnels.
                    </h1>
                    <p className="text-xl text-gray-600">
                        Accédez à l&apos;intégralité des fonctionnalités Medi.Link.
                        <span className="block text-primary font-medium mt-2">Sans engagement. Annulable à tout moment.</span>
                    </p>
                </div>

                {/* Pricing Card */}
                <div className="max-w-md mx-auto">
                    <div className="bg-white rounded-[24px] p-8 shadow-xl border-2 border-primary/10 flex flex-col relative z-10 group transform hover:-translate-y-1 transition-all duration-300">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">
                            Tout inclus
                        </div>

                        <div className="mb-8 text-center">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Abonnement Professionnel Complet</h3>
                            <p className="text-gray-500 text-sm h-6">Pour les praticiens exigeants.</p>
                            <div className="mt-6 flex items-baseline justify-center">
                                <span className="text-5xl font-bold text-gray-900">19,99€</span>
                                <span className="text-gray-500 ml-2">/ mois</span>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4 mb-8">
                            <div className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <span className="text-gray-900 font-medium text-sm">Questionnaires illimités</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <span className="text-gray-900 font-medium text-sm">Tableau de bord statistique complet</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <span className="text-gray-900 font-medium text-sm">Alertes insatisfaction temps réel</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <span className="text-gray-900 font-medium text-sm">Redirection Avis Google</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <Shield className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                <span className="text-gray-900 font-medium text-sm">Données sécurisées & RGPD</span>
                            </div>
                        </div>

                        <button
                            onClick={handleSubscribe}
                            disabled={loading}
                            className="w-full py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary-dark shadow-lg hover:shadow-primary/30 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Redirection...
                                </>
                            ) : (
                                'Commencer maintenant'
                            )}
                        </button>
                        <p className="text-xs text-center text-gray-400 mt-4">Essai de 14 jours inclus • Annulable en 1 clic</p>
                    </div>
                </div>

                {/* Reassurance Footer (Simplified) */}
                <div className="mt-20 text-center border-t border-gray-200 pt-10 mb-20 max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-gray-500 text-sm">
                        <div className="flex flex-col items-center gap-2">
                            <Shield className="w-8 h-8 text-green-500 mb-2" />
                            <span className="font-semibold text-gray-900">100% Sécurisé</span>
                            <span>Données de santé protégées (HDS compatible)</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Zap className="w-8 h-8 text-primary mb-2" />
                            <span className="font-semibold text-gray-900">Automatisé</span>
                            <span>Envoi automatique après consultation</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Info className="w-8 h-8 text-blue-400 mb-2" />
                            <span className="font-semibold text-gray-900">Support Dédié</span>
                            <span>Une équipe à votre écoute 7j/7</span>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="max-w-3xl mx-auto mb-20">
                    <h2 className="text-3xl font-bold text-gray-900 text-center mb-12 tracking-tight">Questions fréquentes</h2>

                    <div className="space-y-4">
                        {/* Q1 */}
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            <details className="group">
                                <summary className="flex justify-between items-center p-6 cursor-pointer list-none">
                                    <span className="font-bold text-gray-900">Y a-t-il une période d&apos;essai ?</span>
                                    <span className="transition group-open:rotate-180">
                                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                    </span>
                                </summary>
                                <div className="text-gray-600 px-6 pb-6 pt-0 leading-relaxed">
                                    Oui, vous bénéficiez de 14 jours d&apos;essai gratuit pour tester toutes les fonctionnalités sans être débité.
                                </div>
                            </details>
                        </div>

                        {/* Q2 */}
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            <details className="group">
                                <summary className="flex justify-between items-center p-6 cursor-pointer list-none">
                                    <span className="font-bold text-gray-900">Puis-je annuler à tout moment ?</span>
                                    <span className="transition group-open:rotate-180">
                                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                    </span>
                                </summary>
                                <div className="text-gray-600 px-6 pb-6 pt-0 leading-relaxed">
                                    Absolument. Il n&apos;y a aucun engagement de durée. L&apos;annulation se fait en un clic depuis votre espace.
                                </div>
                            </details>
                        </div>

                        {/* Q3 */}
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            <details className="group">
                                <summary className="flex justify-between items-center p-6 cursor-pointer list-none">
                                    <span className="font-bold text-gray-900">Est-ce compatible avec mon logiciel métier ?</span>
                                    <span className="transition group-open:rotate-180">
                                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                    </span>
                                </summary>
                                <div className="text-gray-600 px-6 pb-6 pt-0 leading-relaxed">
                                    Medi.Link est conçu pour fonctionner en parallèle de tout logiciel. Il ne nécessite pas d&apos;intégration complexe.
                                </div>
                            </details>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
