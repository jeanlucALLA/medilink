'use client'

import { useState, useEffect } from 'react'
import { Download, Monitor, X, Sparkles } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsReady(true)

    // Check if dismissed in localStorage
    const dismissed = localStorage.getItem('pwa-banner-dismissed')
    if (dismissed) {
      setIsDismissed(true)
      return
    }

    // Check if already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    const installedHandler = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    setIsInstalling(true)
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstalled(true)
    }
    setDeferredPrompt(null)
    setIsInstalling(false)
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem('pwa-banner-dismissed', 'true')
  }

  // Wait for client hydration
  if (!isReady) return null

  // Don't show if already installed as standalone or dismissed
  if (isInstalled || isDismissed) return null

  return (
    <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-5 text-white overflow-hidden shadow-lg shadow-blue-500/15">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-white/5 rounded-full translate-y-1/2" />

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors z-10"
        title="Masquer"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
          <Monitor className="w-7 h-7" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <h3 className="text-base font-bold">
              Installez TopLinkSanté sur votre ordinateur
            </h3>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">
            Accédez à votre tableau de bord en un clic depuis votre bureau, comme un logiciel — sans ouvrir le navigateur.
            Fonctionne sur <strong className="text-white">Windows, Mac et Linux</strong>.
          </p>
        </div>

        {/* CTA Button - either install directly or show instructions */}
        {deferredPrompt ? (
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="flex-shrink-0 group flex items-center gap-2.5 px-6 py-3 bg-white text-indigo-700 font-semibold rounded-xl
              hover:bg-indigo-50 transition-all duration-200 shadow-lg hover:shadow-xl
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className={`w-5 h-5 ${isInstalling ? 'animate-bounce' : 'group-hover:translate-y-0.5 transition-transform'}`} />
            {isInstalling ? 'Installation...' : 'Installer'}
          </button>
        ) : (
          <div className="flex-shrink-0 flex items-center gap-2 px-5 py-3 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20 text-sm">
            <Download className="w-4 h-4" />
            <span>Cliquez sur <strong>⊕</strong> dans la barre d&apos;adresse</span>
          </div>
        )}
      </div>
    </div>
  )
}
