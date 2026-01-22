'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface CustomTemplate {
    id: string
    name: string
    description: string | null
    pathologie: string
    questions: string[]
    is_favorite: boolean
    use_count: number
    created_at: string
}

interface CustomTemplatesCardProps {
    onSelectTemplate?: (template: CustomTemplate) => void
}

export default function CustomTemplatesCard({ onSelectTemplate }: CustomTemplatesCardProps) {
    const [templates, setTemplates] = useState<CustomTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState<CustomTemplate | null>(null)

    // Form state
    const [formName, setFormName] = useState('')
    const [formDescription, setFormDescription] = useState('')
    const [formPathologie, setFormPathologie] = useState('')
    const [formQuestions, setFormQuestions] = useState<string[]>([''])
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchTemplates()
    }, [])

    const fetchTemplates = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setLoading(false)
                return
            }

            const { data, error } = await supabase
                .from('custom_templates')
                .select('*')
                .eq('user_id', user.id)
                .order('is_favorite', { ascending: false })
                .order('use_count', { ascending: false })

            if (error) {
                console.error('Erreur récupération templates:', error)
            } else {
                setTemplates(data || [])
            }
        } catch (error) {
            console.error('Erreur:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateTemplate = async () => {
        if (!formName || !formPathologie || formQuestions.filter(q => q.trim()).length === 0) {
            alert('Veuillez remplir tous les champs obligatoires')
            return
        }

        setSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) return

            const cleanQuestions = formQuestions.filter(q => q.trim())

            if (editingTemplate) {
                // Update existing template
                const { error } = await supabase
                    .from('custom_templates')
                    .update({
                        name: formName,
                        description: formDescription || null,
                        pathologie: formPathologie,
                        questions: cleanQuestions,
                    })
                    .eq('id', editingTemplate.id)

                if (error) throw error
            } else {
                // Create new template
                const { error } = await supabase
                    .from('custom_templates')
                    .insert({
                        user_id: user.id,
                        name: formName,
                        description: formDescription || null,
                        pathologie: formPathologie,
                        questions: cleanQuestions,
                    })

                if (error) throw error
            }

            // Reset and refresh
            resetForm()
            fetchTemplates()
        } catch (error) {
            console.error('Erreur sauvegarde:', error)
            alert('Erreur lors de la sauvegarde')
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteTemplate = async (id: string) => {
        if (!confirm('Supprimer ce modèle ?')) return

        try {
            const { error } = await supabase
                .from('custom_templates')
                .delete()
                .eq('id', id)

            if (error) throw error
            fetchTemplates()
        } catch (error) {
            console.error('Erreur suppression:', error)
        }
    }

    const handleToggleFavorite = async (template: CustomTemplate) => {
        try {
            const { error } = await supabase
                .from('custom_templates')
                .update({ is_favorite: !template.is_favorite })
                .eq('id', template.id)

            if (error) throw error
            fetchTemplates()
        } catch (error) {
            console.error('Erreur favori:', error)
        }
    }

    const handleEditTemplate = (template: CustomTemplate) => {
        setEditingTemplate(template)
        setFormName(template.name)
        setFormDescription(template.description || '')
        setFormPathologie(template.pathologie)
        setFormQuestions(template.questions.length > 0 ? template.questions : [''])
        setShowCreateModal(true)
    }

    const resetForm = () => {
        setShowCreateModal(false)
        setEditingTemplate(null)
        setFormName('')
        setFormDescription('')
        setFormPathologie('')
        setFormQuestions([''])
    }

    const addQuestion = () => {
        setFormQuestions([...formQuestions, ''])
    }

    const removeQuestion = (index: number) => {
        setFormQuestions(formQuestions.filter((_, i) => i !== index))
    }

    const updateQuestion = (index: number, value: string) => {
        const updated = [...formQuestions]
        updated[index] = value
        setFormQuestions(updated)
    }

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-16 bg-gray-200 rounded"></div>
                        <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">📝 Mes Modèles</h3>
                    <p className="text-sm text-gray-500">{templates.length} modèle{templates.length > 1 ? 's' : ''} personnalisé{templates.length > 1 ? 's' : ''}</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <span>+</span> Créer
                </button>
            </div>

            {/* Templates List */}
            {templates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <span className="text-4xl mb-2 block">📋</span>
                    <p>Créez votre premier modèle personnalisé pour gagner du temps !</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {templates.map((template) => (
                        <div
                            key={template.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggleFavorite(template)}
                                        className="text-xl hover:scale-110 transition-transform"
                                    >
                                        {template.is_favorite ? '⭐' : '☆'}
                                    </button>
                                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                        {template.pathologie}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    {template.questions.length} question{template.questions.length > 1 ? 's' : ''} •
                                    Utilisé {template.use_count} fois
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                {onSelectTemplate && (
                                    <button
                                        onClick={() => onSelectTemplate(template)}
                                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                                    >
                                        Utiliser
                                    </button>
                                )}
                                <button
                                    onClick={() => handleEditTemplate(template)}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                >
                                    ✏️
                                </button>
                                <button
                                    onClick={() => handleDeleteTemplate(template.id)}
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-6">
                                {editingTemplate ? 'Modifier le modèle' : 'Créer un modèle'}
                            </h3>

                            {/* Form */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nom du modèle *
                                    </label>
                                    <input
                                        type="text"
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Ex: Suivi post-opératoire genou"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Pathologie *
                                    </label>
                                    <input
                                        type="text"
                                        value={formPathologie}
                                        onChange={(e) => setFormPathologie(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Ex: Chirurgie du genou"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description (optionnel)
                                    </label>
                                    <textarea
                                        value={formDescription}
                                        onChange={(e) => setFormDescription(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={2}
                                        placeholder="Description du modèle..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Questions *
                                    </label>
                                    <div className="space-y-2">
                                        {formQuestions.map((question, index) => (
                                            <div key={index} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={question}
                                                    onChange={(e) => updateQuestion(index, e.target.value)}
                                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder={`Question ${index + 1}`}
                                                />
                                                {formQuestions.length > 1 && (
                                                    <button
                                                        onClick={() => removeQuestion(index)}
                                                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={addQuestion}
                                        className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        + Ajouter une question
                                    </button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={resetForm}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleCreateTemplate}
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {saving ? 'Enregistrement...' : (editingTemplate ? 'Modifier' : 'Créer')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
