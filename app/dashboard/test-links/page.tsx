'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Send, CheckCircle, Loader2, AlertTriangle, ExternalLink } from 'lucide-react'

interface Questionnaire {
  id: string
  patient_name: string | null
  patient_email: string | null
  pathologie: string
  status: string
  date_envoi_suivi: string | null
  created_at: string
}

export default function TestLinksPage() {
  const router = useRouter()
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)

  // Charger les questionnaires
  const loadQuestionnaires = async () => {
    try {
      setLoading(true)
      setError(null)

      const { supabase } = await import('@/lib/supabase') as any
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        setError('Vous devez être connecté')
        return
      }

      const { data, error: fetchError } = await supabase
        .from('questionnaires')
        .select('id, patient_name, patient_email, pathologie, status, date_envoi_suivi, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('Erreur lors du chargement:', fetchError)
        setError(`Erreur lors du chargement: ${fetchError.message}`)
        return
      }

      setQuestionnaires(data || [])
    } catch (err: any) {
      console.error('Erreur:', err)
      setError(`Erreur inattendue: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuestionnaires()
  }, [])

  // Copier le lien patient dans le presse-papier
  const handleCopyLink = async (questionnaireId: string) => {
    try {
      const port = typeof window !== 'undefined' ? window.location.port || '3000' : '3000'
      const patientLink = `http://localhost:${port}/questionnaire/${questionnaireId}`
      
      await navigator.clipboard.writeText(patientLink)
      setCopiedId(questionnaireId)
      
      // Réinitialiser l'icône après 2 secondes
      setTimeout(() => {
        setCopiedId(null)
      }, 2000)
    } catch (err) {
      console.error('Erreur lors de la copie:', err)
      alert('Impossible de copier le lien. Veuillez le copier manuellement.')
    }
  }

  // Simuler l'envoi du mail (changer le statut de 'Programmé' à 'Envoyé')
  const handleSimulateSend = async (questionnaireId: string) => {
    try {
      setSendingId(questionnaireId)
      setError(null)

      const { supabase } = await import('@/lib/supabase') as any
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        setError('Vous devez être connecté')
        return
      }

      const { error: updateError } = await supabase
        .from('questionnaires')
        .update({ status: 'Envoyé' })
        .eq('id', questionnaireId)
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Erreur lors de la mise à jour:', updateError)
        setError(`Erreur lors de la simulation: ${updateError.message}`)
        return
      }

      // Recharger la liste
      await loadQuestionnaires()
    } catch (err: any) {
      console.error('Erreur:', err)
      setError(`Erreur inattendue: ${err.message}`)
    } finally {
      setSendingId(null)
    }
  }

  // Formater la date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Non programmé'
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return 'Date invalide'
    }
  }

  // Obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'programmé':
        return 'bg-orange-100 text-orange-800'
      case 'envoyé':
        return 'bg-green-100 text-green-800'
      case 'complété':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Bandeau d'avertissement MODE TEST */}
      <div className="bg-red-600 text-white p-4 rounded-lg shadow-lg border-2 border-red-700">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-bold">MODE TEST</h2>
            <p className="text-sm">
              Cette page ne doit pas être accessible en production. Elle permet de tester le tunnel patient sans attendre l&apos;envoi automatique des emails.
            </p>
          </div>
        </div>
      </div>

      {/* En-tête */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Tableau de bord de test</h1>
            <p className="text-gray-600">
              Générez et testez les liens patients sans attendre l&apos;envoi automatique des emails.
            </p>
          </div>
          <button
            onClick={loadQuestionnaires}
            disabled={loading}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Actualiser'
            )}
          </button>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Table des questionnaires */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-gray-600">Chargement des questionnaires...</p>
          </div>
        ) : questionnaires.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 mb-4">Aucun questionnaire trouvé.</p>
            <p className="text-sm text-gray-500">
              Créez un questionnaire depuis le tableau de bord principal.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom du patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type de suivi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date d&apos;envoi prévue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {questionnaires.map((questionnaire) => {
                  const port = typeof window !== 'undefined' ? window.location.port || '3000' : '3000'
                  const patientLink = `http://localhost:${port}/questionnaire/${questionnaire.id}`
                  const isCopied = copiedId === questionnaire.id
                  const isSending = sendingId === questionnaire.id

                  return (
                    <tr key={questionnaire.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {questionnaire.patient_name || (
                            <span className="text-gray-400 italic">Non renseigné</span>
                          )}
                        </div>
                        {questionnaire.patient_email && (
                          <div className="text-xs text-gray-500 mt-1">
                            {questionnaire.patient_email}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {questionnaire.pathologie}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(questionnaire.status)}`}>
                          {questionnaire.status || 'Non défini'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(questionnaire.date_envoi_suivi)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {/* Bouton Copier le lien */}
                          <button
                            onClick={() => handleCopyLink(questionnaire.id)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                            title="Copier le lien patient"
                          >
                            {isCopied ? (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                <span>Copié !</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span>Copier le lien</span>
                              </>
                            )}
                          </button>

                          {/* Bouton Simuler envoi */}
                          {questionnaire.status?.toLowerCase() === 'programmé' && (
                            <button
                              onClick={() => handleSimulateSend(questionnaire.id)}
                              disabled={isSending}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Simuler l'envoi du mail (change le statut à 'Envoyé')"
                            >
                              {isSending ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Envoi...</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-4 h-4" />
                                  <span>Simuler envoi</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* Bouton Ouvrir le lien */}
                          <a
                            href={patientLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-medium rounded-md bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
                            title="Ouvrir le lien patient dans un nouvel onglet"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>Ouvrir</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Informations utiles */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 Comment utiliser cette page :</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Cliquez sur &quot;Copier le lien&quot; pour copier l&apos;URL du questionnaire dans votre presse-papier</li>
          <li>Utilisez &quot;Simuler envoi&quot; pour changer le statut de &quot;Programmé&quot; à &quot;Envoyé&quot; et rendre la page accessible</li>
          <li>Cliquez sur &quot;Ouvrir&quot; pour tester directement le questionnaire dans un nouvel onglet</li>
          <li>Les questionnaires avec le statut &quot;Envoyé&quot; sont accessibles publiquement via le lien</li>
        </ul>
      </div>
    </div>
  )
}


