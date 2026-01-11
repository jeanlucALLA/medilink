'use client'

import { useState } from 'react'
import { Send, MessageSquare, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

export default function ContactPage() {
    const [subject, setSubject] = useState('Problème technique')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setSuccess(false)

        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser()

            if (authError || !user) {
                toast.error("Erreur d'authentification. Veuillez vous reconnecter.")
                setLoading(false)
                return
            }

            const { error } = await supabase
                .from('support_tickets')
                .insert([
                    {
                        user_id: user.id,
                        subject: subject,
                        message: message,
                        status: 'open' // Default status
                    }
                ])

            if (error) {
                console.error('Erreur envoi ticket:', error)
                toast.error("Erreur lors de l'envoi du message.")
            } else {
                setSuccess(true)
                setMessage('')
                setSubject('Problème technique')
                toast.success("Message envoyé ! Nous vous répondrons sous 24h.")
            }
        } catch (err) {
            console.error('Erreur inattendue:', err)
            toast.error("Une erreur inattendue est survenue.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-primary">
                        <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Contacter le Support</h1>
                        <p className="text-gray-500">Une question ? Un problème ? Nous sommes là pour vous aider.</p>
                    </div>
                </div>

                {success ? (
                    <div className="bg-green-50 rounded-2xl p-6 text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Message envoyé !</h3>
                        <p className="text-gray-600 mb-6">
                            Nous avons bien reçu votre demande. Notre équipe vous répondra dans les plus brefs délais (généralement sous 24h).
                        </p>
                        <button
                            onClick={() => setSuccess(false)}
                            className="px-6 py-2 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Envoyer un autre message
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                                Objet de la demande
                            </label>
                            <div className="relative">
                                <select
                                    id="subject"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none bg-gray-50/50"
                                    required
                                >
                                    <option value="Problème technique">Problème technique</option>
                                    <option value="Facturation">Facturation</option>
                                    <option value="Question générale">Question générale</option>
                                    <option value="Autre">Autre</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                                Votre message
                            </label>
                            <textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={6}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none bg-gray-50/50"
                                placeholder="Décrivez votre problème ou posez votre question ici..."
                                required
                                minLength={10}
                            />
                            <p className="mt-2 text-xs text-gray-400 text-right">Minimum 10 caractères</p>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading || message.length < 10}
                                className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Envoi en cours...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        Envoyer le message
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Besoin d&apos;une réponse immédiate ?</h4>
                    <p className="text-sm text-gray-600">
                        Consultez notre <a href="#" className="text-primary hover:underline font-medium">FAQ</a> ou visitez le <a href="/dashboard/resolution" className="text-primary hover:underline font-medium">Centre de Résolution</a> pour trouver des solutions aux problèmes courants.
                    </p>
                </div>
            </div>
        </div>
    )
}
