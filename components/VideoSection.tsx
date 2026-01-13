'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Play } from 'lucide-react'

export default function VideoSection() {
    const [isLoaded, setIsLoaded] = useState(false)
    const videoId = 's2MuMbh6VWA'

    return (
        <section className="py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="w-full max-w-4xl mx-auto rounded-[32px] overflow-hidden shadow-2xl border-4 border-white/50 ring-1 ring-gray-200 bg-gray-900 group">
                    <div className="relative pb-[56.25%] h-0">
                        {!isLoaded ? (
                            // Facade Pattern: Show thumbnail until user clicks
                            <button
                                onClick={() => setIsLoaded(true)}
                                className="absolute top-0 left-0 w-full h-full bg-gray-900 flex items-center justify-center group cursor-pointer"
                                aria-label="Lire la vidéo de présentation"
                            >
                                {/* YouTube Thumbnail - Next.js Image for optimized loading */}
                                <Image
                                    src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
                                    alt="Présentation TopLinkSante"
                                    fill
                                    sizes="(max-width: 768px) 100vw, 896px"
                                    className="object-cover rounded-[28px]"
                                    loading="lazy"
                                />
                                {/* Play Button Overlay */}
                                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center rounded-[28px]">
                                    <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                        <Play className="w-10 h-10 text-white ml-1" fill="white" />
                                    </div>
                                </div>
                            </button>
                        ) : (
                            <iframe
                                className="absolute top-0 left-0 w-full h-full rounded-[28px]"
                                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title="Présentation TopLinkSante"
                            ></iframe>
                        )}
                    </div>
                </div>

                <div className="text-center mt-8">
                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Découvrez TopLinkSante en action
                    </h3>
                </div>
            </div>
        </section>
    )
}
