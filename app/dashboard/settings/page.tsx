'use client'

import { useState, useEffect } from 'react'
import { User, Building2, CreditCard, Save, Loader2, CheckCircle, Shield, Lock, Mail, Send, MapPin, Map, AlertTriangle } from 'lucide-react'
import { geocodePostalCode, extractDepartmentCode } from '@/lib/geocoding'

// Fonction pour extraire les initiales du nom complet (réutilisée depuis SidebarSafe)
function getInitials(nomComplet: string | null | undefined): string {
  if (!nomComplet || nomComplet.trim() === '') {
    return 'U' // User par défaut
  }

  // Séparer le nom en mots
  const mots = nomComplet.trim().split(/\s+/)

  if (mots.length === 0) {
    return 'U'
  }

  if (mots.length === 1) {
    // Si un seul mot, prendre les 2 premières lettres
    return mots[0].substring(0, 2).toUpperCase()
  }

  // Prendre la première lettre du premier mot et la première lettre du dernier mot
  const premiereLettre = mots[0].charAt(0).toUpperCase()
  const derniereLettre = mots[mots.length - 1].charAt(0).toUpperCase()

  return premiereLettre + derniereLettre
}

export default function SettingsPage() {
  const [nomComplet, setNomComplet] = useState('')
  const [cabinet, setCabinet] = useState('')
  const [adresseCabinet, setAdresseCabinet] = useState('')
  const [codePostal, setCodePostal] = useState('')
  const [city, setCity] = useState('')
  const [departmentCode, setDepartmentCode] = useState('')
  const [googleReviewUrl, setGoogleReviewUrl] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<'Gratuit' | 'Premium'>('Gratuit')

  // États pour la section Sécurité
  const [newPassword, setNewPassword] = useState('')
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // États pour la section Test Email
  const [testEmail, setTestEmail] = useState('')
  const [sendingTestEmail, setSendingTestEmail] = useState(false)
  const [testEmailSuccess, setTestEmailSuccess] = useState(false)
  const [testEmailError, setTestEmailError] = useState<string | null>(null)
  const [showUnsubscribeModal, setShowUnsubscribeModal] = useState(false)

  // Charger les données du profil
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        const { supabase } = await import('@/lib/supabase') as any
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          setError('Erreur d\'authentification')
          setLoading(false)
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*, subscription_tier')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Erreur lors du chargement du profil:', profileError)
          setError('Erreur lors du chargement du profil')
          setLoading(false)
          return
        }

        if (profile) {
          setNomComplet(profile.nom_complet || '')
          setCabinet(profile.cabinet || '')
          setAdresseCabinet(profile.adresse_cabinet || '')
          const postalCode = profile.zip_code || profile.code_postal || ''
          setCodePostal(postalCode)
          setCity(profile.city || '')
          setDepartmentCode(profile.department_code || '')
          setGoogleReviewUrl(profile.google_review_url || '')
          if (user.email) {
            setTestEmail(user.email)
          }

          // Mise à jour du statut d'abonnement réel
          const tier = profile.subscription_tier
          setSubscriptionStatus(tier === 'premium' ? 'Premium' : 'Gratuit')
        }

        setLoading(false)
      } catch (err: any) {
        console.error('Erreur lors du chargement:', err)
        setError('Erreur lors du chargement des données')
        setLoading(false)
      }
    }

    loadProfile()
  }, [])


  // Sauvegarder les modifications
  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setShowSuccess(false)

      const { supabase } = await import('@/lib/supabase') as any
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        console.error('[Settings] Erreur authentification:', authError)
        setError('Erreur d\'authentification')
        setSaving(false)
        return
      }

      // Préparer les données à sauvegarder
      const trimmedCodePostal = codePostal.trim()
      let finalCity = city.trim() || null
      let finalDepartmentCode = departmentCode.trim() || null

      // Si un code postal est fourni, essayer de géocoder pour remplir automatiquement city et department_code
      if (trimmedCodePostal) {
        // Validation du format du code postal (5 chiffres pour la France)
        if (!/^\d{5}$/.test(trimmedCodePostal)) {
          console.error('[Settings] Code postal invalide:', trimmedCodePostal)
          setError('Le code postal doit contenir exactement 5 chiffres')
          setSaving(false)
          return
        }

        // Géocoder le code postal si city ou department_code ne sont pas remplis
        if (!finalCity || !finalDepartmentCode) {
          console.log('[Settings] Géocodage du code postal:', trimmedCodePostal)
          setGeocoding(true)

          try {
            const geocodingResult = await geocodePostalCode(trimmedCodePostal)

            if (geocodingResult) {
              console.log('[Settings] Géocodage réussi:', geocodingResult)
              finalCity = geocodingResult.city || finalCity
              finalDepartmentCode = geocodingResult.departmentCode || finalDepartmentCode

              // Mettre à jour les états pour afficher les valeurs dans l'UI
              if (geocodingResult.city) {
                setCity(geocodingResult.city)
              }
              if (geocodingResult.departmentCode) {
                setDepartmentCode(geocodingResult.departmentCode)
              }
            } else {
              console.warn('[Settings] Géocodage échoué, utilisation des valeurs existantes ou extraction du département')
              // Fallback : extraire le département depuis le code postal
              if (!finalDepartmentCode) {
                const extractedDept = extractDepartmentCode(trimmedCodePostal)
                if (extractedDept) {
                  finalDepartmentCode = extractedDept
                  setDepartmentCode(extractedDept)
                }
              }
            }
          } catch (geocodingErr: any) {
            console.error('[Settings] Erreur lors du géocodage:', geocodingErr)
            // Ne pas bloquer la sauvegarde si le géocodage échoue
            // Utiliser l'extraction simple du département
            if (!finalDepartmentCode) {
              const extractedDept = extractDepartmentCode(trimmedCodePostal)
              if (extractedDept) {
                finalDepartmentCode = extractedDept
                setDepartmentCode(extractedDept)
              }
            }
          } finally {
            setGeocoding(false)
          }
        }
      }

      // Préparer les données pour Supabase
      const updateData: any = {
        nom_complet: nomComplet.trim() || null,
        cabinet: cabinet.trim() || null,
        adresse_cabinet: adresseCabinet.trim() || null,
        code_postal: trimmedCodePostal || null, // Rétrocompatibilité
        zip_code: trimmedCodePostal || null,
        city: finalCity,
        department_code: finalDepartmentCode,
        google_review_url: googleReviewUrl.trim() || null,
        updated_at: new Date().toISOString(),
      }

      console.log('[Settings] Données à sauvegarder:', {
        userId: user.id,
        updateData,
        codePostal: trimmedCodePostal,
        city: finalCity,
        departmentCode: finalDepartmentCode,
      })

      // Vérifier si le profil existe déjà
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        // Erreur autre que "non trouvé"
        console.error('[Settings] Erreur lors de la vérification du profil:', checkError)
        setError(`Erreur lors de la vérification: ${checkError.message || checkError.code || 'Erreur inconnue'}`)
        setSaving(false)
        return
      }

      let result
      if (existingProfile) {
        // Mise à jour du profil existant
        console.log('[Settings] Mise à jour du profil existant')
        result = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', user.id)
      } else {
        // Création d'un nouveau profil
        console.log('[Settings] Création d\'un nouveau profil')
        result = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            ...updateData,
          })
      }

      if (result.error) {
        console.error('[Settings] Erreur Supabase détaillée:', {
          message: result.error.message,
          code: result.error.code,
          details: result.error.details,
          hint: result.error.hint,
          error: result.error,
        })
        setError(`Erreur lors de la sauvegarde: ${result.error.message || result.error.code || 'Erreur inconnue'}`)
        setSaving(false)
        return
      }

      console.log('[Settings] Sauvegarde réussie:', result.data)

      // Afficher le message de succès
      setShowSuccess(true)

      // Le message disparaîtra automatiquement après 3 secondes
      setTimeout(() => {
        setShowSuccess(false)
      }, 3000)

      setSaving(false)
    } catch (err: any) {
      console.error('[Settings] Erreur exception lors de la sauvegarde:', {
        message: err?.message,
        stack: err?.stack,
        error: err,
      })
      setError(`Erreur lors de la sauvegarde: ${err?.message || 'Erreur inconnue'}`)
      setSaving(false)
    }
  }

  // Mettre à jour le mot de passe
  const handleUpdatePassword = async () => {
    try {
      setUpdatingPassword(true)
      setPasswordError(null)
      setPasswordSuccess(false)

      // Vérification : le mot de passe doit faire au moins 6 caractères
      if (newPassword.length < 6) {
        setPasswordError('Le mot de passe doit contenir au moins 6 caractères')
        setUpdatingPassword(false)
        return
      }

      const { supabase } = await import('@/lib/supabase') as any
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        console.error('Erreur lors de la mise à jour du mot de passe:', updateError)
        setPasswordError('Erreur lors de la mise à jour du mot de passe')
        setUpdatingPassword(false)
        return
      }

      // Afficher le message de succès
      setPasswordSuccess(true)
      setNewPassword('') // Réinitialiser le champ

      // Le message disparaîtra automatiquement après 3 secondes
      setTimeout(() => {
        setPasswordSuccess(false)
      }, 3000)

      setUpdatingPassword(false)
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du mot de passe:', err)
      setPasswordError('Erreur lors de la mise à jour du mot de passe')
      setUpdatingPassword(false)
    }
  }

  // Gérer l'abonnement (à implémenter avec Stripe)
  const [managingSubscription, setManagingSubscription] = useState(false)

  const handleManageSubscription = async () => {
    try {
      setManagingSubscription(true)
      // Récupérer la session courante pour le token
      const { supabase } = await import('@/lib/supabase') as any
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error("Authentification requise")
      }

      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          // User has no subscription/customer ID yet
          window.location.href = '/abonnement'
          return
        }
        throw new Error(data.error || 'Erreur lors de la création de la session')
      }

      // Rediriger vers le portail Stripe
      window.location.href = data.url

    } catch (error) {
      console.error('Erreur gestion abonnement:', error)
      alert("Impossible d'accéder au portail. Avez-vous déjà un abonnement actif ?")
    } finally {
      setManagingSubscription(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <div className="text-lg font-medium text-gray-900 mb-1">Chargement...</div>
          <div className="text-sm text-gray-500">Récupération de vos paramètres</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      {/* Bandeau de succès en haut de l'écran */}
      {showSuccess && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0 text-white" />
              <p className="font-medium text-white">Profil mis à jour avec succès !</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6" style={{ paddingTop: showSuccess ? '3.5rem' : '0' }}>
        {/* En-tête */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-600 mt-2">Gérez votre profil et vos préférences</p>
        </div>

        {/* Card Profil */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Profil</h2>
          </div>

          {/* Avatar avec initiales */}
          <div className="mb-6 flex items-center space-x-4">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-2xl">
                {getInitials(nomComplet)}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Votre avatar</p>
              <p className="text-sm text-gray-400">Basé sur vos initiales</p>
            </div>
          </div>

          {/* Formulaire */}
          <div className="space-y-4">
            <div>
              <label htmlFor="nomComplet" className="block text-sm font-medium text-gray-700 mb-2">
                Nom complet
              </label>
              <input
                id="nomComplet"
                type="text"
                value={nomComplet}
                onChange={(e) => setNomComplet(e.target.value)}
                placeholder="Ex: Jean-Luc Alla"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="cabinet" className="block text-sm font-medium text-gray-700 mb-2">
                Cabinet / Établissement
              </label>
              <input
                id="cabinet"
                type="text"
                value={cabinet}
                onChange={(e) => setCabinet(e.target.value)}
                placeholder="Ex: Cabinet de Podologie"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="adresseCabinet" className="block text-sm font-medium text-gray-700 mb-2">
                Adresse du cabinet
              </label>
              <input
                id="adresseCabinet"
                type="text"
                value={adresseCabinet}
                onChange={(e) => setAdresseCabinet(e.target.value)}
                placeholder="Ex: 12 Rue de la Paix"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="codePostal" className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Code Postal
              </label>
              <input
                id="codePostal"
                type="text"
                value={codePostal}
                onChange={(e) => setCodePostal(e.target.value)}
                placeholder="Ex: 75001"
                maxLength={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Nécessaire pour activer le benchmarking régional dans Analytics
              </p>
              {geocoding && (
                <p className="text-xs text-blue-600 mt-1 flex items-center space-x-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Géocodage en cours...</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="googleReviewUrl" className="block text-sm font-medium text-gray-700 mb-2">
                <Map className="w-4 h-4 inline mr-1" />
                Lien Google Reviews
              </label>
              <input
                id="googleReviewUrl"
                type="url"
                value={googleReviewUrl}
                onChange={(e) => setGoogleReviewUrl(e.target.value)}
                placeholder="Ex: https://g.page/r/CbO..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Lien de redirection pour les patients satisfaits (Note 5/5).
              </p>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Bouton de sauvegarde */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Enregistrer les modifications</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Card Test Email */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Test d&apos;Email de Suivi</h2>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Envoyez-vous un email de test pour valider le rendu visuel du template de suivi patient.
            </p>

            <div>
              <label htmlFor="testEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Adresse email de test
              </label>
              <input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="votre-email@exemple.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Messages d'erreur/succès */}
            {testEmailError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{testEmailError}</p>
              </div>
            )}

            {testEmailSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-800">
                    Email de test envoyé avec succès ! Vérifiez votre boîte de réception.
                  </p>
                </div>
              </div>
            )}

            {/* Bouton d'envoi */}
            <div className="flex justify-end pt-4">
              <button
                onClick={async () => {
                  if (!testEmail) {
                    setTestEmailError('Veuillez saisir une adresse email')
                    return
                  }

                  try {
                    setSendingTestEmail(true)
                    setTestEmailError(null)
                    setTestEmailSuccess(false)

                    // Générer un ID de questionnaire fictif pour le test
                    const testQuestionnaireId = `test-${Date.now()}`

                    // Récupérer la session pour le token
                    const { supabase } = await import('@/lib/supabase') as any
                    const { data: { session } } = await supabase.auth.getSession()
                    if (!session?.access_token) throw new Error("Authentification requise")

                    const response = await fetch('/api/send-followup-email', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                      },
                      body: JSON.stringify({
                        to: testEmail,
                        patientName: 'Patient Test',
                        cabinetName: cabinet || 'Cabinet Médical',
                        sessionDate: new Date().toISOString(),
                        questionnaireId: testQuestionnaireId,
                        // practitionerName est maintenant déduit côté serveur via le token
                      }),
                    })

                    const data = await response.json()

                    if (!response.ok) {
                      const errorMessage = data.details
                        ? `${data.error}: ${data.details}`
                        : (data.error || 'Erreur lors de l\'envoi de l\'email')
                      throw new Error(errorMessage)
                    }

                    setTestEmailSuccess(true)
                    setTimeout(() => setTestEmailSuccess(false), 5000)
                  } catch (err: any) {
                    console.error('Erreur envoi email test:', err)
                    setTestEmailError(err.message || 'Erreur lors de l\'envoi de l\'email de test')
                  } finally {
                    setSendingTestEmail(false)
                  }
                }}
                disabled={sendingTestEmail || !testEmail}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingTestEmail ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Envoyer un email de test</span>
                  </>
                )}
              </button>
            </div>


          </div>
        </div>

        {/* Card Sécurité et Accès */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Sécurité et Accès</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Saisissez votre nouveau mot de passe"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
                />
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Le mot de passe doit contenir au moins 6 caractères</p>
            </div>

            {/* Messages de succès/erreur pour le mot de passe */}
            {passwordSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-800">Votre mot de passe a été modifié</p>
              </div>
            )}

            {passwordError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{passwordError}</p>
              </div>
            )}

            {/* Bouton de mise à jour du mot de passe */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleUpdatePassword}
                disabled={updatingPassword || !newPassword.trim()}
                className="flex items-center space-x-2 px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updatingPassword ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Mise à jour...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Mettre à jour le mot de passe</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Card Abonnement */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Abonnement</h2>
          </div>

          <div className="space-y-4">
            {subscriptionStatus === 'Premium' ? (
              <>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-900">Abonnement Actif</p>
                      <p className="text-xs text-green-700">Premium</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-white text-green-700 rounded-full text-xs font-bold border border-green-200 shadow-sm">
                    Actif
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleManageSubscription}
                    disabled={managingSubscription}
                    className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors font-medium disabled:opacity-50"
                  >
                    {managingSubscription ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4" />
                    )}
                    <span>Gérer</span>
                  </button>

                  <button
                    onClick={() => setShowUnsubscribeModal(true)}
                    disabled={managingSubscription}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-colors font-medium disabled:opacity-50"
                  >
                    <span>Se désabonner</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4 py-2">
                <div className="p-4 bg-blue-50 text-blue-900 rounded-lg border border-blue-100 text-sm">
                  <p>Vous utilisez actuellement la version gratuite.</p>
                  <p className="mt-1">Passez à Premium pour débloquer les fonctionnalités illimitées.</p>
                </div>
                <button
                  onClick={() => window.location.href = '/abonnement'}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors font-semibold shadow-sm hover:shadow"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>S&apos;abonner maintenant</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmation de désabonnement */}
      {showUnsubscribeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Arrêter l&apos;abonnement ?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Voulez-vous vraiment rediriger vers le portail pour annuler votre abonnement ?
                <br />
                <span className="font-medium text-gray-700">Votre accès restera actif jusqu&apos;à la fin de la période en cours.</span>
              </p>
            </div>

            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowUnsubscribeModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setShowUnsubscribeModal(false)
                  handleManageSubscription()
                }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-md transition-all hover:scale-[1.02]"
              >
                Confirmer l&apos;arrêt
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  )
}
