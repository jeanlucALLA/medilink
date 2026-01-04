'use client'

import Navbar from '@/components/Navbar'
import { Check, Shield, Zap, Users, Star, BarChart3, Loader2 } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { STRIPE_PRICE_IDS } from '@/lib/constants'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

// Initialisation Stripe (Lazy load)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function AbonnementPage() {
    const [loadingTier, setLoadingTier] = useState<string | null>(null)
    const router = useRouter()

    const handleSubscribe = async (tier: 'premium' | 'cabinet') => {
        setLoadingTier(tier)

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

            const { error } = await stripe.redirectToCheckout({ sessionId })
            if (error) throw error

        } catch (error: any) {
            console.error('Erreur souscription:', error)
            toast.error("Impossible d'initier le paiement. Veuillez réessayer.")
        } finally {
            setLoadingTier(null)
        }
    }

    return (
        <div className="min-h-screen bg-secondary">
            <Navbar />

            <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in-up">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                        Une offre adaptée à chaque pratique.
                    </h1>
                    <p className="text-xl text-gray-600">
                        Commencez gratuitement, évoluez selon vos besoins.
                        <span className="block text-primary font-medium mt-2">Sans engagement. Annulable à tout moment.</span>
                    </p>
                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">

                    {/* Pack Premium (Recommended) */}
                    <div className="bg-white rounded-[24px] p-8 shadow-xl border-2 border-primary/10 flex flex-col relative transform md:-translate-y-4 relative z-10 group">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">
                            Recommandé
                        </div>

                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Pack Premium</h3>
                            <p className="text-gray-500 text-sm h-10">Boostez votre réputation & sécurisez votre pratique.</p>
                            <div className="mt-6 flex items-baseline">
                                <span className="text-4xl font-bold text-gray-900">9,99€</span>
                                <span className="text-gray-500 ml-2">/ mois</span>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4 mb-8">
                            <div className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <span className="text-gray-900 font-medium text-sm">Questionnaires illimités</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <Star className="w-5 h-5 text-yellow-400 fill-current shrink-0 mt-0.5" />
                                <span className="text-gray-900 font-medium text-sm">Redirection Avis Google</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <span className="text-gray-900 font-medium text-sm">Alertes insatisfaction temps réel</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <BarChart3 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <span className="text-gray-900 font-medium text-sm">Accès Benchmark Régional</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <Shield className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                <span className="text-gray-900 font-medium text-sm">Badge Zéro Persistance</span>
                            </div>
                        </div>

                        <button
                            onClick={() => handleSubscribe('premium')}
                            disabled={loadingTier === 'premium'}
                            className="w-full py-4 rounded-2xl bg-primary text-white font-bold hover:bg-primary-dark shadow-lg hover:shadow-primary/30 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            {loadingTier === 'premium' ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Redirection...
                                </>
                            ) : (
                                'Essayer gratuitement 14 jours'
                            )}
                        </button>
                        <p className="text-xs text-center text-gray-400 mt-4">Puis 9,99€/mois • Sans engagement</p>
                    </div>

                    {/* Pack Cabinet / Groupe */}
                    <div className="bg-white rounded-[24px] p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col relative group">
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Cabinet / Groupe</h3>
                            <p className="text-gray-500 text-sm h-10">Pour les structures multi-praticiens.</p>
                            <div className="mt-6 flex items-baseline">
                                <span className="text-4xl font-bold text-gray-900">39,99€</span>
                                <span className="text-gray-500 ml-2">/ mois</span>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4 mb-8">
                            <div className="flex items-start gap-3">
                                <Users className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                <span className="text-gray-600 text-sm">Gestion multi-praticiens</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <BarChart3 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                <span className="text-gray-600 text-sm">Statistiques de groupe</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <Zap className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                <span className="text-gray-600 text-sm">Support prioritaire dédié</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <Shield className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                <span className="text-gray-600 text-sm font-medium">Badge Zéro Persistance</span>
                            </div>
                        </div>

                        <button
                            onClick={() => handleSubscribe('cabinet')}
                            disabled={loadingTier === 'cabinet'}
                            className="w-full py-3 rounded-2xl border-2 border-gray-100 text-gray-900 font-bold hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                        >
                            {loadingTier === 'cabinet' ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Patientez...
                                </>
                            ) : (
                                'Essayer gratuitement'
                            )}
                        </button>
                        <p className="text-xs text-center text-gray-400 mt-4">Puis 39,99€/mois • Sans engagement</p>
                    </div>

                </div>

                {/* Reassurance Footer */}
                <div className="mt-20 text-center border-t border-gray-200 pt-10 mb-20">
                    <div className="flex flex-col md:flex-row justify-center items-center gap-8 text-gray-500 text-sm">
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-green-500" />
                            <span>Données de santé sécurisées</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-primary" />
                            <span>Conformité RGPD stricte</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-500" />
                            <span>Installation en 2 minutes</span>
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
                                    <span className="font-bold text-gray-900">Mes données patients sont-elles en sécurité ?</span>
                                    <span className="transition group-open:rotate-180">
                                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                    </span>
                                </summary>
                                <div className="text-gray-600 px-6 pb-6 pt-0 leading-relaxed">
                                    Oui. Grâce à notre protocole 'Zéro Persistance', les données médicales sont stockées uniquement en mémoire vive et effacées physiquement dès que vous avez pris connaissance du résultat.
                                </div>
                            </details>
                        </div>

                        {/* Q2 */}
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            <details className="group">
                                <summary className="flex justify-between items-center p-6 cursor-pointer list-none">
                                    <span className="font-bold text-gray-900">Est-ce conforme au RGPD ?</span>
                                    <span className="transition group-open:rotate-180">
                                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                    </span>
                                </summary>
                                <div className="text-gray-600 px-6 pb-6 pt-0 leading-relaxed">
                                    Absolument. Medi.Link respecte strictement les normes européennes. Nous ne conservons aucune donnée de santé à long terme sur nos serveurs.
                                </div>
                            </details>
                        </div>

                        {/* Q3 */}
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            <details className="group">
                                <summary className="flex justify-between items-center p-6 cursor-pointer list-none">
                                    <span className="font-bold text-gray-900">Puis-je annuler mon abonnement à tout moment ?</span>
                                    <span className="transition group-open:rotate-180">
                                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                    </span>
                                </summary>
                                <div className="text-gray-600 px-6 pb-6 pt-0 leading-relaxed">
                                    Oui, tous nos abonnements sont sans engagement. Vous pouvez arrêter le service depuis votre tableau de bord en un clic.
                                </div>
                            </details>
                        </div>

                        {/* Q4 */}
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            <details className="group">
                                <summary className="flex justify-between items-center p-6 cursor-pointer list-none">
                                    <span className="font-bold text-gray-900">Comment fonctionne l'envoi automatique ?</span>
                                    <span className="transition group-open:rotate-180">
                                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                    </span>
                                </summary>
                                <div className="text-gray-600 px-6 pb-6 pt-0 leading-relaxed">
                                    Une fois configuré, Medi.Link détecte la fin de vos consultations et déclenche l'envoi du questionnaire par email sans aucune action manuelle de votre part.
                                </div>
                            </details>
                        </div>
                    </div>

                    <div className="mt-12 text-center">
                        <p className="text-gray-600 mb-4">D'autres questions ?</p>
                        <a href="mailto:support@medilink.fr" className="inline-flex items-center text-primary font-bold hover:underline">
                            Contactez notre support praticien
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </a>
                    </div>
                </div>
            </main>
        </div>
    )
}
