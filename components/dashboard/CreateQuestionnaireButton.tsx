'use client'

import { useState } from 'react'
import { Plus, X, CheckCircle, Loader2, Info } from 'lucide-react'

interface CreateQuestionnaireButtonProps {
  onSuccess?: () => void
}

export default function CreateQuestionnaireButton({ onSuccess }: CreateQuestionnaireButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    patientName: '',
    patientEmail: '',
    followUpType: '',
    sendDelayDays: 14, // Délai d'envoi par défaut : 14 jours
  })

  const followUpOptions = [
    { value: '', label: 'Sélectionner un type de suivi' },
    { value: 'Lombalgie', label: 'Lombalgie' },
    { value: 'Post-opératoire', label: 'Post-opératoire' },
    { value: 'Suivi chronique', label: 'Suivi chronique' },
    { value: 'Kinésithérapie', label: 'Kinésithérapie' },
    { value: 'Podologie', label: 'Podologie' },
    { value: 'Cardiologie', label: 'Cardiologie' },
    { value: 'Autre', label: 'Autre' },
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    // Gestion spéciale pour le champ numérique (sendDelayDays)
    if (name === 'sendDelayDays') {
      const numValue = value === '' ? 14 : Math.max(1, parseInt(value, 10) || 14)
      setFormData(prev => ({
        ...prev,
        [name]: numValue,
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }))
    }
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validation
    if (!formData.patientName.trim()) {
      setError('Le nom du patient est requis')
      setLoading(false)
      return
    }

    if (!formData.patientEmail.trim()) {
      setError('L\'email du patient est requis')
      setLoading(false)
      return
    }

    if (!formData.followUpType) {
      setError('Veuillez sélectionner un type de suivi')
      setLoading(false)
      return
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.patientEmail)) {
      setError('Veuillez entrer un email valide')
      setLoading(false)
      return
    }

    try {
      const { supabase } = await import('@/lib/supabase') as any
      
      // Récupérer l'utilisateur connecté
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        setError('Vous devez être connecté pour créer un questionnaire')
        setLoading(false)
        return
      }

      // Calculer le délai d'envoi (minimum 1 jour, défaut 14 jours)
      const delayInDays = formData.sendDelayDays && formData.sendDelayDays >= 1 
        ? formData.sendDelayDays 
        : 14

      // Calculer la date d'envoi : Date.now() + (delayInDays * 24 * 60 * 60 * 1000)
      const dateEnvoiSuivi = new Date(Date.now() + (delayInDays * 24 * 60 * 60 * 1000))
      
      // Formater la date pour l'affichage
      const formattedDate = dateEnvoiSuivi.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })

      // Insérer dans la table questionnaires avec la date calculée
      const { error: insertError } = await supabase
        .from('questionnaires')
        .insert({
          user_id: user.id,
          pathologie: formData.followUpType,
          patient_name: formData.patientName.trim(),
          patient_email: formData.patientEmail.trim(),
          questions: [], // Tableau vide pour l'instant
          status: 'Programmé',
          date_envoi_suivi: dateEnvoiSuivi.toISOString(), // Date calculée (écrase le défaut de 14 jours de la base)
          send_after_days: delayInDays, // Stocker aussi le nombre de jours pour référence
          created_at: new Date().toISOString(),
        })

      if (insertError) {
        console.error('Erreur lors de l\'insertion:', insertError)
        setError(`Erreur lors de la création: ${insertError.message || 'Erreur inconnue'}`)
        setLoading(false)
        return
      }

      // Succès avec message de confirmation
      setSuccess(true)
      
      // Message de confirmation avec la date exacte
      const successMessage = `Questionnaire enregistré. L'email sera envoyé le ${formattedDate}.`
      setError(successMessage) // Réutiliser le state error pour afficher le message de succès informatif

      // Fermer la modal après 3 secondes (plus de temps pour lire le message)
      setTimeout(() => {
        setIsModalOpen(false)
        setSuccess(false)
        setFormData({
          patientName: '',
          patientEmail: '',
          followUpType: '',
          sendDelayDays: 14, // Réinitialiser à la valeur par défaut
        })
        setError(null)
        
        // Appeler le callback si fourni
        if (onSuccess) {
          onSuccess()
        }
      }, 3000)

    } catch (err: any) {
      console.error('Erreur lors de la création du questionnaire:', err)
      setError(`Erreur inattendue: ${err.message || 'Erreur inconnue'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCloseModal = () => {
    if (!loading) {
      setIsModalOpen(false)
      setSuccess(false)
      setFormData({
        patientName: '',
        patientEmail: '',
        followUpType: '',
        sendDelayDays: 14, // Réinitialiser à la valeur par défaut
      })
      setError(null)
    }
  }

  return (
    <>
      {/* Bouton principal */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors shadow-sm hover:shadow-md"
      >
        <Plus className="w-5 h-5" />
        <span>Nouveau questionnaire</span>
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* En-tête de la modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Créer un questionnaire</h2>
              <button
                onClick={handleCloseModal}
                disabled={loading}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenu de la modal */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Message d'erreur */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Message de succès */}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold mb-1">Questionnaire créé avec succès !</p>
                    {error && !error.includes('Erreur') && (
                      <p className="text-sm">{error}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Nom du patient */}
              <div>
                <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du patient <span className="text-red-500">*</span>
                </label>
                <input
                  id="patientName"
                  name="patientName"
                  type="text"
                  value={formData.patientName}
                  onChange={handleInputChange}
                  required
                  disabled={loading || success}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Ex: Jean Dupont"
                />
              </div>

              {/* Email du patient */}
              <div>
                <label htmlFor="patientEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Email du patient <span className="text-red-500">*</span>
                </label>
                <input
                  id="patientEmail"
                  name="patientEmail"
                  type="email"
                  value={formData.patientEmail}
                  onChange={handleInputChange}
                  required
                  disabled={loading || success}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="exemple@patient.com"
                />
              </div>

              {/* Type de suivi */}
              <div>
                <label htmlFor="followUpType" className="block text-sm font-medium text-gray-700 mb-2">
                  Type de suivi <span className="text-red-500">*</span>
                </label>
                <select
                  id="followUpType"
                  name="followUpType"
                  value={formData.followUpType}
                  onChange={handleInputChange}
                  required
                  disabled={loading || success}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {followUpOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Délai avant envoi automatique */}
              <div>
                <label htmlFor="sendDelayDays" className="block text-sm font-medium text-gray-700 mb-2">
                  Délai avant envoi automatique (jours)
                </label>
                <input
                  id="sendDelayDays"
                  name="sendDelayDays"
                  type="number"
                  min="1"
                  value={formData.sendDelayDays}
                  onChange={handleInputChange}
                  disabled={loading || success}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="14"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Le patient recevra le lien de suivi après ce nombre de jours.
                </p>
              </div>

              {/* Note d'information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  ℹ️ Un email de suivi sera automatiquement envoyé au patient avec son lien personnel selon le délai configuré.
                </p>
              </div>

              {/* Boutons d'action */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={loading || success}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading || success}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Création...</span>
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Créé !</span>
                    </>
                  ) : (
                    <span>Créer le questionnaire</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

