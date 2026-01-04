'use client'

import { useState, useEffect, useRef } from 'react'
import { FileText, Trash2, Download, Clock, AlertCircle } from 'lucide-react'

interface PatientNote {
  id: string
  nom: string
  prenom: string
  note: string
  createdAt: number
  expiresAt: number
}

export default function ConsultationPage() {
  const [notes, setNotes] = useState<PatientNote[]>([])
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    note: '',
  })
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Nettoyage automatique toutes les minutes
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now()
      setNotes((prevNotes) => {
        const activeNotes = prevNotes.filter((note) => note.expiresAt > now)
        
        // Log si des notes ont été supprimées
        if (activeNotes.length < prevNotes.length) {
          console.log(`🗑️ ${prevNotes.length - activeNotes.length} note(s) supprimée(s) automatiquement`)
        }
        
        return activeNotes
      })
    }

    // Nettoyer immédiatement au chargement
    cleanup()
    
    // Puis toutes les minutes
    intervalRef.current = setInterval(cleanup, 60000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nom.trim() || !formData.prenom.trim() || !formData.note.trim()) {
      alert('Veuillez remplir tous les champs')
      return
    }

    const now = Date.now()
    const newNote: PatientNote = {
      id: `note-${now}-${Math.random().toString(36).substr(2, 9)}`,
      nom: formData.nom.trim(),
      prenom: formData.prenom.trim(),
      note: formData.note.trim(),
      createdAt: now,
      expiresAt: now + 60 * 60 * 1000, // 60 minutes
    }

    setNotes((prev) => [...prev, newNote])
    setFormData({ nom: '', prenom: '', note: '' })
    
    console.log('✅ Note créée:', newNote.id, 'Expire dans 60 minutes')
  }

  const handleDelete = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id))
    console.log('🗑️ Note supprimée manuellement:', id)
  }

  const handleDeleteAll = () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer toutes les notes ?')) {
      setNotes([])
      console.log('🗑️ Toutes les notes supprimées')
    }
  }

  const generatePDF = async (note: PatientNote) => {
    try {
      // Import dynamique de jsPDF
      const { jsPDF } = await import('jspdf')
      
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 20
      const maxWidth = pageWidth - 2 * margin
      
      // En-tête
      doc.setFontSize(18)
      doc.text('Note de Consultation', margin, 20)
      
      // Informations patient
      doc.setFontSize(12)
      let y = 35
      doc.text(`Nom: ${note.nom}`, margin, y)
      y += 10
      doc.text(`Prénom: ${note.prenom}`, margin, y)
      y += 10
      
      // Date de création
      const date = new Date(note.createdAt).toLocaleString('fr-FR')
      doc.text(`Date: ${date}`, margin, y)
      y += 15
      
      // Note
      doc.setFontSize(14)
      doc.text('Note de consultation:', margin, y)
      y += 10
      
      doc.setFontSize(11)
      const lines = doc.splitTextToSize(note.note, maxWidth)
      doc.text(lines, margin, y)
      
      // Avertissement
      y = doc.internal.pageSize.getHeight() - 30
      doc.setFontSize(8)
      doc.setTextColor(150, 0, 0)
      doc.text('⚠️ Cette note a été générée localement et n\'est pas stockée sur le serveur', margin, y)
      
      // Nom du fichier
      const fileName = `consultation_${note.nom}_${note.prenom}_${new Date(note.createdAt).toISOString().split('T')[0]}.pdf`
      doc.save(fileName)
      
      console.log('📄 PDF généré:', fileName)
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error)
      alert('Erreur lors de la génération du PDF. Vérifiez que la bibliothèque jsPDF est installée.')
    }
  }

  const getTimeRemaining = (expiresAt: number) => {
    const now = Date.now()
    const remaining = expiresAt - now
    
    if (remaining <= 0) return 'Expiré'
    
    const minutes = Math.floor(remaining / 60000)
    const seconds = Math.floor((remaining % 60000) / 1000)
    
    return `${minutes}m ${seconds}s`
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                Sécurité des données (RGPD/HDS)
              </h3>
              <p className="text-xs text-yellow-700">
                Les données sont stockées uniquement en mémoire du navigateur et sont automatiquement supprimées après 60 minutes. 
                Aucune donnée n&apos;est persistée sur le serveur.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Saisie de Consultation
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  id="nom"
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Dupont"
                />
              </div>

              <div>
                <label htmlFor="prenom" className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  id="prenom"
                  type="text"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Jean"
                />
              </div>
            </div>

            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                Note de consultation *
              </label>
              <textarea
                id="note"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                required
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Détails de la consultation..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Enregistrer la note
            </button>
          </form>
        </div>

        {notes.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Notes enregistrées ({notes.length})
              </h2>
              <button
                onClick={handleDeleteAll}
                className="flex items-center space-x-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer toutes</span>
              </button>
            </div>

            <div className="space-y-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {note.prenom} {note.nom}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Créé le {new Date(note.createdAt).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1 text-xs text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{getTimeRemaining(note.expiresAt)}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4 whitespace-pre-wrap">{note.note}</p>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => generatePDF(note)}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Exporter en PDF</span>
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Supprimer maintenant</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {notes.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucune note enregistrée</p>
            <p className="text-sm text-gray-500 mt-2">
              Les notes seront automatiquement supprimées 60 minutes après leur création
            </p>
          </div>
        )}
      </div>
    </div>
  )
}


