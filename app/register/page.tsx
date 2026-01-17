'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { UserPlus, Mail, Lock, User, Briefcase, Building2, GraduationCap, ArrowLeft, MapPin, Gift } from 'lucide-react'
import Link from 'next/link'
import { STRIPE_PRICE_IDS } from '@/lib/constants'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    nomComplet: '',
    email: '',
    password: '',
    specialite: '',
    rpps: '',
    cabinet: '',
    adresseCabinet: '',
    zip_code: '', // Ajout du champ Code Postal
    referralCode: '', // Code de parrainage
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [isProPlan, setIsProPlan] = useState(false) // Détection si inscription pour Pro direct
  const router = useRouter()

  // Détecter le code de parrainage et le plan dans l'URL au chargement
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Récupérer les paramètres de l'URL
      const urlParams = new URLSearchParams(window.location.search)
      const refParam = urlParams.get('ref')
      const planParam = urlParams.get('plan')

      // Détecter si c'est une inscription Pro directe
      if (planParam === 'pro') {
        setIsProPlan(true)
        console.log('[Register] Mode Pro détecté - redirection Stripe après inscription')
      }

      if (refParam) {
        // Stocker le code dans localStorage pour ne pas le perdre
        localStorage.setItem('medi_link_referral_code', refParam)
        setReferralCode(refParam)
        setFormData(prev => ({ ...prev, referralCode: refParam }))
      } else {
        // Vérifier si un code existe déjà dans localStorage
        const storedCode = localStorage.getItem('medi_link_referral_code')
        if (storedCode) {
          setReferralCode(storedCode)
          setFormData(prev => ({ ...prev, referralCode: storedCode }))
        }
      }
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const fieldName = e.target.name === 'adresse_cabinet' ? 'adresseCabinet' : e.target.name
    setFormData({
      ...formData,
      [fieldName]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Vérification des variables d'environnement
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      alert('Clés Supabase manquantes dans .env.local')
      setError('Configuration Supabase manquante. Vérifiez votre fichier .env.local')
      setLoading(false)
      return
    }

    try {

      // Créer l'utilisateur avec Supabase Auth
      let authData, authError
      try {
        const origin = window.location.origin
        const result = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${origin}/auth/callback`,
            data: {
              full_name: formData.nomComplet,
              speciality: formData.specialite || null,
              city: formData.zip_code || null, // Code postal utilisé comme ville
              role: 'practitioner',
              referral_code: formData.referralCode || null // Passer le code au Trigger SQL (null si vide)
            }
          }
        })
        authData = result.data
        authError = result.error
      } catch (signUpError) {
        console.error("Erreur lors de l'appel signUp:", signUpError)
        throw signUpError
      }

      if (authError) {
        console.error("Erreur Supabase Auth:", authError)
        throw authError
      }

      if (authData.user) {
        // Calculer la date de fin d'essai (5 jours à partir de maintenant)
        const trialStartedAt = new Date().toISOString()
        const trialEndsAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()

        // ACTION 1 : Mise à jour du profil avec les infos + activation du trial
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.nomComplet,
            speciality: formData.specialite || null,
            city: formData.zip_code || null,
            subscription_tier: 'trial',
            trial_started_at: trialStartedAt,
            trial_ends_at: trialEndsAt,
          })
          .eq('id', authData.user.id)

        if (profileError) {
          console.error('Erreur lors de la mise à jour du profil:', profileError)
        } else {
          console.log('✅ Profil mis à jour avec trial jusqu\'au:', trialEndsAt)
        }

        // Gérer le parrainage si un code de référence existe
        const codeToUse = formData.referralCode?.trim() || referralCode?.trim() || localStorage.getItem('medi_link_referral_code')?.trim()
        console.log('[Register] Code de parrainage à utiliser:', codeToUse)
        if (codeToUse) {
          try {
            // Récupérer l'ID du parrain depuis le code de référence
            // Le code peut être soit l'ID utilisateur, soit le referral_code
            let referrerId: string | null = null

            // D'abord, essayer de trouver par ID utilisateur
            const { data: referrerById, error: errorById } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', codeToUse)
              .single()

            if (!errorById && referrerById) {
              referrerId = referrerById.id
              console.log('[Register] Parrain trouvé par ID:', referrerId)
            } else {
              // Si pas trouvé par ID, essayer par referral_code
              const { data: referrerByCode, error: errorByCode } = await supabase
                .from('profiles')
                .select('id')
                .eq('referral_code', codeToUse)
                .single()

              if (!errorByCode && referrerByCode) {
                referrerId = referrerByCode.id
                console.log('[Register] Parrain trouvé par referral_code:', referrerId)
              } else {
                console.log('[Register] Aucun parrain trouvé pour le code:', codeToUse)
              }
            }

            if (referrerId) {
              // Vérifier que l'utilisateur ne se parraine pas lui-même
              if (referrerId === authData.user.id) {
                console.warn('[Register] Un utilisateur ne peut pas se parrainer lui-même')
                localStorage.removeItem('medi_link_referral_code')
              } else {
                // Créer l'entrée dans la table referrals
                const { error: referralError } = await supabase
                  .from('referrals')
                  .insert([
                    {
                      referrer_id: referrerId, // ID du parrain
                      referred_id: authData.user.id, // ID du nouveau utilisateur
                    },
                  ])

                if (referralError) {
                  console.error('[Register] Erreur lors de la création du parrainage:', referralError)
                  // On continue quand même, l'inscription est réussie
                } else {
                  // Parrainage créé avec succès
                  setSuccess(true) // Déclencher l'affichage du succès
                  alert('Code de parrainage appliqué !') // Feedback explicite demandé

                  // Envoyer l'email de notification au parrain (non bloquant)
                  fetch('/api/send-referral-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ referrerId: referrerId }),
                  }).catch(err => console.error('Erreur envoi email parrainage:', err))
                }
                // Nettoyer le code de localStorage après utilisation (succès ou échec)
                localStorage.removeItem('medi_link_referral_code')
              }
            } else {
              console.warn('[Register] Code de parrainage invalide, continuation sans parrainage')
              // Code invalide, on continue sans créer de parrainage
              localStorage.removeItem('medi_link_referral_code')
            }
          } catch (referralErr: any) {
            console.error('[Register] Erreur lors du traitement du parrainage:', referralErr)
            // On continue quand même, l'inscription est réussie
            localStorage.removeItem('medi_link_referral_code')
          }
        }

        // Afficher le message de succès
        setSuccess(true)

        // ✅ PROFILE POLLING : Attendre que le profil soit créé avant de rediriger
        const waitForProfile = async (userId: string, maxAttempts = 10): Promise<boolean> => {
          for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const { data } = await supabase
              .from('profiles')
              .select('id, full_name')
              .eq('id', userId)
              .single()

            if (data && data.full_name) {
              // Profil trouvé
              return true
            }

            // Attendre 500ms avant la prochaine tentative
            await new Promise(resolve => setTimeout(resolve, 500))
          }
          console.warn('[Register] Profil non trouvé après le polling, redirection quand même')
          return false
        }

        // Gérer la redirection après inscription
        if (authData.session) {
          // Attendre que le profil soit prêt avant de continuer
          await waitForProfile(authData.user.id)

          // Si c'est une inscription Pro, rediriger vers Stripe
          if (isProPlan) {
            console.log('[Register] Redirection vers Stripe pour abonnement Pro...')
            try {
              const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  priceId: STRIPE_PRICE_IDS.pro,
                  tier: 'pro',
                  userId: authData.user.id
                }),
              })

              if (!response.ok) {
                throw new Error('Erreur API Stripe')
              }

              const { url } = await response.json()
              if (url) {
                window.location.href = url
              } else {
                console.error('Erreur: Pas d\'URL de checkout')
                router.replace('/dashboard')
              }
            } catch (stripeErr) {
              console.error('Erreur Stripe:', stripeErr)
              // Fallback vers dashboard en cas d'erreur
              router.replace('/dashboard')
            }
          } else {
            // ✅ TRIAL SYSTEM: Rediriger vers le dashboard avec essai gratuit
            router.replace('/dashboard')
          }
        } else {
          // Pas de session (Confirmation email requise)
          alert("Inscription réussie ! Veuillez consulter vos emails pour confirmer votre compte.")
        }
      }
    } catch (err: any) {
      console.error("Erreur complète dans handleSubmit:", err)
      console.error("Type d'erreur:", typeof err)
      console.error("Message:", err?.message)
      console.error("Stack:", err?.stack)
      setError(err?.message || err?.toString() || 'Une erreur est survenue lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Inscription Professionnel</h1>
          <p className="text-gray-600 mt-2">Créez votre compte TopLinkSante</p>
          {referralCode && (
            <div className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
              <Gift className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                Code de parrainage détecté - Vous bénéficierez d&apos;un mois offert !
              </span>
            </div>
          )}
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
            Inscription réussie ! Redirection vers le tableau de bord...
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nom complet */}
            <div>
              <label htmlFor="nomComplet" className="block text-sm font-medium text-gray-700 mb-2">
                Nom complet
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="nomComplet"
                  name="nomComplet"
                  type="text"
                  value={formData.nomComplet}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Dr. Jean Dupont"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="votre@email.com"
                />
              </div>
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">Minimum 6 caractères</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Spécialité */}
            <div>
              <label htmlFor="specialite" className="block text-sm font-medium text-gray-700 mb-2">
                Spécialité (Optionnel)
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="specialite"
                  name="specialite"
                  type="text"
                  value={formData.specialite}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Ex: Podologue, Cardiologue..."
                />
              </div>
            </div>

            {/* Numéro RPPS */}
            <div>
              <label htmlFor="rpps" className="block text-sm font-medium text-gray-700 mb-2">
                Numéro RPPS (Optionnel)
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="rpps"
                  name="rpps"
                  type="text"
                  value={formData.rpps}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="00000000000"
                />
              </div>
            </div>
          </div>

          {/* Nom du cabinet */}
          <div>
            <label htmlFor="cabinet" className="block text-sm font-medium text-gray-700 mb-2">
              Nom du cabinet/établissement
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="cabinet"
                name="cabinet"
                type="text"
                value={formData.cabinet}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Cabinet Médical..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Adresse du cabinet</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  name="adresse_cabinet"
                  type="text"
                  value={formData.adresseCabinet}
                  onChange={handleChange}
                  placeholder="Numéro, rue, ville..."
                  required
                  className="w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Code postal du cabinet</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  name="zip_code"
                  type="text"
                  value={formData.zip_code || ''}
                  onChange={handleChange}
                  placeholder="75000"
                  required
                  className="w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
          <div className="space-y-2 pt-4 border-t border-gray-200">
            <label className="text-sm font-medium text-gray-700 block">Code de parrainage (Optionnel)</label>
            <div className="relative">
              <Gift className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                name="referralCode"
                type="text"
                value={formData.referralCode || ''}
                onChange={handleChange}
                placeholder="Code parrain"
                className="w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 border-gray-200"
              />
            </div>
            <p className="text-xs text-gray-500">Saisissez un code pour bénéficier d&apos;un mois offert.</p>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Inscription en cours...' : success ? 'Inscription réussie !' : 'S\'inscrire'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center space-x-2 text-primary hover:text-primary-dark font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Vous avez déjà un compte ? Connectez-vous</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

