'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Check, Loader2, PartyPopper } from 'lucide-react'

interface ProfileData {
  nom_complet: string
  specialite: string
  identifiant_pro: string
  cabinet: string
}

export default function WelcomePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profileData, setProfileData] = useState<ProfileData>({
    nom_complet: '',
    specialite: '',
    identifiant_pro: '',
    cabinet: '',
  })
  const router = useRouter()

  // Vérifier si le profil est déjà rempli et charger les données
  useEffect(() => {
    const checkProfile = async () => {
      try {
        setLoading(true)
        const { supabase } = await import('@/lib/supabase') as any
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !authUser) {
          router.push('/login')
          return
        }

        setUser(authUser)

        // Vérifier si le profil existe et est déjà rempli
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('nom_complet, specialite, identifiant_pro, cabinet')
          .eq('id', authUser.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Erreur lors de la récupération du profil:', profileError)
        }

        // Si le profil existe et est rempli (nom et spécialité), rediriger
        if (profile && profile.nom_complet && profile.specialite) {
          router.push('/dashboard')
          return
        }

        // Si le profil existe partiellement, pré-remplir le formulaire
        if (profile) {
          setProfileData({
            nom_complet: profile.nom_complet || '',
            specialite: profile.specialite || '',
            identifiant_pro: profile.identifiant_pro || '',
            cabinet: profile.cabinet || '',
          })
        }

      } catch (err) {
        console.error('Erreur lors de la vérification du profil:', err)
        setError('Une erreur est survenue')
      } finally {
        setLoading(false)
      }
    }

    checkProfile()
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setProfileData(prev => ({
      ...prev,
      [name]: value,
    }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return

    // Validation
    if (!profileData.nom_complet.trim()) {
      setError('Le nom complet est requis')
      return
    }

    if (!profileData.identifiant_pro.trim()) {
      setError('L\'identifiant professionnel est requis')
      return
    }

    if (!profileData.specialite.trim()) {
      setError('La spécialité est requise')
      return
    }

    if (!profileData.cabinet.trim()) {
      setError('Le nom du lieu d\'exercice est requis')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const { supabase } = await import('@/lib/supabase') as any

      // Mettre à jour le profil avec les colonnes exactes de la base de données
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          nom_complet: profileData.nom_complet.trim(),
          identifiant_pro: profileData.identifiant_pro.trim(),
          specialite: profileData.specialite.trim(),
          cabinet: profileData.cabinet.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Erreur lors de la sauvegarde du profil:', updateError)
        console.error('Détails de l\'erreur:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        })
        setError(`Erreur lors de la sauvegarde: ${updateError.message || 'Erreur inconnue'}. Code: ${updateError.code || 'N/A'}`)
        setSaving(false)
        return
      }

      // Afficher le message de succès
      setSuccess(true)

      // Rediriger vers le dashboard après 1.5 secondes
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)

    } catch (err: any) {
      console.error('Erreur lors de la sauvegarde:', err)
      setError(`Erreur inattendue: ${err.message || 'Erreur inconnue'}`)
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Carte principale */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 md:p-12">
          {/* En-tête avec illustration */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Bienvenue sur Medi.Link !
            </h1>
            <p className="text-lg text-gray-600">
              Configurons votre espace professionnel pour commencer.
            </p>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Message de succès */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center space-x-2">
              <Check className="w-5 h-5 flex-shrink-0" />
              <span>Profil finalisé avec succès ! Redirection en cours...</span>
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom complet */}
            <div>
              <label htmlFor="nom_complet" className="block text-sm font-medium text-gray-700 mb-2">
                Nom complet
              </label>
              <input
                id="nom_complet"
                name="nom_complet"
                type="text"
                value={profileData.nom_complet}
                onChange={handleInputChange}
                required
                disabled={saving || success}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Ex: Jean Dupont"
              />
            </div>

            {/* Identifiant professionnel */}
            <div>
              <label htmlFor="identifiant_pro" className="block text-sm font-medium text-gray-700 mb-2">
                Identifiant professionnel (RPPS, ADELI ou n° de carte pro)
              </label>
              <input
                id="identifiant_pro"
                name="identifiant_pro"
                type="text"
                value={profileData.identifiant_pro}
                onChange={handleInputChange}
                required
                disabled={saving || success}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Ex: 00000000000"
              />
            </div>

            {/* Spécialité */}
            <div>
              <label htmlFor="specialite" className="block text-sm font-medium text-gray-700 mb-2">
                Spécialité
              </label>
              <input
                id="specialite"
                name="specialite"
                type="text"
                value={profileData.specialite}
                onChange={handleInputChange}
                required
                disabled={saving || success}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Ex: Masseur-Kinésithérapeute, Ostéopathe..."
              />
            </div>

            {/* Nom du lieu d'exercice */}
            <div>
              <label htmlFor="cabinet" className="block text-sm font-medium text-gray-700 mb-2">
                Nom du lieu d&apos;exercice
              </label>
              <input
                id="cabinet"
                name="cabinet"
                type="text"
                value={profileData.cabinet}
                onChange={handleInputChange}
                required
                disabled={saving || success}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Ex: Cabinet de rééducation"
              />
            </div>

            {/* Bouton de soumission */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={saving || success}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Finalisation en cours...</span>
                  </>
                ) : success ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Profil finalisé !</span>
                  </>
                ) : (
                  <>
                    <span>Finaliser mon profil</span>
                    <Check className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

