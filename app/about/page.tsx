'use client'

import Link from 'next/link'
import { ArrowLeft, Heart, Users, Target, Sparkles, Stethoscope, Activity } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Hero Section */}
            <section className="pt-32 pb-16 bg-gradient-to-b from-blue-50 to-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                        <Heart className="w-4 h-4" />
                        <span>Notre histoire</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        Née d&apos;un besoin réel sur le terrain
                    </h1>
                    <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
                        TopLinkSante est le fruit d&apos;une collaboration entre des professionnels de santé
                        qui voulaient révolutionner le suivi patient.
                    </p>
                </div>
            </section>

            {/* Story Section */}
            <section id="story" className="py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="prose prose-lg max-w-none">

                        {/* Chapter 1 */}
                        <div className="mb-16">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Stethoscope className="w-6 h-6 text-primary" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 m-0">Le constat</h2>
                            </div>
                            <p className="text-gray-600 leading-relaxed text-lg">
                                Tout a commencé dans les cabinets de podologie et les blocs opératoires de chirurgie orthopédique.
                                Chaque jour, des praticiens voyaient leurs patients repartir après une consultation ou une intervention,
                                sans aucun moyen de savoir comment ils évoluaient réellement.
                            </p>
                            <p className="text-gray-600 leading-relaxed text-lg">
                                <strong className="text-gray-900">&quot;Comment va mon patient 15 jours après son opération du pied ?&quot;</strong>
                                <br />
                                <strong className="text-gray-900">&quot;Ses semelles orthopédiques lui conviennent-elles vraiment ?&quot;</strong>
                            </p>
                            <p className="text-gray-600 leading-relaxed text-lg">
                                Ces questions restaient souvent sans réponse, jusqu&apos;au prochain rendez-vous...
                                parfois des mois plus tard.
                            </p>
                        </div>

                        {/* Chapter 2 */}
                        <div className="mb-16">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <Users className="w-6 h-6 text-green-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 m-0" id="team">L&apos;équipe fondatrice</h2>
                            </div>
                            <p className="text-gray-600 leading-relaxed text-lg">
                                C&apos;est ainsi qu&apos;une équipe de <strong className="text-gray-900">podologues</strong> et de
                                <strong className="text-gray-900"> chirurgiens orthopédiques</strong> s&apos;est réunie autour d&apos;une
                                idée simple mais puissante : créer un pont numérique entre le cabinet et le quotidien du patient.
                            </p>
                            <p className="text-gray-600 leading-relaxed text-lg">
                                Ensemble, ils ont conçu une solution qui leur ressemble :
                                <strong className="text-gray-900"> simple, rapide et efficace</strong>.
                                Pas de logiciel complexe à installer, pas de formation interminable.
                                Juste un outil qui s&apos;intègre naturellement dans la pratique quotidienne.
                            </p>
                        </div>

                        {/* Chapter 3 */}
                        <div className="mb-16">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <Target className="w-6 h-6 text-purple-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 m-0" id="mission">Notre mission</h2>
                            </div>
                            <p className="text-gray-600 leading-relaxed text-lg">
                                Aujourd&apos;hui, <strong className="text-primary">TopLinkSante</strong> permet à des centaines
                                de professionnels de santé de collecter des retours patients automatiquement,
                                d&apos;identifier les alertes rapidement, et d&apos;améliorer continuellement leur pratique.
                            </p>

                            <div className="bg-primary/5 border-l-4 border-primary rounded-r-xl p-6 my-8">
                                <p className="text-gray-900 font-medium text-lg m-0 italic">
                                    &quot;Nous avons créé l&apos;outil que nous aurions aimé avoir depuis le premier jour
                                    de notre exercice.&quot;
                                </p>
                                <p className="text-gray-500 text-sm mt-2 m-0">— L&apos;équipe fondatrice de TopLinkSante</p>
                            </div>
                        </div>

                        {/* Values */}
                        <div>
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                                    <Sparkles className="w-6 h-6 text-yellow-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 m-0">Nos valeurs</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                                <div className="bg-gray-50 rounded-xl p-6 text-center">
                                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Activity className="w-7 h-7 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Simplicité</h3>
                                    <p className="text-sm text-gray-600">
                                        Un questionnaire envoyé en 30 secondes. Pas de formation requise.
                                    </p>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-6 text-center">
                                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Confidentialité</h3>
                                    <p className="text-sm text-gray-600">
                                        Architecture Zero-Data. Aucune donnée de santé stockée.
                                    </p>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-6 text-center">
                                    <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Heart className="w-7 h-7 text-purple-600" />
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-2">Humanité</h3>
                                    <p className="text-sm text-gray-600">
                                        Conçu par des soignants, pour des soignants.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-primary">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">
                        Rejoignez la communauté TopLinkSante
                    </h2>
                    <p className="text-blue-100 text-lg mb-8">
                        Des centaines de professionnels de santé nous font déjà confiance.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link
                            href="/register"
                            className="px-8 py-3 bg-white text-primary font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            Créer mon compte gratuitement
                        </Link>
                        <Link
                            href="/abonnement"
                            className="px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
                        >
                            Voir les tarifs
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}
