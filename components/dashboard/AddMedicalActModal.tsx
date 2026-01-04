'use client'

import { useState } from 'react'
import { X, Loader2, CheckCircle, Calendar, FileText, User } from 'lucide-react'

interface AddMedicalActModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddMedicalActModal({ isOpen, onClose, onSuccess }: AddMedicalActModalProps) {
  const [formData, setFormData] = useState({
    act_name: '',
    patient_name: '',
    act_date: new Date().toISOString().split('T')[0], // Date du jour par défaut
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validation
    if (!formData.act_name.trim()) {
      setError('Le nom de l\'acte est requis')
      setLoading(false)
      return
    }

    try {
      const { supabase } = await import('@/lib/supabase') as any
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        setError('Vous devez être connecté')
        setLoading(false)
        return
      }

      // Insérer l'acte médical dans Supabase
      const { error: insertError } = await supabase
        .from('medical_acts')
        .insert({
          user_id: user.id,
          act_name: formData.act_name.trim(),
          patient_name: formData.patient_name.trim() || null,
          act_date: formData.act_date,
          created_at: new Date().toISOString(),
        })

      if (insertError) {
        console.error('Erreur lors de l\'insertion:', insertError)
        setError(`Erreur lors de la sauvegarde: ${insertError.message || 'Erreur inconnue'}`)
        setLoading(false)
        return
      }

      // Succès
      setSuccess(true)
      
      // Appeler le callback de succès après un court délai
      setTimeout(() => {
        onSuccess()
        handleClose()
      }, 1500)

    } catch (err: any) {
      console.error('Erreur lors de la sauvegarde:', err)
      setError(`Erreur inattendue: ${err.message || 'Erreur inconnue'}`)
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setFormData({
        act_name: '',
        patient_name: '',
        act_date: new Date().toISOString().split('T')[0],
      })
      setError(null)
      setSuccess(false)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Ajouter un acte médical</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Message de succès */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>Acte médical créé avec succès !</span>
            </div>
          )}

          {/* Nom de l'acte */}
          <div>
            <label htmlFor="act_name" className="block text-sm font-medium text-gray-700 mb-2">
              Nom de l&apos;acte
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="act_name"
                name="act_name"
                type="text"
                value={formData.act_name}
                onChange={handleInputChange}
                required
                disabled={loading || success}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Ex: Consultation, Bilan, Soin..."
              />
            </div>
          </div>

          {/* Nom du patient (optionnel) */}
          <div>
            <label htmlFor="patient_name" className="block text-sm font-medium text-gray-700 mb-2">
              Nom du patient <span className="text-gray-500 text-xs">(optionnel)</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="patient_name"
                name="patient_name"
                type="text"
                value={formData.patient_name}
                onChange={handleInputChange}
                disabled={loading || success}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Ex: Jean Dupont"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="act_date" className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="act_date"
                name="act_date"
                type="date"
                value={formData.act_date}
                onChange={handleInputChange}
                required
                disabled={loading || success}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Boutons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
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
                  <span>Enregistrement...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Créé !</span>
                </>
              ) : (
                <span>Enregistrer</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


