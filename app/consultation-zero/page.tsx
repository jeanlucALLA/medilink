'use client'

import { useState, useEffect, useRef } from 'react'
import { Download, Trash2, Clock, AlertTriangle, FileText } from 'lucide-react'

interface Consultation {
  id: string
  patientId: string
  notes: string
  createdAt: number
  expiresAt: number
}

export default function ConsultationZeroPage() {
  const [patientId, setPatientId] = useState('')
  const [notes, setNotes] = useState('')
  const [consultation, setConsultation] = useState<Consultation | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Générer un ID patient aléatoire
  const generatePatientId = () => {
    const randomId = `PAT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    setPatientId(randomId)
  }

  // Compte à rebours
  useEffect(() => {
    if (!consultation) {
      setTimeRemaining(null)
      return
    }

    const updateCountdown = () => {
      const now = Date.now()
      const remaining = consultation.expiresAt - now

      if (remaining <= 0) {
        setTimeRemaining(0)
        setConsultation(null)
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
        return
      }

      setTimeRemaining(remaining)
    }

    updateCountdown()
    intervalRef.current = setInterval(updateCountdown, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [consultation])

  // Formater le temps restant
  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return 'Expiré'
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  // Créer une consultation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!patientId.trim() || !notes.trim()) {
      alert('Veuillez remplir tous les champs')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/consultation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: patientId.trim(),
          notes: notes.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la création')
      }

      const data = await response.json()
      
      // Récupérer la consultation complète
      const getResponse = await fetch(`/api/consultation?id=${data.id}`)
      if (getResponse.ok) {
        const consultationData = await getResponse.json()
        setConsultation(consultationData)
        setNotes('') // Vider le champ notes
      }
    } catch (error) {
      alert('Erreur lors de la création de la consultation')
    } finally {
      setLoading(false)
    }
  }

  // Télécharger et détruire
  const handleDownloadAndDestroy = async () => {
    if (!consultation) return

    try {
      // Générer le fichier texte
      const content = `CONSULTATION MÉDICALE
====================

Identifiant Patient: ${consultation.patientId}
Date de création: ${new Date(consultation.createdAt).toLocaleString('fr-FR')}
Date d'expiration: ${new Date(consultation.expiresAt).toLocaleString('fr-FR')}

NOTES CLINIQUES:
${consultation.notes}

---
Généré le: ${new Date().toLocaleString('fr-FR')}
⚠️ Ce fichier a été généré localement. Les données ne sont pas stockées sur le serveur.
`

      // Créer et télécharger le fichier
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `consultation_${consultation.patientId}_${new Date(consultation.createdAt).toISOString().split('T')[0]}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      // Supprimer immédiatement du serveur
      const deleteResponse = await fetch(`/api/consultation?id=${consultation.id}`, {
        method: 'DELETE',
      })

      if (deleteResponse.ok) {
        setConsultation(null)
        setPatientId('')
        setNotes('')
        alert('Fichier téléchargé et données supprimées du serveur')
      } else {
        alert('Fichier téléchargé mais erreur lors de la suppression')
      }
    } catch (error) {
      alert('Erreur lors du téléchargement')
    }
  }

  // Vérifier périodiquement si la consultation existe encore
  useEffect(() => {
    if (!consultation) return

    const checkConsultation = async () => {
      try {
        const response = await fetch(`/api/consultation?id=${consultation.id}`)
        if (!response.ok) {
          setConsultation(null)
        }
      } catch (error) {
        // Erreur silencieuse
      }
    }

    const interval = setInterval(checkConsultation, 30000) // Vérifier toutes les 30 secondes

    return () => clearInterval(interval)
  }, [consultation])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Bandeau d'avertissement */}
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-red-800 mb-1">
                Données non sauvegardées sur le serveur
              </h3>
              <p className="text-xs text-red-700">
                Suppression automatique dans 60 min. Les données sont stockées uniquement en mémoire vive et seront définitivement supprimées après expiration.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Consultation Médicale - Zero Data
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="patientId" className="block text-sm font-medium text-gray-700 mb-2">
                Identifiant Patient *
              </label>
              <div className="flex space-x-2">
                <input
                  id="patientId"
                  type="text"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  required
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="PAT-123456 ou identifiant personnalisé"
                />
                <button
                  type="button"
                  onClick={generatePatientId}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
                >
                  Générer ID
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes Cliniques *
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                required
                rows={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                placeholder="Saisissez les notes de consultation..."
              />
            </div>

            <button
              type="submit"
              disabled={loading || !!consultation}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Création...' : consultation ? 'Consultation active' : 'Créer la consultation'}
            </button>
          </form>
        </div>

        {/* Consultation active */}
        {consultation && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Consultation Active
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="font-mono">
                  {timeRemaining !== null ? formatTimeRemaining(timeRemaining) : 'Calcul...'}
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Identifiant Patient</p>
                <p className="text-gray-900 font-mono">{consultation.patientId}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Notes Cliniques</p>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-900 whitespace-pre-wrap font-mono text-sm">
                    {consultation.notes}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Créée le</p>
                  <p className="text-gray-900">
                    {new Date(consultation.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Expire le</p>
                  <p className="text-gray-900">
                    {new Date(consultation.expiresAt).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleDownloadAndDestroy}
                className="flex-1 flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>Télécharger et Détruire</span>
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              ⚠️ Cliquez sur &quot;Télécharger et Détruire&quot; pour sauvegarder localement et supprimer immédiatement les données du serveur
            </p>
          </div>
        )}

        {/* État vide */}
        {!consultation && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucune consultation active</p>
            <p className="text-sm text-gray-500 mt-2">
              Créez une consultation pour commencer. Elle sera automatiquement supprimée après 60 minutes.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}


