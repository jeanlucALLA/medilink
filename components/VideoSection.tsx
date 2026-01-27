'use client'

import { useState, useRef } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react'

export default function VideoSection() {
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(true)
    const [showControls, setShowControls] = useState(true)
    const videoRef = useRef<HTMLVideoElement>(null)

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause()
            } else {
                videoRef.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted
            setIsMuted(!isMuted)
        }
    }

    const handleFullscreen = () => {
        if (videoRef.current) {
            if (videoRef.current.requestFullscreen) {
                videoRef.current.requestFullscreen()
            }
        }
    }

    return (
        <section className="py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div
                    className="w-full max-w-4xl mx-auto rounded-[32px] overflow-hidden shadow-2xl border-4 border-white/50 ring-1 ring-gray-200 bg-gray-900 group relative"
                    onMouseEnter={() => setShowControls(true)}
                    onMouseLeave={() => setShowControls(isPlaying ? false : true)}
                >
                    <div className="relative pb-[56.25%] h-0">
                        <video
                            ref={videoRef}
                            className="absolute top-0 left-0 w-full h-full rounded-[28px] object-cover"
                            src="/presentation-toplinksante.mp4"
                            muted={isMuted}
                            playsInline
                            preload="metadata"
                            poster=""
                            onEnded={() => setIsPlaying(false)}
                        />

                        {/* Overlay with play button when paused */}
                        <div
                            className={`absolute inset-0 bg-black/30 flex items-center justify-center rounded-[28px] transition-opacity duration-300 cursor-pointer ${isPlaying && !showControls ? 'opacity-0' : 'opacity-100'}`}
                            onClick={togglePlay}
                        >
                            {!isPlaying && (
                                <div className="w-20 h-20 bg-gradient-to-br from-[#7C3AED] to-[#2563EB] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                    <Play className="w-10 h-10 text-white ml-1" fill="white" />
                                </div>
                            )}
                        </div>

                        {/* Controls bar */}
                        <div
                            className={`absolute bottom-4 left-4 right-4 flex items-center justify-between transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <div className="flex items-center gap-2">
                                {/* Play/Pause button */}
                                <button
                                    onClick={togglePlay}
                                    className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                                    aria-label={isPlaying ? "Pause" : "Play"}
                                >
                                    {isPlaying ? (
                                        <Pause className="w-5 h-5 text-white" />
                                    ) : (
                                        <Play className="w-5 h-5 text-white ml-0.5" />
                                    )}
                                </button>

                                {/* Mute button */}
                                <button
                                    onClick={toggleMute}
                                    className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                                    aria-label={isMuted ? "Activer le son" : "Couper le son"}
                                >
                                    {isMuted ? (
                                        <VolumeX className="w-5 h-5 text-white" />
                                    ) : (
                                        <Volume2 className="w-5 h-5 text-white" />
                                    )}
                                </button>
                            </div>

                            {/* Fullscreen button */}
                            <button
                                onClick={handleFullscreen}
                                className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                                aria-label="Plein écran"
                            >
                                <Maximize className="w-5 h-5 text-white" />
                            </button>
                        </div>
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
