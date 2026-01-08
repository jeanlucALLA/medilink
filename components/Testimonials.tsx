import Image from 'next/image'
import { Star } from 'lucide-react'

// Données exactement comme demandées
const testimonials = [
    // ... (keep existing data) ...
];

// ... (keep existing repeated logic) ...

export default function Testimonials() {
    return (
        <section className="py-24 bg-secondary overflow-hidden border-t border-gray-100">
            {/* ... (keep header) ... */}
            <div className="relative w-full">
                {/* ... (keep masks) ... */}
                <div className="flex animate-scroll hover:pause">
                    {repeatedTestimonials.map((t, index) => (
                        <div
                            key={index}
                            className="flex-shrink-0 w-[350px] md:w-[450px] mx-4"
                        >
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-full flex flex-col justify-between hover:shadow-md transition-shadow duration-300">
                                {/* ... (keep stars) ... */}
                                <div className="flex gap-1 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-4 h-4 ${i < t.stars ? 'text-yellow-400 fill-current' : 'text-gray-200'}`}
                                        />
                                    ))}
                                </div>

                                <blockquote className="text-gray-700 italic mb-6 leading-relaxed">
                                    &ldquo;{t.quote}&rdquo;
                                </blockquote>

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
