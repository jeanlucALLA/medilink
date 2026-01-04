'use client'

import { Play } from 'lucide-react'

export default function VideoSection() {
    return (
        <section className="py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="relative w-full rounded-[32px] overflow-hidden shadow-2xl border-4 border-white/50 ring-1 ring-gray-200 aspect-video group cursor-pointer bg-gray-900">

                    {/* Poster Image */}
                    {/* Using the generated image path relative to public or as absolute if possible. 
              Since we don't have the image in public/, I will use a placeholder or style it such that the user knows where to put it.
              The prompt generated an image earlier. I should try to use that if I can move it, but I cannot move files easily to public without 'run_command'.
              For now, I'll use a gradient placeholder or a stylized div, and suggest the user moves the file.
          */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out"></div>

                    {/* Content Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/30 backdrop-blur-[2px] hover:backdrop-blur-none transition-all">

                        <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-300 ring-1 ring-white/50 mb-8">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg pl-1">
                                <Play className="w-8 h-8 text-primary fill-current" />
                            </div>
                        </div>

                        <h3 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight drop-shadow-lg">
                            Découvrez Medi.Link
                        </h3>
                        <p className="text-lg text-gray-200 max-w-2xl drop-shadow-md">
                            Voyez comment nous transformons la gestion médicale.
                        </p>
                    </div>

                    {/* Border glow effect */}
                    <div className="absolute inset-0 border border-white/10 rounded-[32px] pointer-events-none"></div>
                </div>
            </div>
        </section>
    )
}
