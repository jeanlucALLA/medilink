'use client'

import Link from 'next/link'
import { Check, Shield, Activity, ArrowRight } from 'lucide-react'

export default function RegisterSuccessPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-xl">
                {/* Logo */}
                <div className="flex justify-center mb-10">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold text-gray-900 tracking-tight">Medi.Link</span>
                    </Link>
                </div>

                <div className="bg-white py-12 px-8 shadow-xl border border-gray-100 rounded-[24px] sm:px-10 relative overflow-hidden">
                    {/* Success Confetti/Background Effect */}
                    <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

                    <div className="text-center mb-10">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6 animate-bounce-slow">
                            <Check className="h-8 w-8 text-green-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-4">
                            Bienvenue sur Medi.Link <br />
                            <span className="text-primary">Votre suivi patient est activé 🚀</span>
                        </h2>
                        <p className="text-gray-600 text-lg leading-relaxed">
                            Félicitations, Docteur. Vous avez franchi le pas vers un cabinet plus performant et automatisé.
                        </p>
                    </div>

                    <div className="space-y-6 mb-10">
                        {/* Step 1: Activation */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                            <div className="p-2 bg-blue-100 rounded-lg text-primary shrink-0">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Activation réussie</h3>
                                <p className="text-sm text-gray-600 mt-1">Medi.Link est désormais connecté. Vos questionnaires partiront automatiquement.</p>
                            </div>
                        </div>

                        {/* Step 2: Feedback */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 shrink-0">
                                <ArrowRight className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Boucle de feedback</h3>
                                <p className="text-sm text-gray-600 mt-1">Vos premiers retours patients arriveront directement dans votre tableau de bord.</p>
                            </div>
                        </div>

                        {/* Step 3: Security */}
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-green-50 border border-green-100">
                            <div className="p-2 bg-green-100 rounded-lg text-green-600 shrink-0">
                                <Shield className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Protocole Zéro Persistance</h3>
                                <p className="text-sm text-gray-600 mt-1">Vos données sont effacées physiquement après chaque lecture. Sécurité maximale.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <Link
                            href="/dashboard"
                            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-lg text-lg font-bold text-white bg-primary hover:bg-primary-dark hover:shadow-primary/30 hover:scale-[1.02] transform transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        >
                            Accéder à mon Dashboard
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                    </div>

                    <p className="mt-6 text-center text-sm text-gray-400">
                        Besoin d'aide pour démarrer ? <a href="mailto:support@medilink.fr" className="font-medium text-primary hover:text-primary-dark">Contactez le support</a>
                    </p>
                </div>
            </div>
        </div>
    )
}
