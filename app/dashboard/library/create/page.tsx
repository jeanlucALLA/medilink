'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Plus, Save, Trash2, Tag, Loader2, Lock } from 'lucide-react'
import { Toaster, toast } from 'react-hot-toast'

// REMPLACEZ PAR VOTRE EMAIL - C'est une sécurité simple côté client/serveur
const ADMIN_EMAILS = ['admin@medilink.fr', 'jeanluc@podologue-alla.fr', 'test@test.fr'] // Ajoutez votre email ici

export default function CreateTemplatePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [authorized, setAuthorized] = useState(false)

    // Form State
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('')
    const [tagsInput, setTagsInput] = useState('')
    const [questions, setQuestions] = useState<any[]>([
        { question: '', type: 'scale', label1: 'Pas du tout', label5: 'Énormément' }
    ])

    useEffect(() => {
        checkAdmin()
    }, [])

    const checkAdmin = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !user.email || !ADMIN_EMAILS.includes(user.email)) {
            // Uncomment to enforce security strictly
            // router.push('/dashboard/library')
            // For now, allow but warn
            // toast.error("Accès réservé aux administrateurs")
            // setAuthorized(false)

            // Allow for development if needed, but strictly:
            // setAuthorized(false)
            // setLoading(false)

            // Let's assume user is admin for demo or check against list
            if (user && (user.email === 'admin@medilink.fr' || true)) { // TRUE FOR DEV - REMOVE IN PROD
                setAuthorized(true)
            }
        } else {
            setAuthorized(true)
        }
        setLoading(false)
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
            // Process tags
            const tags = tagsInput.split(',').map(t => t.trim().replace(/^#/, '')).filter(t => t)

            // 1. Insert into public_templates (Question JSONB for read performance)
            const { data: template, error: tmplError } = await supabase
                .from('public_templates')
                .insert({
                    name,
                    description,
                    category,
                    tags,
                    questions: questions // Stored as JSONB
                })
                .select()
                .single()

            if (tmplError) throw tmplError

            // 2. Insert into public_template_questions (Normalized storage)
            const normalizedQuestions = questions.map(q => ({
                template_id: template.id,
                question: q.question,
                type: q.type,
                label1: q.type === 'scale' ? q.label1 : null,
                label5: q.type === 'scale' ? q.label5 : null
            }))

            const { error: questError } = await supabase
                .from('public_template_questions')
                .insert(normalizedQuestions)

            if (questError) {
                console.error("Warning: Normalized insert failed, but JSONB succeeded", questError)
            }

            toast.success("Modèle publié avec succès !")
            setTimeout(() => router.push('/dashboard/library'), 1500)

        } catch (error: any) {
            console.error('Save error:', error)
            toast.error("Erreur lors de la sauvegarde : " + error.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>

    // Simple access gate
    // if (!authorized) return (
    //     <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
    //         <Lock className="w-16 h-16 text-gray-300 mb-4" />
    //         <h1 className="text-2xl font-bold text-gray-900">Accès Restreint</h1>
    //         <p className="text-gray-500 mt-2">Cette page est réservée aux administrateurs.</p>
    //         <button onClick={() => router.push('/dashboard/library')} className="mt-6 text-primary hover:underline">
    //             Retour à la bibliothèque
    //         </button>
    //     </div>
    // )

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-white rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Créer un Modèle Public</h1>
                        <p className="text-gray-500">Ajoutez un nouveau questionnaire à la bibliothèque partagée.</p>
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
                                value={category} onChange={e => setCategory(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="">Sélectionner...</option>
                                <option value="Podologie">Podologie</option>
                                <option value="Kinésithérapie">Kinésithérapie</option>
                                <option value="Ostéopathie">Ostéopathie</option>
                                <option value="Autre">Autre</option>
                            </select>
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
                        Publier le Modèle
                    </button>
                </div>

            </div>
            <Toaster position="bottom-right" />
        </div>
    )
}
