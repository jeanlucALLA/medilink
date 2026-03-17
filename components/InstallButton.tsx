'use client'

import { useState, useEffect } from 'react'
import { Download, Check, Monitor } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    // Check if already installed
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

  // Already installed
  if (isInstalled) {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
        <Check className="w-4 h-4" />
        <span>Application installée</span>
      </div>
    )
  }

  // No install prompt available (browser doesn't support or criteria not met)
  if (!deferredPrompt) return null

  return (
    <button
      onClick={handleInstall}
      disabled={isInstalling}
      className="group relative flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden
        bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500
        text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40
        disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <Monitor className="w-5 h-5 relative z-10" />
      <div className="relative z-10 text-left">
        <div className="font-semibold">
          {isInstalling ? 'Installation...' : 'Installer sur le bureau'}
        </div>
        <div className="text-xs text-blue-200/80">
          Accès rapide comme un logiciel
        </div>
      </div>
      <Download className={`w-4 h-4 relative z-10 ${isInstalling ? 'animate-bounce' : 'group-hover:translate-y-0.5 transition-transform'}`} />
    </button>
  )
}
