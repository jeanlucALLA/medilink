'use client'

import { useState } from 'react'
import { Lock, Loader2, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react'

export default function SecuritySettings() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPasswords, setShowPasswords] = useState({ new: false, confirm: false })

  // Calculer la force du mot de passe
  const getPasswordStrength = (password: string): { strength: 'weak' | 'medium' | 'strong'; label: string; color: string } => {
    if (password.length === 0) {
      return { strength: 'weak', label: '', color: '' }
    }

    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z\d]/.test(password)) strength++

    if (strength <= 2) {
      return { strength: 'weak', label: 'Faible', color: 'text-red-600' }
    } else if (strength <= 4) {
      return { strength: 'medium', label: 'Moyen', color: 'text-yellow-600' }
    } else {
      return { strength: 'strong', label: 'Fort', color: 'text-green-600' }
    }
  }

  const passwordStrength = getPasswordStrength(newPassword)

  // Valider le formulaire
  const validateForm = (): boolean => {
    setError(null)

    if (!newPassword.trim()) {
      setError('Le nouveau mot de passe est requis')
      return false
    }

    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return false
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return false
    }

    return true
  }

  // Gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      const { supabase } = await import('@/lib/supabase') as any
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        setError('Utilisateur non authentifié')
        setLoading(false)
        return
      }

      // Mettre à jour le mot de passe via Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        console.error('Erreur lors de la mise à jour du mot de passe:', updateError)
        setError(`Erreur lors de la mise à jour: ${updateError.message}`)
      } else {
        setSuccess(true)
        // Réinitialiser le formulaire
        setNewPassword('')
        setConfirmPassword('')
        // Masquer le message de succès après 5 secondes
        setTimeout(() => setSuccess(false), 5000)
      }
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du mot de passe:', err)
      setError('Une erreur est survenue lors de la mise à jour du mot de passe')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-purple-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Sécurité du compte</h2>
      </div>

      {/* Message de succès */}
      {success && (
        <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-green-800">
              Mot de passe mis à jour avec succès
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
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nouveau mot de passe */}
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Nouveau mot de passe <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="newPassword"
              name="newPassword"
              type={showPasswords.new ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value)
                setError(null)
                if (success) setSuccess(false)
              }}
              required
              minLength={8}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
            >
              {showPasswords.new ? 'Masquer' : 'Afficher'}
            </button>
          </div>
          
          {/* Indicateur de force du mot de passe */}
          {newPassword.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center space-x-2 mb-1">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      passwordStrength.strength === 'weak'
                        ? 'bg-red-500 w-1/3'
                        : passwordStrength.strength === 'medium'
                        ? 'bg-yellow-500 w-2/3'
                        : 'bg-green-500 w-full'
                    }`}
                  />
                </div>
                {passwordStrength.label && (
                  <span className={`text-xs font-medium ${passwordStrength.color}`}>
                    {passwordStrength.label}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Minimum 8 caractères requis
              </p>
            </div>
          )}
        </div>

        {/* Confirmation du mot de passe */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirmation du nouveau mot de passe <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPasswords.confirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setError(null)
                if (success) setSuccess(false)
              }}
              required
              minLength={8}
              className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                confirmPassword && newPassword && confirmPassword !== newPassword
                  ? 'border-red-300'
                  : confirmPassword && confirmPassword === newPassword
                  ? 'border-green-300'
                  : 'border-gray-300'
              }`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
            >
              {showPasswords.confirm ? 'Masquer' : 'Afficher'}
            </button>
          </div>
          
          {/* Indicateur de correspondance */}
          {confirmPassword.length > 0 && (
            <div className="mt-2">
              {confirmPassword === newPassword ? (
                <p className="text-xs text-green-600 flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Les mots de passe correspondent</span>
                </p>
              ) : (
                <p className="text-xs text-red-600 flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Les mots de passe ne correspondent pas</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Bouton de soumission */}
        <div className="pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 8}
            className="flex items-center space-x-2 bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Mise à jour en cours...</span>
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                <span>Changer le mot de passe</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Section d'information */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Conseil de sécurité</p>
            <p className="text-xs text-blue-700 mt-1">
              Pour votre sécurité, utilisez un mélange de lettres, chiffres et caractères spéciaux.
              Évitez d&apos;utiliser des informations personnelles ou des mots de passe que vous utilisez ailleurs.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


