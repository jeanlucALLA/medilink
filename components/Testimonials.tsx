'use client'

import Image from 'next/image'
import { Star } from 'lucide-react'

// Données exactement comme demandées
const testimonials = [
    {
        name: "Dr. Marc Leroy",
        specialty: "Chirurgien Orthopédique",
        quote: "Le suivi post-opératoire est crucial. Medi.Link me permet de détecter une complication avant même que le patient ne m'appelle. C'est un filet de sécurité indispensable.",
        stars: 5,
        avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d"
    },
    {
        name: "Sarah Dubois",
        specialty: "Ostéopathe DO",
        quote: "Mes patients apprécient le suivi entre deux séances. Je peux adapter leur plan de traitement en fonction de leurs retours sur les exercices donnés.",
        stars: 5,
        avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d"
    },
    {
        name: "Cabinet KineSport",
        specialty: "Kinésithérapeutes du sport",
        quote: "Pour la réathlétisation, la régularité est clé. L'outil nous aide à maintenir la motivation des athlètes à leur domicile.",
        stars: 5,
        avatar: "https://i.pravatar.cc/150?u=a04258114e29026302d"
    },
    {
        name: "Dr. Amina Benali",
        specialty: "Podologue",
        quote: "L'évaluation du confort des semelles à J+15 et J+30 est automatisée. Je gagne un temps précieux sur les consultations de contrôle.",
        stars: 4,
        avatar: "https://i.pravatar.cc/150?u=a042581f4e29026703d"
    },
    {
        name: "Dr. Thomas Dubreuil",
        specialty: "Dentiste",
        quote: "La redirection automatique des patients satisfaits vers Google a transformé la réputation numérique de mon cabinet.",
        stars: 5,
        avatar: "https://i.pravatar.cc/150?u=a04258a2462d826712d"
    }
];

// Duplication pour l'effet infini
const repeatedTestimonials = [...testimonials, ...testimonials, ...testimonials, ...testimonials];

export default function Testimonials() {
    return (
        <section className="py-24 bg-secondary overflow-hidden border-t border-gray-100">
            {/* Titre */}
            <div className="max-w-7xl mx-auto px-6 text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Ils ont choisi Medi.Link</h2>
                <p className="text-gray-500">Une communauté de praticiens exigeants qui transforme le suivi patient.</p>
            </div>

            {/* Conteneur de défilement Fade Edges pour l'effet premium */}
            <div className="relative w-full">
                {/* Masques de fondu sur les côtés */}
                <div className="absolute inset-y-0 left-0 w-24 md:w-48 bg-gradient-to-r from-secondary to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-24 md:w-48 bg-gradient-to-l from-secondary to-transparent z-10 pointer-events-none" />

                {/* Track animée */}
                <div className="flex animate-scroll hover:pause">
                    {/* Le 'hover:pause' est une option sympa pour lire, mais je peux l'enlever pour un scoll forcé */}
                    {repeatedTestimonials.map((t, index) => (
                        <div
                            key={index}
                            className="flex-shrink-0 w-[350px] md:w-[450px] mx-4"
                        >
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-full flex flex-col justify-between hover:shadow-md transition-shadow duration-300">
                                {/* Étoiles */}
                                <div className="flex gap-1 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-4 h-4 ${i < t.stars ? 'text-yellow-400 fill-current' : 'text-gray-200'}`}
                                        />
                                    ))}
                                </div>

                                {/* Contenu */}
                                <blockquote className="text-gray-700 italic mb-6 leading-relaxed">
                                    &ldquo;{t.quote}&rdquo;
                                </blockquote>

                                {/* Auteur */}
                                <div className="flex items-center gap-4 mt-auto">
                                    <Image
                                        src={t.avatar}
                                        alt={t.name}
                                        width={48}
                                        height={48}
                                        className="rounded-full object-cover bg-gray-100"
                                    />
                                    <div>
                                        <cite className="not-italic font-bold text-gray-900 block">
                                            {t.name}
                                        </cite>
                                        <span className="text-sm font-medium text-primary block">
                                            {t.specialty}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
