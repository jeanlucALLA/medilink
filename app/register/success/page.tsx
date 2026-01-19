'use client'

import Link from 'next/link'
import { Check, Shield, Activity, ArrowRight } from 'lucide-react'

export default function RegisterSuccessPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-xl">
                {/* Logo */}
                <div className="flex justify-center mb-10">
                    <Link href="/" className="flex items-center group">
                        <img
                            src="/logo-toplinksante.png"
                            alt="TopLinkSanté"
                            className="h-12 w-auto group-hover:scale-110 transition-transform duration-300"
                        />
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
                            Bienvenue sur TopLinkSante <br />
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
                                <p className="text-sm text-gray-600 mt-1">TopLinkSante est désormais connecté. Vos questionnaires partiront automatiquement.</p>
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

                    <p className="mt-6 text-center text-sm text-gray-500">
                        Besoin d&apos;aide pour démarrer ? <a href="mailto:support@medilink.fr" className="font-medium text-primary hover:text-primary-dark">Contactez le support</a>
                    </p>
                </div>
            </div>
        </div>
    )
}
