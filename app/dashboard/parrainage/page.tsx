'use client'

import { useState, useEffect, useRef } from 'react'
import { Gift, Copy, Check, Mail, MessageCircle, Users, Clock, DollarSign, Share2, Sparkles, Lock, Crown, TrendingUp, Loader2 } from 'lucide-react'

export default function ParrainagePage() {
  const [referralLink, setReferralLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [referralsCount, setReferralsCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)
  const confettiTriggered = useRef(false)
  const [stats, setStats] = useState({
    referredCount: 0,
    pendingBonus: 0,
    totalEarned: 0
  })

  // Charger les données de parrainage depuis Supabase
  useEffect(() => {
    const loadReferralData = async () => {
      try {
        setLoading(true)
        const { supabase } = await import('@/lib/supabase') as any
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          console.error('[Parrainage] Erreur authentification:', authError)
          setLoading(false)
          return
        }

        setUserId(user.id)

        // Récupérer le referral_code depuis la table profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('referral_code')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('[Parrainage] Erreur récupération profil:', profileError)
          // Si pas de referral_code, utiliser l'ID utilisateur comme fallback
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://medi.link'
          setReferralLink(`${baseUrl}/register?ref=${user.id}`)
        } else {
          // Utiliser le referral_code s'il existe, sinon l'ID utilisateur
          const code = profile?.referral_code || user.id
          setReferralCode(code)

          // Générer le lien complet avec le referral_code
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://medi.link'
          const link = `${baseUrl}/register?ref=${code}`
          setReferralLink(link)
        }

        // Récupérer la session pour utiliser session.user.id
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !session) {
          console.error('[Parrainage] Erreur récupération session:', sessionError)
          setLoading(false)
          return
        }

        // Appeler la fonction RPC get_referral_count avec user_id
        const { data: referralCountData, error: rpcError } = await supabase
          .rpc('get_referral_count', { user_id: session.user.id })

        if (rpcError) {
          console.error('[Parrainage] Erreur RPC get_referral_count:', rpcError)
          // Si la fonction RPC n'existe pas encore, compter manuellement
          const { count, error: countError } = await supabase
            .from('referrals')
            .select('*', { count: 'exact', head: true })
            .eq('referrer_id', session.user.id)

          if (!countError && count !== null) {
            const countValue = count
            setReferralsCount(countValue)
            setStats(prev => ({ ...prev, referredCount: countValue }))

            // Déclencher l'animation de confettis si le score est de 3
            if (countValue === 3 && !confettiTriggered.current) {
              confettiTriggered.current = true
              setShowConfetti(true)
              setTimeout(() => setShowConfetti(false), 5000) // Disparaît après 5 secondes
            }
          }
        } else {
          // La fonction RPC retourne le nombre de parrainages
          const count = referralCountData || 0
          setReferralsCount(count)
          setStats(prev => ({ ...prev, referredCount: count }))

          // Déclencher l'animation de confettis si le score est de 3
          if (count === 3 && !confettiTriggered.current) {
            confettiTriggered.current = true
            setShowConfetti(true)
            setTimeout(() => setShowConfetti(false), 5000) // Disparaît après 5 secondes
          }
        }

        // Charger les autres statistiques (bonus en attente, total gagné)
        // TODO: Implémenter selon votre logique métier
        setStats(prev => ({
          ...prev,
          pendingBonus: 0, // À calculer selon votre logique
          totalEarned: 0 // À calculer selon votre logique
        }))

      } catch (err: any) {
        console.error('[Parrainage] Erreur chargement données:', err)
      } finally {
        setLoading(false)
      }
    }

    loadReferralData()
  }, [])

  // Copier le lien dans le presse-papiers avec animation
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('[Parrainage] Erreur copie:', err)
      alert('Impossible de copier le lien')
    }
  }

  // Partager via WhatsApp
  const handleShareWhatsApp = () => {
    const message = `Découvrez Medi.Link, la plateforme de suivi patient éphémère ! Inscrivez-vous avec mon lien et bénéficiez d'un mois offert : ${referralLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  // Partager via Email
  const handleShareEmail = () => {
    const subject = 'Rejoins-moi sur Medi.Link'
    const body = `Bonjour,\n\nJe vous invite à découvrir Medi.Link, une plateforme innovante pour le suivi patient avec confidentialité absolue.\n\nInscrivez-vous avec mon lien de parrainage et bénéficiez d'un mois offert :\n${referralLink}\n\nCordialement`
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  // Composant Confettis
  const Confetti = () => {
    if (!showConfetti) return null

    return (
      <>
        <style>{`
          @keyframes confetti-fall {
            0% {
              transform: translateY(0) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(720deg);
              opacity: 0;
            }
          }
        `}</style>
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(50)].map((_, i) => {
            const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
            const color = colors[Math.floor(Math.random() * colors.length)]
            const left = Math.random() * 100
            const delay = Math.random() * 2
            const duration = 3 + Math.random() * 2

            return (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  left: `${left}%`,
                  backgroundColor: color,
                  animation: `confetti-fall ${duration}s ease-out ${delay}s forwards`,
                  top: '-10px',
                }}
              />
            )
          })}
        </div>
      </>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <div className="text-lg font-medium text-gray-900 mb-1">Chargement...</div>
          <div className="text-sm text-gray-500">Récupération de vos données de parrainage</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 relative">
      {/* Animation de confettis */}
      <Confetti />
      {/* Section Hero */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-lg shadow-sm p-8 border border-blue-600 text-white">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Gift className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">Partagez Medi.Link et gagnez des bonus</h1>
            <p className="text-blue-100 text-lg mb-4">
              Parrainez vos collègues professionnels de santé et bénéficiez d&apos;avantages exclusifs !
            </p>
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <span className="font-semibold">Offre spéciale :</span>
              </div>
              <p className="text-blue-50">
                Pour chaque nouvel utilisateur inscrit avec votre lien, <strong>vous et votre filleul recevez 1 mois d&apos;abonnement offert</strong> sur Medi.Link.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Partage */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Share2 className="w-5 h-5 text-primary" />
          <span>Votre lien de parrainage unique</span>
        </h2>

        <div className="space-y-4">
          {/* Champ de texte avec bouton copier */}
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="w-full px-4 py-3 pr-14 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="Votre lien de parrainage..."
              />
              <button
                onClick={handleCopyLink}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md transition-all duration-200 ${copied
                  ? 'text-green-600 bg-green-50 scale-100'
                  : 'text-gray-500 hover:text-primary hover:bg-gray-100 active:scale-95'
                  }`}
                title={copied ? 'Lien copié !' : 'Copier le lien'}
              >
                {copied ? (
                  <Check className="w-5 h-5 transition-all duration-200 animate-pulse" />
                ) : (
                  <Copy className="w-5 h-5 transition-transform duration-200" />
                )}
              </button>
            </div>
            <button
              onClick={handleCopyLink}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${copied
                ? 'bg-green-100 text-green-700 border-2 border-green-300 scale-100'
                : 'bg-primary hover:bg-primary-dark text-white active:scale-95 hover:scale-105 shadow-sm hover:shadow-md'
                }`}
            >
              {copied ? (
                <span className="flex items-center space-x-2">
                  <Check className="w-4 h-4 transition-all duration-200" />
                  <span>Copié !</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <Copy className="w-4 h-4" />
                  <span>Copier</span>
                </span>
              )}
            </button>
          </div>

          {/* Toast de confirmation */}
          {copied && (
            <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg text-sm transition-all duration-300 animate-pulse flex items-center space-x-2 shadow-md">
              <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="font-medium">Lien copié dans le presse-papiers !</span>
            </div>
          )}

          {/* Boutons de partage rapide */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">Partager rapidement :</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleShareWhatsApp}
                className="group flex items-center space-x-2 px-4 py-2.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-all duration-200 border border-green-200 hover:border-green-300 active:scale-95 hover:scale-105 shadow-sm hover:shadow-md"
              >
                <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-medium">WhatsApp</span>
              </button>
              <button
                onClick={handleShareEmail}
                className="group flex items-center space-x-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all duration-200 border border-blue-200 hover:border-blue-300 active:scale-95 hover:scale-105 shadow-sm hover:shadow-md"
              >
                <Mail className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-medium">Email</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section Progression de Récompense */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 rounded-lg shadow-sm p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              {referralsCount >= 5 ? (
                <Crown className="w-6 h-6 text-yellow-500" />
              ) : (
                <Lock className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Progression de Récompense</h2>
              <p className="text-sm text-gray-600">Débloquez 1 mois d'abonnement supplémentaire</p>
            </div>
          </div>
          {referralsCount >= 5 && (
            <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 rounded-full border border-green-300">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">Débloqué</span>
            </div>
          )}
        </div>

        {/* Barre de progression */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            {/* Étape 1 */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center mb-2 transition-all ${referralsCount >= 1
                  ? 'bg-primary text-white shadow-md scale-110'
                  : 'bg-gray-200 text-gray-400'
                  }`}
              >
                {referralsCount >= 1 ? <Check className="w-4 h-4 md:w-5 md:h-5" /> : <span className="text-sm md:text-base font-bold">1</span>}
              </div>
            </div>

            {/* Ligne 1 */}
            <div className="flex-1 h-1 mx-1 -mt-6">
              <div className={`h-full rounded-full transition-all ${referralsCount >= 1 ? 'bg-primary' : 'bg-gray-200'}`} />
            </div>

            {/* Étape 2 */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center mb-2 transition-all ${referralsCount >= 2
                  ? 'bg-primary text-white shadow-md scale-110'
                  : 'bg-gray-200 text-gray-400'
                  }`}
              >
                {referralsCount >= 2 ? <Check className="w-4 h-4 md:w-5 md:h-5" /> : <span className="text-sm md:text-base font-bold">2</span>}
              </div>
            </div>

            {/* Ligne 2 */}
            <div className="flex-1 h-1 mx-1 -mt-6">
              <div className={`h-full rounded-full transition-all ${referralsCount >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
            </div>

            {/* Étape 3 */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center mb-2 transition-all ${referralsCount >= 3
                  ? 'bg-primary text-white shadow-md scale-110'
                  : 'bg-gray-200 text-gray-400'
                  }`}
              >
                {referralsCount >= 3 ? <Check className="w-4 h-4 md:w-5 md:h-5" /> : <span className="text-sm md:text-base font-bold">3</span>}
              </div>
            </div>

            {/* Ligne 3 */}
            <div className="flex-1 h-1 mx-1 -mt-6">
              <div className={`h-full rounded-full transition-all ${referralsCount >= 3 ? 'bg-primary' : 'bg-gray-200'}`} />
            </div>

            {/* Étape 4 */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center mb-2 transition-all ${referralsCount >= 4
                  ? 'bg-primary text-white shadow-md scale-110'
                  : 'bg-gray-200 text-gray-400'
                  }`}
              >
                {referralsCount >= 4 ? <Check className="w-4 h-4 md:w-5 md:h-5" /> : <span className="text-sm md:text-base font-bold">4</span>}
              </div>
            </div>

            {/* Ligne 4 */}
            <div className="flex-1 h-1 mx-1 -mt-6">
              <div className={`h-full rounded-full transition-all ${referralsCount >= 4 ? 'bg-primary' : 'bg-gray-200'}`} />
            </div>

            {/* Étape 5 */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-2 transition-all ${referralsCount >= 5
                  ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg scale-110'
                  : 'bg-gray-200 text-gray-400'
                  }`}
              >
                {referralsCount >= 5 ? <Crown className="w-5 h-5 md:w-6 md:h-6" /> : <span className="text-base md:text-lg font-bold">5</span>}
              </div>
            </div>
          </div>

          {/* Barre de progression globale */}
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary-dark rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min((referralsCount / 5) * 100, 100)}%` }}
            />
          </div>

          <div className="mt-2 text-center">
            <span className="text-sm font-medium text-gray-600">{referralsCount} / 5 parrainages</span>
          </div>
        </div>

        {/* Message incitatif dynamique */}
        <div
          className={`rounded-lg p-4 border-2 ${referralsCount >= 5
            ? 'bg-green-50 border-green-200'
            : 'bg-blue-50 border-blue-200'
            }`}
        >
          <div className="flex items-start space-x-3">
            {referralsCount >= 5 ? (
              <Crown className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            ) : (
              <TrendingUp className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p
                className={`font-medium ${referralsCount >= 5 ? 'text-green-800' : 'text-blue-800'
                  }`}
              >
                {referralsCount === 0 && (
                  <>Plus que <strong>5 parrainages</strong> pour obtenir 1 mois offert !</>
                )}
                {referralsCount > 0 && referralsCount < 5 && (
                  <>Encore <strong>{5 - referralsCount} parrainage{5 - referralsCount > 1 ? 's' : ''}</strong> pour obtenir 1 mois offert !</>
                )}
                {referralsCount >= 5 && (
                  <>Félicitations ! Vous avez débloqué <strong>1 mois d'abonnement offert</strong>.</>
                )}
              </p>
              {referralsCount >= 5 && (
                <p className="text-sm text-green-700 mt-1">
                  Ce mois gratuit sera automatiquement ajouté à votre abonnement.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Récompense débloquée - Détails */}
        {referralsCount >= 5 && (
          <div className="mt-4 pt-4 border-t border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-sm font-semibold text-gray-900">Bonus débloqué :</span>
            </div>
            <ul className="space-y-1 text-sm text-gray-700 ml-7">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                <span>Mois d'abonnement Pro offert (Valeur 9,99€)</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                <span>Cumulable avec vos autres réductions</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                <span>Merci de faire grandir la communauté Medi.Link !</span>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Section Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Carte 1: Collègues parrainés */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Collègues parrainés</h3>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="mb-2">
            <p className="text-3xl font-bold text-gray-900">{stats.referredCount}</p>
          </div>
          <p className="text-xs text-gray-500">Professionnels inscrits via votre lien</p>
        </div>

        {/* Carte 2: Bonus en attente */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Bonus en attente</h3>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="mb-2">
            <p className="text-3xl font-bold text-gray-900">{stats.pendingBonus}</p>
          </div>
          <p className="text-xs text-gray-500">Mois offerts en attente de validation</p>
        </div>

        {/* Carte 3: Total gagné */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Total gagné</h3>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="mb-2">
            <p className="text-3xl font-bold text-gray-900">{stats.totalEarned}€</p>
          </div>
          <p className="text-xs text-gray-500">Valeur totale des bonus reçus</p>
        </div>
      </div>

      {/* Section Informations complémentaires */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
          <Gift className="w-5 h-5 text-primary" />
          <span>Comment ça marche ?</span>
        </h3>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">1</span>
            </div>
            <p>
              <strong>Partagez votre lien unique</strong> avec vos collègues professionnels de santé
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">2</span>
            </div>
            <p>
              <strong>Votre collègue s&apos;inscrit</strong> en utilisant votre lien de parrainage
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">3</span>
            </div>
            <p>
              <strong>Vous recevez tous les deux 1 mois offert</strong> dès que votre filleul confirme son inscription
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
