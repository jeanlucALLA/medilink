'use client'

import { Star } from 'lucide-react'
import Image from 'next/image'

const testimonials = [
    {
        name: 'Dr. Sophie Martin',
        role: 'Généraliste',
        avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
        content: "L'envoi automatique des questionnaires après chaque acte me fait gagner un temps précieux. Je ne m'occupe plus de rien, le suivi se fait tout seul.",
        stars: 5
    },
    {
        name: 'Dr. Thomas Dubreuil',
        role: 'Dentiste',
        avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
        content: "Depuis que j'utilise Medi.Link, mes avis Google ont explosé. La redirection automatique des patients satisfaits est un moteur de croissance incroyable pour mon cabinet.",
        stars: 5
    },
    {
        name: 'Cabinet Médical des Lilas',
        role: 'Secrétariat',
        avatar: 'https://i.pravatar.cc/150?u=a04258114e29026302d',
        content: "Le système d'alerte en cas d'insatisfaction nous permet de recontacter immédiatement le patient. C'est l'outil parfait pour désamorcer les conflits avant qu'ils ne finissent en avis négatifs.",
        stars: 5
    }
]

export default function Testimonials() {
    return (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-100">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Ils ont choisi Medi.Link</h2>
                    <p className="text-gray-500">Rejoignez une communauté de praticiens exigeants.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((t, i) => (
                        <div key={i} className="bg-secondary/30 rounded-3xl p-8 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100">
                            <div className="flex items-center space-x-1 mb-4">
                                {[...Array(t.stars)].map((_, j) => (
                                    <Star key={j} className="w-5 h-5 text-yellow-500 fill-current" />
                                ))}
                            </div>
                            <p className="text-gray-700 italic mb-6">&quot;{t.content}&quot;</p>
                            <div className="flex items-center space-x-4">
                                <Image src={t.avatar} alt={t.name} width={48} height={48} className="rounded-full ring-2 ring-white" />
                                <div>
                                    <h4 className="font-bold text-gray-900">{t.name}</h4>
                                    <p className="text-sm text-primary font-medium">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
