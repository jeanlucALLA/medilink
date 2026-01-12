'use client'

import { Mail, MessageSquare, Trash2, BarChart3, Send, Star, AlertCircle } from 'lucide-react'

export default function FeatureSection() {
    return (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/50">
            <div className="max-w-7xl mx-auto">
                <div className="mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">La boucle vertueuse pour une satisfaction patient optimale.</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(300px,auto)]">

                    {/* Card 1: Suivi Patient Automatisé (Large - 2 cols) */}
                    <div className="md:col-span-2 bg-white rounded-[24px] p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group relative overflow-hidden flex flex-col justify-between">
                        <div>
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                                <Mail className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Suivi Patient Automatisé</h3>
                            <p className="text-gray-500 text-lg max-w-lg leading-relaxed">
                                Après chaque consultation, TopLinkSante envoie automatiquement un questionnaire personnalisé par email à vos patients.
                            </p>
                            <p className="text-primary font-medium mt-2">Zéro intervention manuelle.</p>
                        </div>

                        {/* Visual: Mini-Schema of sending email */}
                        <div className="mt-8 bg-gray-50 rounded-2xl p-6 border border-gray-100 flex items-center justify-around relative overflow-hidden">
                            {/* Step A */}
                            <div className="flex flex-col items-center z-10">
                                <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center border border-gray-200">
                                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                                </div>
                                <span className="text-xs font-semibold text-gray-500 mt-2">Consultation</span>
                            </div>

                            {/* Connector Animation */}
                            <div className="flex-1 h-0.5 bg-gray-200 mx-4 relative overflow-hidden">
                                <div className="absolute inset-0 bg-primary w-1/2 animate-progress-slide"></div>
                            </div>

                            {/* Step B */}
                            <div className="flex flex-col items-center z-10">
                                <div className="w-10 h-10 bg-blue-100 rounded-full shadow-sm flex items-center justify-center text-primary">
                                    <Send className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-semibold text-gray-500 mt-2">Envoi Auto</span>
                            </div>
                        </div>

                        <div className="absolute top-0 right-0 p-4">
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                Système actif
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Feedback & Réputation (Medium - 1 col) */}
                    <div className="md:col-span-1 bg-white rounded-[24px] p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <div className="bg-white border border-gray-100 shadow-sm p-2 rounded-xl">
                                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Feedback Instantané & Réputation</h3>
                        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                            Le patient évalue en 30s. <br />
                            <span className="font-semibold text-gray-700">Avis positif → Google.</span> <br />
                            <span className="font-semibold text-gray-700">Insatisfaction → Alerte.</span>
                        </p>

                        {/* Visual Representation of Split */}
                        <div className="mt-auto grid grid-cols-2 gap-2">
                            <div className="bg-green-50 p-3 rounded-xl text-center">
                                <Star className="w-4 h-4 text-green-600 mx-auto mb-1" />
                                <span className="text-[10px] font-bold text-green-700">Google</span>
                            </div>
                            <div className="bg-red-50 p-3 rounded-xl text-center">
                                <AlertCircle className="w-4 h-4 text-red-600 mx-auto mb-1" />
                                <span className="text-[10px] font-bold text-red-700">Alerte</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Zéro Persistance (Medium - 1 col) */}
                    <div className="md:col-span-1 bg-gray-900 rounded-[24px] p-8 shadow-md hover:shadow-xl transition-all duration-300 text-white flex flex-col justify-between group overflow-hidden relative">
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
                                <Trash2 className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Zéro Persistance</h3>
                            <p className="text-gray-400 text-sm leading-relaxed mb-4">
                                Conformité RGPD absolue : les données médicales sont <span className="text-white font-semibold">effacées physiquement</span> de nos serveurs dès lecture.
                            </p>
                        </div>

                        {/* Privacy Shield Visual */}
                        <div className="mt-4 flex items-center gap-3 bg-gray-800/50 p-3 rounded-xl border border-gray-700">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            </div>
                            <span className="text-xs font-mono text-gray-300">Data_Wipe: Enabled</span>
                        </div>
                    </div>

                    {/* Card 4: Benchmark (Small -> 1 col) + CTA Filler */}
                    <div className="md:col-span-1 bg-white rounded-[24px] p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group flex flex-col">
                        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-6 text-green-600">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Benchmark & Performance</h3>
                        <p className="text-gray-500 text-sm mb-6">Comparez vos scores avec la moyenne de votre région.</p>

                        <div className="flex items-end gap-2 h-24 mt-auto w-full px-2">
                            <div className="w-1/3 flex flex-col justify-end items-center group/bar">
                                <span className="text-[10px] text-gray-400 mb-1 opacity-0 group-hover/bar:opacity-100 transition-opacity">Reg</span>
                                <div className="w-full bg-gray-100 rounded-t-lg h-[40%]"></div>
                            </div>
                            <div className="w-1/3 flex flex-col justify-end items-center group/bar">
                                <span className="text-[10px] text-gray-400 mb-1 opacity-0 group-hover/bar:opacity-100 transition-opacity">Nat</span>
                                <div className="w-full bg-gray-200 rounded-t-lg h-[60%]"></div>
                            </div>
                            <div className="w-1/3 flex flex-col justify-end items-center relative">
                                <div className="absolute -top-6 bg-primary text-white text-[10px] px-2 py-0.5 rounded-full shadow-lg font-bold">You</div>
                                <div className="w-full bg-primary rounded-t-lg h-[80%]"></div>
                            </div>
                        </div>
                    </div>

                    {/* CTA Card to complete grid layout (3 cols -> 2+1, 1+1+1) */}
                    <div className="md:col-span-1 bg-gradient-to-br from-primary to-blue-600 rounded-[24px] p-8 shadow-lg text-white flex flex-col justify-center items-center text-center relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <h3 className="text-2xl font-bold mb-4 relative z-10">Prêt à commencer ?</h3>
                        <p className="text-blue-100 mb-8 max-w-xs relative z-10">Rejoignez 5000+ praticiens aujourd&apos;hui.</p>
                        <button className="bg-white text-primary px-8 py-3 rounded-full font-bold hover:bg-blue-50 transition-colors shadow-lg relative z-10">
                            Créer un compte
                        </button>
                    </div>

                </div>
            </div>
        </section>
    )
}
