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
    tags?: string[] // Added tags
    questions: any[]
}

export default function LibraryPage() {
    const [templates, setTemplates] = useState<PublicTemplate[]>([])
    const [filteredTemplates, setFilteredTemplates] = useState<PublicTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [importingId, setImportingId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    // Derived state for active tag filter (if search starts with #)
    const activeTag = searchQuery.startsWith('#') ? searchQuery.slice(1).toLowerCase() : null
    const [userEmail, setUserEmail] = useState<string | null>(null)

    useEffect(() => {
        fetchPublicTemplates()
        getCurrentUser()
    }, [])

    const getCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
            setUserEmail(user.email)
        }
    }

    // ... (rest of code)

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12">
            <Toaster position="bottom-right" />

            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Library className="w-8 h-8 text-primary" />
                            Bibliothèque de Modèles
                        </h1>
                        <p className="text-gray-600 mt-2 text-lg">
                            Explorez nos questionnaires validés et importez-les en un clic.
                        </p>
                    </div>

                    {/* Admin Access Link - Visible only to specific emails */}
                    {userEmail && ['jeanlucallaa@yahoo.fr', 'admin@medilink.fr', 'jeanluc@podologue-alla.fr'].includes(userEmail) && (
                        <button
                            onClick={() => router.push('/dashboard/library/create')}
                            className="text-sm font-medium text-gray-500 hover:text-primary transition-colors flex items-center gap-1"
                        >
                            + Contribuer
                        </button>
                    )}
                </div>

    useEffect(() => {
                    filterTemplates()
                }, [searchQuery, templates])

    const fetchPublicTemplates = async () => {
        try {
                    setLoading(true)

            // Fetch Templates with Tags
            const {data: templatesData, error: templatesError } = await supabase
                .from('public_templates')
                .select('*')
                .order('name')

                if (templatesError) throw templatesError

            // Normalize questions
            const templatesWithQuestions = templatesData.map((t: any) => ({
                    ...t,
                    // Ensure questions is always an array
                    questions: Array.isArray(t.questions) ? t.questions : []
                // Note: We are assuming JSONB 'questions' column based on migration. 
                // If using join table, logic would be more complex, but migration enforces JSONB.
            }))

                setTemplates(templatesWithQuestions)
                setFilteredTemplates(templatesWithQuestions)
        } catch (error) {
                    console.error('Error fetching library:', error)
                    // Silently fail or show milder toast if needed, but error is useful for debugging
                    // toast.error('Erreur lors du chargement de la bibliothèque') 
                } finally {
                    setLoading(false)
                }
    }

    const filterTemplates = () => {
        if (!searchQuery.trim()) {
                    setFilteredTemplates(templates)
            return
        }

                const query = searchQuery.toLowerCase().trim()

                if (query.startsWith('#')) {
            // Filter by Tag
            const tagToMatch = query.slice(1)
            setFilteredTemplates(templates.filter(t =>
                t.tags && t.tags.some(tag => tag.toLowerCase().includes(tagToMatch))
                ))
        } else {
                    // Filter by Name or Description
                    setFilteredTemplates(templates.filter(t =>
                        t.name.toLowerCase().includes(query) ||
                        (t.description && t.description.toLowerCase().includes(query))
                    ))
                }
    }

    const handleUseTemplate = async (template: PublicTemplate) => {
        try {
                    setImportingId(template.id)
            const {data: {user} } = await supabase.auth.getUser()

                if (!user) {
                    toast.error("Vous devez être connecté")
                return
            }

            // Prepare questions ensuring labels are preserved
            const privateQuestions = template.questions.map(q => {
                if (typeof q === 'string') {
                    return {
                    question: q,
                type: 'scale',
                label1: 'Pas du tout',
                label5: 'Énormément'
                    }
                }
                return {
                    question: q.question || q.text,
                type: 'scale',
                label1: q.label1 || 'Pas du tout',
                label5: q.label5 || 'Énormément'
                }
            })

                const {error} = await supabase
                .from('questionnaire_templates')
                .insert({
                    user_id: user.id,
                name: template.name,
                questions: privateQuestions,
                })

                if (error) throw error

                toast.success("Modèle ajouté à vos questionnaires !")

        } catch (error: any) {
                    console.error('Error importing template:', error)
            toast.error("Erreur lors de l'import : " + error.message)
        } finally {
                    setImportingId(null)
                }
    }

    // Helper for tag colors
    const getTagColor = (tag: string) => {
        const t = tag.toLowerCase()
                if (t.includes('kine')) return 'bg-green-100 text-green-700'
                if (t.includes('podo')) return 'bg-blue-100 text-blue-700'
                if (t.includes('osteo')) return 'bg-purple-100 text-purple-700'
                return 'bg-gray-100 text-gray-700'
    }

                return (
                <div className="min-h-screen bg-gray-50 p-6 md:p-12">
                    <Toaster position="bottom-right" />

                    <div className="max-w-6xl mx-auto space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                    <Library className="w-8 h-8 text-primary" />
                                    Bibliothèque de Modèles
                                </h1>
                                <p className="text-gray-600 mt-2 text-lg">
                                    Explorez nos questionnaires validés et importez-les en un clic.
                                </p>
                            </div>

                            {/* Admin Access Link - Hidden in production ideally, or protected by middleware */}
                            <button
                                onClick={() => router.push('/dashboard/library/create')}
                                className="text-sm font-medium text-gray-500 hover:text-primary transition-colors flex items-center gap-1"
                            >
                                + Contribuer
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="relative max-w-xl">
                            <input
                                type="text"
                                placeholder="Rechercher par nom ou #tag (ex: #kine)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-5 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent text-base"
                            />
                            {activeTag && (
                                <div className="absolute right-3 top-3 px-2 py-0.5 bg-primary/10 text-primary text-xs font-bold rounded-md">
                                    Filtre : #{activeTag}
                                </div>
                            )}
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredTemplates.length === 0 ? (
                                    <div className="col-span-full text-center py-12 text-gray-400">
                                        Aucun modèle trouvé pour cette recherche.
                                    </div>
                                ) : (
                                    filteredTemplates.map((template) => (
                                        <div key={template.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition-shadow">
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{template.name}</h3>
                                                    {/* Tags Display */}
                                                    <div className="flex flex-wrap gap-1 justify-end max-w-[40%]">
                                                        {template.tags?.map(tag => (
                                                            <span key={tag} className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${getTagColor(tag)}`}>
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                <p className="text-gray-500 text-sm mb-4 line-clamp-3">
                                                    {template.description || "Aucune description disponible."}
                                                </p>

                                                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                                                        Aperçu ({template.questions.length} questions) :
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
                                                                + {template.questions.length - 3} autres...
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
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
                )
}
