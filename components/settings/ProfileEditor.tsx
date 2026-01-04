'use client'

import { useState, useEffect } from 'react'
import { User, Mail, GraduationCap, Stethoscope, Building2, MapPin, AlertTriangle, Save, Loader2, CheckCircle } from 'lucide-react'

interface ProfileData {
  email: string
  nom_complet: string
  specialite: string
  rpps: string
  cabinet: string
  adresse_cabinet: string
}

export default function ProfileEditor() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState<ProfileData>({
    email: '',
    nom_complet: '',
    specialite: '',
    rpps: '',
    cabinet: '',
    adresse_cabinet: '',
  })

  // Charger le profil depuis Supabase
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const { supabase } = await import('@/lib/supabase') as any
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          setError('Utilisateur non authentifié')
          setLoading(false)
          return
        }

        // Récupérer le profil depuis la table profiles
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email, nom_complet, specialite, rpps, cabinet, adresse_cabinet')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Erreur lors du chargement du profil:', profileError)
          // Si le profil n'existe pas, on continue avec un formulaire vide
          if (profileError.code === 'PGRST116') {
            setProfile(null)
            setFormData({
              email: user.email || '',
              nom_complet: '',
              specialite: '',
              rpps: '',
              cabinet: '',
              adresse_cabinet: '',
            })
          } else {
            setError(`Erreur lors du chargement: ${profileError.message}`)
          }
        } else {
          // Convertir les valeurs NULL en chaînes vides pour les inputs
          setProfile(profileData)
          setFormData({
            email: profileData.email || user.email || '',
            nom_complet: profileData.nom_complet || '',
            specialite: profileData.specialite || '',
            rpps: profileData.rpps || '',
            cabinet: profileData.cabinet || '',
            adresse_cabinet: profileData.adresse_cabinet || '',
          })
        }
      } catch (err: any) {
        console.error('Erreur lors du chargement:', err)
        setError('Une erreur est survenue lors du chargement du profil')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  // Gérer les changements dans le formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    // Réinitialiser le message de succès si l'utilisateur modifie quelque chose
    if (success) {
      setSuccess(false)
    }
  }

  // Enregistrer les modifications
  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      const { supabase } = await import('@/lib/supabase') as any
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        setError('Utilisateur non authentifié')
        setSaving(false)
        return
      }

      // Validation des champs requis
      if (!formData.nom_complet?.trim()) {
        setError('Le nom complet est requis')
        setSaving(false)
        return
      }

      if (!formData.specialite?.trim()) {
        setError('La spécialité est requise')
        setSaving(false)
        return
      }

      // Mettre à jour le profil dans Supabase
      // Sécurité : utiliser .eq('id', user.id) pour s'assurer qu'on met à jour uniquement le profil de l'utilisateur actuel
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          email: formData.email.trim() || user.email || '',
          nom_complet: formData.nom_complet.trim(),
          specialite: formData.specialite.trim(),
          rpps: formData.rpps.trim() || null,
          cabinet: formData.cabinet.trim() || null,
          adresse_cabinet: formData.adresse_cabinet.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Erreur lors de la mise à jour:', updateError)
        setError(`Erreur lors de l'enregistrement: ${updateError.message}`)
      } else {
        setSuccess(true)
        setProfile(formData)
        // Masquer le message de succès après 3 secondes
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err: any) {
      console.error('Erreur lors de l\'enregistrement:', err)
      setError('Une erreur est survenue lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  // Vérifier si le profil est incomplet
  const isProfileIncomplete = !formData.nom_complet?.trim() || !formData.specialite?.trim()

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-gray-600">Chargement du profil...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Profil Professionnel</h2>
      </div>

      {/* Message d'alerte si profil incomplet */}
      {isProfileIncomplete && (
        <div className="mb-6 bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-800">
                Profil à compléter
              </p>
              <p className="text-xs text-orange-700 mt-1">
                Veuillez renseigner au minimum votre nom complet et votre spécialité.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Message de succès */}
      {success && (
        <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-green-800">
              Profil enregistré avec succès
            </p>
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Formulaire */}
      <div className="space-y-4">
        {/* Nom complet */}
        <div>
          <label htmlFor="nom_complet" className="block text-sm font-medium text-gray-700 mb-2">
            Nom complet <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="nom_complet"
              name="nom_complet"
              type="text"
              value={formData.nom_complet}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Dr. Jean Dupont"
            />
          </div>
        </div>

        {/* Email (lecture seule) */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              placeholder="votre@email.com"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">L&apos;email ne peut pas être modifié</p>
        </div>

        {/* Spécialité */}
        <div>
          <label htmlFor="specialite" className="block text-sm font-medium text-gray-700 mb-2">
            Spécialité médicale <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="specialite"
              name="specialite"
              type="text"
              value={formData.specialite}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Ex: Podologue, Cardiologue, Kinésithérapeute..."
            />
          </div>
        </div>

        {/* Numéro RPPS */}
        <div>
          <label htmlFor="rpps" className="block text-sm font-medium text-gray-700 mb-2">
            Numéro RPPS
          </label>
          <div className="relative">
            <Stethoscope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Cabinet Médical..."
            />
          </div>
        </div>

        {/* Adresse du cabinet */}
        <div>
          <label htmlFor="adresse_cabinet" className="block text-sm font-medium text-gray-700 mb-2">
            Adresse du cabinet
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              id="adresse_cabinet"
              name="adresse_cabinet"
              type="text"
              value={formData.adresse_cabinet}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Numéro, rue, ville, code postal..."
            />
          </div>
        </div>

        {/* Bouton Enregistrer */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving || isProfileIncomplete}
            className="flex items-center space-x-2 bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          {isProfileIncomplete && (
            <p className="mt-2 text-xs text-gray-500">
              <span className="text-red-500">*</span> Les champs marqués d&apos;un astérisque rouge sont obligatoires
            </p>
          )}
        </div>
      </div>
    </div>
  )
}


