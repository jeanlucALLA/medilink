'use client'

import { useState, useEffect } from 'react'
import { Plus, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Questionnaire {
  id: string
  title: string
  questionCount: number
  createdAt: number
  expiresAt: number
  hasResponse: boolean
  responseViewed: boolean
}

export default function QuestionnairesPage() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadQuestionnaires()
    const interval = setInterval(loadQuestionnaires, 5000) // Rafraîchir toutes les 5 secondes
    return () => clearInterval(interval)
  }, [])

  const loadQuestionnaires = async () => {
    try {
      const response = await fetch('/api/questionnaire')
      if (response.ok) {
        const data = await response.json()
        setQuestionnaires(data.questionnaires || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des questionnaires:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredQuestionnaires = questionnaires.filter((questionnaire) =>
    questionnaire.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatus = (questionnaire: Questionnaire) => {
    if (questionnaire.hasResponse) {
      return questionnaire.responseViewed ? 'Consulté' : 'Nouvelle réponse'
    }
    return 'En attente'
  }

  const getStatusColor = (questionnaire: Questionnaire) => {
    if (questionnaire.hasResponse) {
      return questionnaire.responseViewed
        ? 'bg-green-100 text-green-800'
        : 'bg-blue-100 text-blue-800'
    }
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes Questionnaires</h1>
          <p className="text-gray-600 mt-2">Gérez vos questionnaires éphémères</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/questionnaire')}
          className="flex items-center space-x-2 bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nouveau questionnaire</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un questionnaire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Chargement des questionnaires...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Titre / ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date de création
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Questions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredQuestionnaires.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Aucun questionnaire trouvé
                    </td>
                  </tr>
                ) : (
                  filteredQuestionnaires.map((questionnaire) => (
                    <tr key={questionnaire.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {questionnaire.title}
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-1">
                          {questionnaire.id.substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(questionnaire.createdAt).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            questionnaire
                          )}`}
                        >
                          {getStatus(questionnaire)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {questionnaire.questionCount} question(s)
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}


