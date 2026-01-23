'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Save, Trash2, Tag, Loader2, Lock } from 'lucide-react'
import { Toaster, toast } from 'react-hot-toast'

const ADMIN_EMAILS = ['admin@medilink.fr', 'jeanluc@podologue-alla.fr', 'jeanlucallaa@yahoo.fr']

export default function EditTemplatePage() {
    const router = useRouter()
    const params = useParams()
    const templateId = params.id as string

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [authorized, setAuthorized] = useState(false)

    // Form State
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('')
    const [customCategory, setCustomCategory] = useState('')
    const [showCustomCategory, setShowCustomCategory] = useState(false)
    const [existingCategories, setExistingCategories] = useState<string[]>([])
    const [tagsInput, setTagsInput] = useState('')
    const [questions, setQuestions] = useState<any[]>([])

    useEffect(() => {
        checkAdminAndLoadTemplate()
        loadExistingCategories()
    }, [templateId])

    const loadExistingCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('public_templates')
                .select('category')

            if (!error && data) {
                const categories = [...new Set(data.map(t => t.category).filter(Boolean))] as string[]
                setExistingCategories(categories.sort())
            }
        } catch (err) {
            console.error('Error loading categories:', err)
        }
    }

    const checkAdminAndLoadTemplate = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user || !user.email || !ADMIN_EMAILS.includes(user.email)) {
                setAuthorized(false)
                setLoading(false)
                return
            }

            setAuthorized(true)

            // Load template data
            const { data: template, error } = await supabase
                .from('public_templates')
                .select('*')
                .eq('id', templateId)
                .single()

            if (error || !template) {
                toast.error('Modèle introuvable')
                router.push('/dashboard/library')
                return
            }

            // Populate form
            setName(template.name || '')
            setDescription(template.description || '')
            setCategory(template.category || '')
            setTagsInput(template.tags?.join(', ') || '')

            // Handle questions
            const templateQuestions = Array.isArray(template.questions)
                ? template.questions.map((q: any) => ({
                    question: typeof q === 'string' ? q : (q.question || q.text || ''),
                    type: q.type || 'scale',
                    label1: q.label1 || 'Pas du tout',
                    label5: q.label5 || 'Énormément'
                }))
                : [{ question: '', type: 'scale', label1: 'Pas du tout', label5: 'Énormément' }]

            setQuestions(templateQuestions)

        } catch (err) {
            console.error('Error loading template:', err)
            toast.error('Erreur lors du chargement')
        } finally {
            setLoading(false)
        }
    }

    const handleAddQuestion = () => {
        setQuestions([...questions, { question: '', type: 'scale', label1: 'Pas du tout', label5: 'Énormément' }])
    }

    const handleRemoveQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index))
    }

    const handleQuestionChange = (index: number, field: string, value: string) => {
        const newQuestions = [...questions]
        newQuestions[index] = { ...newQuestions[index], [field]: value }
        setQuestions(newQuestions)
    }

    const handleSave = async () => {
        if (!name.trim()) return toast.error("Le titre est obligatoire")
        if (questions.some(q => !q.question.trim())) return toast.error("Toutes les questions doivent avoir un texte")

        setSaving(true)
        try {
            const tags = tagsInput.split(',').map(t => t.trim().replace(/^#/, '')).filter(t => t)

            // Update public_templates
            const { error: tmplError } = await supabase
                .from('public_templates')
                .update({
                    name,
                    description,
                    category: showCustomCategory ? customCategory : category,
                    tags,
                    questions
                })
                .eq('id', templateId)

            if (tmplError) throw tmplError

            // Update normalized questions (delete and re-insert)
            await supabase
                .from('public_template_questions')
                .delete()
                .eq('template_id', templateId)

            const normalizedQuestions = questions.map(q => ({
                template_id: templateId,
                question: q.question,
                type: q.type,
                label1: q.type === 'scale' ? q.label1 : null,
                label5: q.type === 'scale' ? q.label5 : null
            }))

            await supabase
                .from('public_template_questions')
                .insert(normalizedQuestions)

            toast.success("Modèle mis à jour avec succès !")
            setTimeout(() => router.push('/dashboard/library'), 1500)

        } catch (error: any) {
            console.error('Save error:', error)
            toast.error("Erreur lors de la sauvegarde : " + error.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        </div>
    )

    if (!authorized) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
            <Lock className="w-16 h-16 text-gray-300 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Accès Restreint</h1>
            <p className="text-gray-500 mt-2">Cette page est réservée aux administrateurs.</p>
            <button onClick={() => router.push('/dashboard/library')} className="mt-6 text-primary hover:underline">
                Retour à la bibliothèque
            </button>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-white rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Modifier le Modèle</h1>
                        <p className="text-gray-500">Éditez les informations du questionnaire.</p>
                    </div>
                </div>

                {/* Main Form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Titre du Modèle *</label>
                            <input
                                value={name} onChange={e => setName(e.target.value)}
                                type="text" placeholder="Ex: Bilan Postural Complet"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea
                                value={description} onChange={e => setDescription(e.target.value)}
                                rows={2} placeholder="À quoi sert ce questionnaire ?"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                            <select
                                value={showCustomCategory ? '__custom__' : category}
                                onChange={e => {
                                    if (e.target.value === '__custom__') {
                                        setShowCustomCategory(true)
                                        setCategory('')
                                    } else {
                                        setShowCustomCategory(false)
                                        setCategory(e.target.value)
                                        setCustomCategory('')
                                    }
                                }}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="">Sélectionner...</option>
                                {existingCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                                <option value="__custom__">➕ Autre (personnalisé)</option>
                            </select>
                            {showCustomCategory && (
                                <input
                                    value={customCategory}
                                    onChange={e => {
                                        setCustomCategory(e.target.value)
                                        setCategory(e.target.value)
                                    }}
                                    type="text"
                                    placeholder="Entrez le nom de la nouvelle catégorie..."
                                    className="w-full mt-2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    autoFocus
                                />
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Tag className="w-4 h-4 inline mr-1" /> Hashtags
                            </label>
                            <input
                                value={tagsInput} onChange={e => setTagsInput(e.target.value)}
                                type="text" placeholder="kine, genou, sport (séparés par virgules)"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Questions Builder */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">Questions</h2>
                        <button
                            onClick={handleAddQuestion}
                            className="flex items-center gap-2 text-sm font-medium text-primary hover:bg-primary/5 px-3 py-2 rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Ajouter une question
                        </button>
                    </div>

                    {questions.map((q, idx) => (
                        <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative group">
                            <button
                                onClick={() => handleRemoveQuestion(idx)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>

                            <div className="space-y-4 pr-8">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Question {idx + 1}</label>
                                    <input
                                        value={q.question} onChange={e => handleQuestionChange(idx, 'question', e.target.value)}
                                        type="text" placeholder="Posez votre question de manière positive..."
                                        className="w-full px-0 border-0 border-b-2 border-gray-100 focus:border-primary focus:ring-0 text-lg font-medium placeholder-gray-300"
                                    />
                                </div>

                                <div className="flex gap-4 items-center bg-gray-50 p-3 rounded-lg">
                                    <div className="flex-1">
                                        <label className="block text-xs text-gray-500 mb-1">Type de réponse</label>
                                        <select
                                            value={q.type} onChange={e => handleQuestionChange(idx, 'type', e.target.value)}
                                            className="w-full text-sm bg-white border-gray-200 rounded-md"
                                        >
                                            <option value="scale">Échelle 1-5 (Recommandé)</option>
                                            <option value="text">Texte libre</option>
                                        </select>
                                    </div>

                                    {q.type === 'scale' && (
                                        <>
                                            <div className="flex-1">
                                                <label className="block text-xs text-gray-500 mb-1">Label 1 (Faible)</label>
                                                <input
                                                    value={q.label1} onChange={e => handleQuestionChange(idx, 'label1', e.target.value)}
                                                    type="text"
                                                    className="w-full text-sm border-gray-200 rounded-md"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-xs text-gray-500 mb-1">Label 5 (Fort)</label>
                                                <input
                                                    value={q.label5} onChange={e => handleQuestionChange(idx, 'label5', e.target.value)}
                                                    type="text"
                                                    className="w-full text-sm border-gray-200 rounded-md"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Action */}
                <div className="flex justify-end pt-4 pb-12">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-primary/30 transition-all transform hover:-translate-y-1 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Enregistrer les modifications
                    </button>
                </div>

            </div>
            <Toaster position="bottom-right" />
        </div>
    )
}
