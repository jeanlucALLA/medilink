'use client'

import { Search, MapPin, Stethoscope, ArrowRight } from 'lucide-react'

export default function Hero() {
    return (
        <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                <div className="absolute top-20 left-10 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl mix-blend-multiply opacity-70 animate-blob"></div>
                <div className="absolute top-20 right-10 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl mix-blend-multiply opacity-70 animate-blob animation-delay-2000"></div>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 tracking-tight mb-8">
                    Pilotez la satisfaction <br className="hidden sm:block" />
                    <span className="text-primary">de vos patients, automatiquement.</span>
                </h1>

                <p className="max-w-3xl mx-auto text-xl text-gray-600 mb-12 leading-relaxed">
                    La plateforme intelligente qui automatise votre suivi post-consultation, booste votre réputation Google et sécurise vos données.
                </p>

                {/* Email Capture Action */}
                <div className="max-w-lg mx-auto mb-16 relative z-20">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="email"
                            placeholder="Votre email professionnel"
                            className="flex-1 px-6 py-4 rounded-full border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm text-lg"
                        />
                        <button className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-full text-lg font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 whitespace-nowrap">
                            Essayer gratuitement
                        </button>
                    </div>
                    <p className="text-sm text-gray-400 mt-3">14 jours d'essai gratuit • Sans carte bancaire</p>
                </div>

                {/* Scrolling Professions Ticker (Below CTA) */}
                <div className="max-w-6xl mx-auto mb-20 overflow-hidden relative fade-mask-x opacity-80">
                    <div className="flex overflow-hidden relative w-full">
                        <div className="flex animate-scroll whitespace-nowrap gap-4 hover:paused">
                            {[...Array(2)].map((_, i) => (
                                <div key={i} className="flex gap-4 items-center">
                                    {['Médecins', 'Dentistes', 'Kinésithérapeutes', 'Ostéopathes', 'Psychologues', 'Infirmiers', 'Chirurgiens', 'Dermatologues', 'Ophtalmologues'].map((job, index) => (
                                        <div key={index} className="flex items-center gap-4">
                                            <span className="text-lg font-medium text-gray-400">
                                                {job}
                                            </span>
                                            <span className="text-gray-300">•</span>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Trust Signals */}
                <div className="mt-16 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                    <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">
                        Ils nous font confiance
                    </p>
                    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
                        {/* Placeholder Logos */}
                        {['MedTech', 'HealthCare', 'DoctoPro', 'KineFrance'].map((name) => (
                            <div key={name} className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                <span className="text-lg font-bold text-gray-400">{name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
