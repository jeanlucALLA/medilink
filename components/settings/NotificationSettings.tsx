'use client'

import { useState, useEffect } from 'react'
import { Bell, Mail, Clock, ShieldCheck, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'

interface NotificationPreferences {
  emailAlerts: boolean
  followUpReminders: boolean
  securityAlerts: boolean
  weeklySummary: boolean
}

export default function NotificationSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailAlerts: false,
    followUpReminders: false,
    securityAlerts: true, // Par défaut true pour la sécurité
    weeklySummary: false,
  })

  // Charger les préférences depuis Supabase
  useEffect(() => {
    const loadPreferences = async () => {
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

        // Récupérer les préférences depuis la table profiles
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('notifications')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Erreur lors du chargement des préférences:', profileError)
          // Si le profil n'existe pas ou notifications est null, utiliser les valeurs par défaut
          if (profileError.code === 'PGRST116') {
            // Profil n'existe pas, utiliser les valeurs par défaut
            setLoading(false)
            return
          } else {
            setError(`Erreur lors du chargement: ${profileError.message}`)
          }
        } else if (profileData?.notifications) {
          // Fusionner les préférences existantes avec les valeurs par défaut
          setPreferences({
            emailAlerts: profileData.notifications.emailAlerts ?? false,
            followUpReminders: profileData.notifications.followUpReminders ?? false,
            securityAlerts: profileData.notifications.securityAlerts ?? true,
            weeklySummary: profileData.notifications.weeklySummary ?? false,
          })
        }
      } catch (err: any) {
        console.error('Erreur lors du chargement:', err)
        setError('Une erreur est survenue lors du chargement des préférences')
      } finally {
        setLoading(false)
      }
    }

    loadPreferences()
  }, [])

  // Gérer le changement d'une préférence
  const handlePreferenceChange = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
    // Réinitialiser le message de succès si l'utilisateur modifie quelque chose
    if (success) {
      setSuccess(false)
    }
  }

  // Enregistrer les préférences
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

      // Mettre à jour les préférences dans Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          notifications: preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Erreur lors de la mise à jour:', updateError)
        setError(`Erreur lors de l'enregistrement: ${updateError.message}`)
      } else {
        setSuccess(true)
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

  const notificationSettings = [
    {
      key: 'emailAlerts' as keyof NotificationPreferences,
      label: 'Alertes Email',
      description: 'Recevoir un email pour chaque nouveau questionnaire patient',
      icon: Mail,
      color: 'blue',
    },
    {
      key: 'followUpReminders' as keyof NotificationPreferences,
      label: 'Rappels de suivi',
      description: 'Être notifié des patients n\'ayant pas répondu après 48h',
      icon: Clock,
      color: 'orange',
    },
    {
      key: 'securityAlerts' as keyof NotificationPreferences,
      label: 'Sécurité',
      description: 'Recevoir une alerte lors d\'une nouvelle connexion sur un nouvel appareil',
      icon: ShieldCheck,
      color: 'purple',
    },
    {
      key: 'weeklySummary' as keyof NotificationPreferences,
      label: 'Résumé hebdomadaire',
      description: 'Recevoir un rapport d\'activité chaque lundi matin',
      icon: Bell,
      color: 'green',
    },
  ]

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-gray-600">Chargement des préférences...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <Bell className="w-5 h-5 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Préférences de notifications</h2>
      </div>

      {/* Message de succès */}
      {success && (
        <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-green-800">
              Préférences enregistrées avec succès
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

      {/* Liste des réglages */}
      <div className="space-y-4 mb-6">
        {notificationSettings.map((setting) => {
          const Icon = setting.icon
          const isEnabled = preferences[setting.key]
          const colorClasses = {
            blue: 'bg-blue-100 text-blue-600',
            orange: 'bg-orange-100 text-orange-600',
            purple: 'bg-purple-100 text-purple-600',
            green: 'bg-green-100 text-green-600',
          }

          return (
            <div
              key={setting.key}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start space-x-4 flex-1">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[setting.color as keyof typeof colorClasses]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    {setting.label}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {setting.description}
                  </p>
                </div>
              </div>

              {/* Switch stylisé */}
              <button
                type="button"
                onClick={() => handlePreferenceChange(setting.key)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  isEnabled ? 'bg-primary' : 'bg-gray-200'
                }`}
                role="switch"
                aria-checked={isEnabled}
                aria-label={setting.label}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )
        })}
      </div>

      {/* Bouton Enregistrer */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Enregistrement...</span>
            </>
          ) : (
            <>
              <Bell className="w-5 h-5" />
              <span>Enregistrer les préférences</span>
            </>
          )}
        </button>
      </div>

      {/* Section d'information */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Bell className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-800">À propos des notifications</p>
            <p className="text-xs text-gray-600 mt-1">
              Les notifications par email sont essentielles pour être alerté rapidement des scores bas de vos patients.
              Nous recommandons de garder les alertes de sécurité activées pour protéger votre compte.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}



