'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Library, CheckCircle, Copy, Loader2, ArrowRight } from 'lucide-react'
import { Toaster, toast } from 'react-hot-toast'

interface PublicTemplate {
    id: string
    name: string
    description?: string
    category?: string
    questions: any[] // Can be joined or JSONB, we will handle both
}

export default function LibraryPage() {
    const [templates, setTemplates] = useState<PublicTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [importingId, setImportingId] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        fetchPublicTemplates()
    }, [])

    const fetchPublicTemplates = async () => {
        try {
            setLoading(true)

            // 1. Fetch Templates
            const { data: templatesData, error: templatesError } = await supabase
                .from('public_templates')
                .select('*')
                .order('name')

            if (templatesError) throw templatesError

            // 2. Fetch Questions (assuming normalized structure initially)
            // Check if questions are already in template (JSONB) or in separate table
            // We'll try to fetch questions for these templates

            const templatesWithQuestions = await Promise.all(templatesData.map(async (t: any) => {
                // If questions are already a column (JSONB strategy), use it
                if (t.questions && Array.isArray(t.questions)) {
                    return t
                }

                // Otherwise, fetch from public_template_questions
                const { data: questionsData, error: qError } = await supabase
                    .from('public_template_questions')
                    .select('question, type, label1, label5') // Adjust based on schema
                    .eq('template_id', t.id)
                    .order('id') // Assumption: id or order column

                if (qError) {
                    console.warn(`Could not fetch questions for template ${t.id}`, qError)
                    return { ...t, questions: [] }
                }

                return {
                    ...t,
                    questions: questionsData?.map(q => q.question) || [] // Flatten to simple strings for now if that's what we use
                }
            }))

            setTemplates(templatesWithQuestions)
        } catch (error) {
            console.error('Error fetching library:', error)
            toast.error('Erreur lors du chargement de la bibliothèque')
        } finally {
            setLoading(false)
        }
    }

    const handleUseTemplate = async (template: PublicTemplate) => {
        try {
            setImportingId(template.id)
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                toast.error("Vous devez être connecté")
                return
            }

            // Prepare questions data for private `questionnaire_templates` (JSONB)
            // Ensure we have a valid array of objects or strings.
            // Private table expects JSONB array of objects usually: { question: string, type: string, ... }

            const privateQuestions = template.questions.map(q => {
                if (typeof q === 'string') {
                    return {
                        question: q,
                        type: 'scale', // Force scale as per requirement " formulations positives" check
                        label1: 'Pas du tout',
                        label5: 'Énormément'
                    }
                }
                return {
                    question: q.question || q.text,
                    type: 'scale',
                    label1: q.label1 || 'Pas du tout', // Fallback
                    label5: q.label5 || 'Énormément'
                }
            })

            // Insert into user's private library
            const { error } = await supabase
                .from('questionnaire_templates')
                .insert({
                    user_id: user.id,
                    name: template.name, // Keep original name
                    questions: privateQuestions,
                })

            if (error) throw error

            toast.success("Modèle ajouté à vos questionnaires !")

            // Optional: Redirect to Create Questionnaire page with this template pre-selected?
            // For now, just success message is safer, user can go to "Nouveau" manually.

        } catch (error: any) {
            console.error('Error importing template:', error)
            toast.error("Erreur lors de l'import : " + error.message)
        } finally {
            setImportingId(null)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12">
            <Toaster position="bottom-right" />

            <div className="max-w-6xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Library className="w-8 h-8 text-primary" />
                        Bibliothèque de Modèles
                    </h1>
                    <p className="text-gray-600 mt-2 text-lg">
                        Explorez nos questionnaires validés par des experts et utilisez-les pour vos patients.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map((template) => (
                            <div key={template.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition-shadow">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{template.name}</h3>
                                    {template.category && (
                                        <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full mb-3">
                                            {template.category}
                                        </span>
                                    )}
                                    <p className="text-gray-500 text-sm mb-4 line-clamp-3">
                                        {template.description || "Aucune description disponible."}
                                    </p>

                                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                                            Aperçu des questions :
                                        </p>
                                        <ul className="space-y-1">
                                            {template.questions.slice(0, 3).map((q, idx) => (
                                                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                                    <span className="text-primary mt-1">•</span>
                                                    <span className="line-clamp-1">
                                                        {typeof q === 'string' ? q : (q.question || q.text || "Question sans titre")}
                                                    </span>
                                                </li>
                                            ))}
                                            {template.questions.length > 3 && (
                                                <li className="text-xs text-gray-400 pl-4 italic">
                                                    + {template.questions.length - 3} autres questions...
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => handleUseTemplate(template)}
                                        disabled={importingId === template.id}
                                        className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {importingId === template.id ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                <span>Importation...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-5 h-5" />
                                                <span>Utiliser ce modèle</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
