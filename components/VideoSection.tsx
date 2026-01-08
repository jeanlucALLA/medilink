'use client'

export default function VideoSection() {
    return (
        <section className="py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* 
                  Container pour le centrage et la responsivité.
                  max-w-4xl permet de ne pas avoir une vidéo trop grande sur les grands écrans.
                */}
                <div className="w-full max-w-4xl mx-auto rounded-[32px] overflow-hidden shadow-2xl border-4 border-white/50 ring-1 ring-gray-200 bg-gray-900 group">
                    <div className="relative pb-[56.25%] h-0"> {/* Ratio 16:9 standard pour responsive iframe */}
                        <iframe
                            className="absolute top-0 left-0 w-full h-full rounded-[28px]" /* Coins arrondis internes pour matcher le container */
                            src="https://www.youtube.com/embed/s2MuMbh6VWA"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title="Présentation Medi.Link"
                        ></iframe>
                    </div>
                </div>

                {/* Titre optionnel en dessous pour rappeler la section, peut être retiré si le user veut juste la vidéo */}
                <div className="text-center mt-8">
                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Découvrez Medi.Link en action
                    </h3>
                </div>
            </div>
        </section>
    )
}
