'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2, Send, User, MessageSquare, Activity, CheckCircle, AlertCircle } from 'lucide-react'

function QuestionnaireContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const questionnaireId = searchParams.get('id')

    const [loading, setLoading] = useState(false)
    const [initializing, setInitializing] = useState(true)
    const [pathologyName, setPathologyName] = useState<string>('')
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        question1: '',
        score: 5
    })

    // Vérifier le questionnaire au chargement
    useEffect(() => {
        const checkQuestionnaire = async () => {
            if (!questionnaireId) {
                setInitializing(false)
                return
            }

            try {
                // Récupérer les infos du questionnaire pour afficher le titre/pathologie
                // Note: On suppose ici que la table 'questionnaires' contient le titre ou la pathologie
                const { data, error } = await supabase
                    .from('questionnaires')
                    .select('pathologie, title')
                    .eq('id', questionnaireId)
                    .single()

                if (error) {
                    console.error('Erreur récupération questionnaire:', error)
                    // On ne bloque pas forcément si on ne trouve pas (peut-être supprimé), 
                    // mais c'est mieux d'avoir un ID valide.
                } else if (data) {
                    setPathologyName(data.title || data.pathologie || 'Questionnaire')
                }
            } catch (err) {
                console.error('Erreur:', err)
            } finally {
                setInitializing(false)
            }
        }

        checkQuestionnaire()
    }, [questionnaireId])

    // Gestion des changements dans le formulaire
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    // Soumission finale
    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!questionnaireId) {
            alert("Erreur: Identifiant du questionnaire manquant.")
            return
        }

        setLoading(true)
        setError(null)

        try {
            // 1. Récupérer l'utilisateur actuellement connecté
            const { data: { user }, error: userError } = await supabase.auth.getUser()

            if (userError || !user) {
                setError("Vous devez être connecté pour envoyer le questionnaire. Veuillez vous connecter.")
                // Optionnel : Rediriger vers login avec return url
                return
            }

            // Préparation de l'objet de réponses JSON
            const answers = [
                {
                    questionId: 'q1',
                    question: 'Réponse à la question clé',
                    answer: formData.question1,
                    type: 'text'
                },
                {
                    questionId: 'score',
                    question: "Score d'auto-évaluation",
                    value: Number(formData.score),
                    type: 'scale'
                }
            ]

            // 2. Insérer les données dans la table responses
            const { error } = await supabase
                .from('responses')
                .insert([{
                    questionnaire_id: questionnaireId,
                    user_id: user.id,
                    pathologie: pathologyName || 'Non spécifié', // Fallback si non trouvé
                    answers: answers, // Stocké en JSONB
                    score_total: Number(formData.score),
                    // submitted_at est géré par défaut par la DB
                }])

            if (error) throw error

            // Succès
            alert("Félicitations ! Questionnaire envoyé avec succès.")

            // Redirection
            router.push('/questionnaire/merci')

        } catch (err: any) {
            console.error("Erreur lors de l'envoi :", err.message)
            setError(err.message || "Une erreur est survenue lors de l'envoi.")
        } finally {
            setLoading(false)
        }
    }

    if (initializing) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        )
    }

    if (!questionnaireId) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h1>
                    <p className="text-gray-600">Aucun questionnaire n&apos;a été spécifié. Veuillez vérifier le lien reçu par email.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Finaliser le Questionnaire</h1>
                    {pathologyName && <p className="text-blue-600 font-medium mt-1">{pathologyName}</p>}
                    <p className="text-gray-500 mt-2">Envoyez vos réponses sécurisées</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                <form onSubmit={handleFinalSubmit} className="space-y-6">

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Votre Nom</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    name="nom"
                                    placeholder="Dupont"
                                    value={formData.nom}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Votre Prénom</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    name="prenom"
                                    placeholder="Jean"
                                    value={formData.prenom}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Réponse à la question clé</label>
                            <div className="relative">
                                <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <textarea
                                    name="question1"
                                    placeholder="Votre réponse ici..."
                                    value={formData.question1}
                                    onChange={handleChange}
                                    required
                                    rows={3}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Score d&apos;auto-évaluation (1-10)</label>
                            <div className="relative">
                                <Activity className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <input
                                    type="number"
                                    name="score"
                                    min="1"
                                    max="10"
                                    value={formData.score}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full flex items-center justify-center space-x-2 py-3 rounded-lg text-white font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98] ${loading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                            }`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Envoi en cours...</span>
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                <span>Terminer et envoyer</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default function QuestionnaireFinal() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        }>
            <QuestionnaireContent />
        </Suspense>
    )
}
