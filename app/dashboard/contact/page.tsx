'use client'

import { useState, useEffect } from 'react'
import { Send, MessageSquare, CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronUp, Clock, Mail, Paperclip, X, Image, HelpCircle, History } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

interface SupportMessage {
    id: string
    subject: string
    message: string
    status: 'open' | 'replied' | 'closed'
    created_at: string
    admin_response?: string
    responded_at?: string
}

// FAQ Data
const faqItems = [
    {
        question: "Comment envoyer un questionnaire à plusieurs patients ?",
        answer: "Dans la page Questionnaire, entrez les emails des patients séparés par des virgules ou un par ligne. Un questionnaire unique sera généré pour chaque patient."
    },
    {
        question: "Comment programmer l'envoi d'un questionnaire ?",
        answer: "Désactivez le toggle 'Envoyer immédiatement' puis choisissez le délai en jours. Le système enverra automatiquement l'email à la date prévue."
    },
    {
        question: "Où voir les réponses des patients ?",
        answer: "Allez dans le Centre de Résolution pour voir toutes les réponses. Vous pouvez filtrer par statut et rechercher par pathologie."
    },
    {
        question: "Comment modifier mon abonnement ?",
        answer: "Rendez-vous dans Paramètres > Abonnement. Vous pouvez changer de formule ou gérer votre facturation depuis le portail Stripe."
    }
]

export default function ContactPage() {
    const [subject, setSubject] = useState('Problème technique')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [activeTab, setActiveTab] = useState<'new' | 'history'>('new')
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

    // Historique
    const [previousMessages, setPreviousMessages] = useState<SupportMessage[]>([])
    const [loadingHistory, setLoadingHistory] = useState(false)

    // Pièce jointe
    const [attachment, setAttachment] = useState<File | null>(null)
    const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null)

    // Charger l'historique
    useEffect(() => {
        const loadHistory = async () => {
            setLoadingHistory(true)
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const { data, error } = await supabase
                    .from('support_messages')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(10)

                if (!error && data) {
                    setPreviousMessages(data)
                }
            } catch (err) {
                console.error('Erreur chargement historique:', err)
            } finally {
                setLoadingHistory(false)
            }
        }

        loadHistory()
    }, [success])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Le fichier est trop volumineux (max 5 Mo)')
                return
            }
            setAttachment(file)

            // Preview pour les images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader()
                reader.onload = (e) => setAttachmentPreview(e.target?.result as string)
                reader.readAsDataURL(file)
            } else {
                setAttachmentPreview(null)
            }
        }
    }

    const removeAttachment = () => {
        setAttachment(null)
        setAttachmentPreview(null)
    }

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

            // Upload attachment if exists
            let attachmentUrl = null
            if (attachment) {
                const fileExt = attachment.name.split('.').pop()
                const fileName = `${user.id}/${Date.now()}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('support-attachments')
                    .upload(fileName, attachment)

                if (!uploadError) {
                    const { data: urlData } = supabase.storage
                        .from('support-attachments')
                        .getPublicUrl(fileName)
                    attachmentUrl = urlData?.publicUrl
                }
            }

            const { error } = await supabase
                .from('support_messages')
                .insert([
                    {
                        user_id: user.id,
                        subject: subject,
                        message: message,
                        status: 'open',
                        attachment_url: attachmentUrl
                    }
                ])

            if (error) {
                console.error('Erreur envoi ticket:', error)
                toast.error("Erreur lors de l'envoi du message.")
            } else {
                setSuccess(true)
                setMessage('')
                setSubject('Problème technique')
                setAttachment(null)
                setAttachmentPreview(null)
                toast.success("Message envoyé ! Nous vous répondrons sous 24h.")
            }
        } catch (err) {
            console.error('Erreur inattendue:', err)
            toast.error("Une erreur inattendue est survenue.")
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open':
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">En attente</span>
            case 'replied':
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Répondu</span>
            case 'closed':
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Fermé</span>
            default:
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">{status}</span>
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header avec onglets */}
            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-primary">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Contacter le Support</h1>
                            <p className="text-gray-500">Une question ? Un problème ? Nous sommes là pour vous aider.</p>
                        </div>
                    </div>
                </div>

                {/* Onglets */}
                <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('new')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'new'
                            ? 'bg-white text-primary shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        <Send className="w-4 h-4" />
                        Nouveau message
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'history'
                            ? 'bg-white text-primary shadow-sm'
                            : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        <History className="w-4 h-4" />
                        Mes demandes
                        {previousMessages.length > 0 && (
                            <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                                {previousMessages.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {activeTab === 'new' ? (
                <>
                    {/* FAQ Section */}
                    <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-4">
                            <HelpCircle className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-semibold text-gray-900">Questions fréquentes</h2>
                        </div>
                        <div className="space-y-2">
                            {faqItems.map((faq, index) => (
                                <div key={index} className="border border-gray-100 rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                                    >
                                        <span className="font-medium text-gray-900">{faq.question}</span>
                                        {openFaqIndex === index ? (
                                            <ChevronUp className="w-5 h-5 text-gray-400" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                        )}
                                    </button>
                                    {openFaqIndex === index && (
                                        <div className="px-4 py-3 bg-gray-50 text-sm text-gray-600 border-t border-gray-100">
                                            {faq.answer}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Formulaire */}
                    <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100">
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
                                        rows={5}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none bg-gray-50/50"
                                        placeholder="Décrivez votre problème ou posez votre question ici..."
                                        required
                                        minLength={10}
                                    />
                                    <p className="mt-2 text-xs text-gray-400 text-right">Minimum 10 caractères</p>
                                </div>

                                {/* Pièce jointe */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Pièce jointe (optionnel)
                                    </label>
                                    {attachment ? (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                            {attachmentPreview ? (
                                                <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={attachmentPreview} alt="Aperçu" className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                                    <Paperclip className="w-5 h-5 text-gray-500" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                                                <p className="text-xs text-gray-500">{(attachment.size / 1024).toFixed(1)} Ko</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={removeAttachment}
                                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                            >
                                                <X className="w-4 h-4 text-gray-500" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                                            <Paperclip className="w-5 h-5 text-gray-400" />
                                            <span className="text-sm text-gray-500">Joindre une capture d&apos;écran (max 5 Mo)</span>
                                            <input
                                                type="file"
                                                accept="image/*,.pdf"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
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
                </>
            ) : (
                /* Historique des demandes */
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Historique de vos demandes</h2>

                    {loadingHistory ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : previousMessages.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>Aucune demande précédente</p>
                            <button
                                onClick={() => setActiveTab('new')}
                                className="mt-4 text-primary hover:underline font-medium"
                            >
                                Envoyer votre première demande
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {previousMessages.map((msg) => (
                                <div key={msg.id} className="border border-gray-100 rounded-xl overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium text-gray-900">{msg.subject}</span>
                                            {getStatusBadge(msg.status)}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Clock className="w-4 h-4" />
                                            {formatDate(msg.created_at)}
                                        </div>
                                    </div>
                                    <div className="px-4 py-3">
                                        <p className="text-sm text-gray-600 mb-3">{msg.message}</p>
                                        {msg.admin_response && (
                                            <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
                                                <div className="flex items-center gap-2 text-sm font-medium text-green-800 mb-1">
                                                    <CheckCircle className="w-4 h-4" />
                                                    Réponse du support
                                                </div>
                                                <p className="text-sm text-green-700">{msg.admin_response}</p>
                                                {msg.responded_at && (
                                                    <p className="text-xs text-green-600 mt-2">{formatDate(msg.responded_at)}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
