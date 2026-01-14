'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    Inbox,
    MessageSquare,
    Search,
    Filter,
    CheckCircle,
    Clock,
    Send,
    X,
    User,
    Mail,
    Loader2
} from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function AdminMessagesPage() {
    const [tickets, setTickets] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed'>('all')
    const [searchTerm, setSearchTerm] = useState('')

    // États pour le modal de réponse
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null)
    const [responseText, setResponseText] = useState('')
    const [sending, setSending] = useState(false)

    const router = useRouter()

    useEffect(() => {
        const checkAdminAndLoadTickets = async () => {
            try {
                const { supabase } = await import('@/lib/supabase') as any

                // 1. Vérification Admin (Similaire à admin/page.tsx)
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.push('/login')
                    return
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', user.id)
                    .single()

                if (!profile?.is_admin) {
                    router.push('/dashboard')
                    return
                }

                // 2. Chargement des tickets
                loadTickets(supabase)

            } catch (err) {
                console.error('Erreur:', err)
                setLoading(false)
            }
        }

        checkAdminAndLoadTickets()
    }, [router])

    const loadTickets = async (supabase: any) => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('support_messages')
                .select(`
                    *,
                    profiles:user_id (
                        full_name,
                        email,
                        nom_complet
                    )
                `)
                .order('created_at', { ascending: false })

            if (error) throw error

            setTickets(data || [])
        } catch (err) {
            console.error('Erreur chargement tickets:', err)
            toast.error('Impossible de charger les messages')
        } finally {
            setLoading(false)
        }
    }

    const handleReply = async () => {
        if (!selectedTicket || !responseText.trim()) return

        setSending(true)
        try {
            const { supabase } = await import('@/lib/supabase') as any

            // 1. Mettre à jour le ticket
            const { error: updateError } = await supabase
                .from('support_messages')
                .update({
                    admin_response: responseText,
                    status: 'closed',
                    responded_at: new Date().toISOString()
                })
                .eq('id', selectedTicket.id)

            if (updateError) throw updateError

            // 2. (Optionnel) Envoyer un email de notification via API
            // Pour l'instant on se contente de la mise à jour base de données
            // car l'utilisateur verra la réponse dans son interface (future feature)

            toast.success('Réponse envoyée et ticket clôturé !')

            // Mise à jour locale
            setTickets(prev => prev.map(t =>
                t.id === selectedTicket.id
                    ? { ...t, status: 'closed', admin_response: responseText, responded_at: new Date().toISOString() }
                    : t
            ))

            closeModal()

        } catch (err) {
            console.error('Erreur réponse:', err)
            toast.error("Erreur lors de l'envoi de la réponse")
        } finally {
            setSending(false)
        }
    }

    const closeModal = () => {
        setSelectedTicket(null)
        setResponseText('')
    }

    const openReplyModal = (ticket: any) => {
        setSelectedTicket(ticket)
        // Si déjà répondu, on peut pré-remplir ou laisser vide pour correction
        setResponseText(ticket.admin_response || '')
    }

    // Filtrage
    const filteredTickets = tickets.filter(ticket => {
        const matchStatus = filterStatus === 'all' || ticket.status === filterStatus
        const searchLower = searchTerm.toLowerCase()
        const userName = ticket.profiles?.full_name || ticket.profiles?.nom_complet || 'Utilisateur'
        const userEmail = ticket.profiles?.email || ''
        const matchSearch =
            ticket.subject.toLowerCase().includes(searchLower) ||
            ticket.message.toLowerCase().includes(searchLower) ||
            userName.toLowerCase().includes(searchLower) ||
            userEmail.toLowerCase().includes(searchLower)

        return matchStatus && matchSearch
    })

    const openCount = tickets.filter(t => t.status === 'open').length

    return (
        <div className="min-h-screen bg-gray-50/50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <Link
                            href="/admin"
                            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors mb-2"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Retour au Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <span className="p-2 bg-blue-100 rounded-xl text-primary">
                                <Inbox className="w-6 h-6" />
                            </span>
                            Messagerie Support
                        </h1>
                        <p className="text-gray-500">
                            Gérez les demandes de support et répondez aux utilisateurs.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <div className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 shadow-sm flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${openCount > 0 ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
                            {openCount} ticket(s) en attente
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher par sujet, message ou utilisateur..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50/50"
                        />
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Tous
                        </button>
                        <button
                            onClick={() => setFilterStatus('open')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${filterStatus === 'open' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            <Clock className="w-3 h-3" />
                            En attente
                        </button>
                        <button
                            onClick={() => setFilterStatus('closed')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${filterStatus === 'closed' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            <CheckCircle className="w-3 h-3" />
                            traités
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="p-12 flex justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : filteredTickets.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Utilisateur</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Sujet</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredTickets.map((ticket) => (
                                        <tr key={ticket.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                {ticket.status === 'open' ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                                                        En attente
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                        Traité
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                        {(ticket.profiles?.full_name?.[0] || ticket.profiles?.nom_complet?.[0] || ticket.profiles?.email?.[0] || 'U').toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{ticket.profiles?.full_name || ticket.profiles?.nom_complet || 'Utilisateur inconnu'}</div>
                                                        <div className="text-xs text-gray-400">{ticket.profiles?.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{ticket.subject}</div>
                                                <div className="text-sm text-gray-500 line-clamp-1">{ticket.message}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
                                                <span className="text-xs text-gray-400 block">
                                                    {new Date(ticket.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => openReplyModal(ticket)}
                                                    className="text-primary hover:text-primary-dark font-medium text-sm hover:underline"
                                                >
                                                    {ticket.status === 'open' ? 'Répondre' : 'Voir / Modifier'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center text-gray-500 flex flex-col items-center">
                            <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
                            <p className="text-lg font-medium">Aucun message trouvé</p>
                            <p className="text-sm">Essayez de modifier vos filtres de recherche.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Reply Modal */}
            {selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-primary" />
                                    Gestion du ticket #{selectedTicket.id.slice(0, 8)}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    De : {selectedTicket.profiles?.full_name || selectedTicket.profiles?.nom_complet}
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Original Message */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-semibold text-gray-700">{selectedTicket.subject}</span>
                                    <span className="text-xs text-gray-400">{new Date(selectedTicket.created_at).toLocaleString('fr-FR')}</span>
                                </div>
                                <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">
                                    {selectedTicket.message}
                                </p>
                            </div>

                            {/* Response Area */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Votre réponse
                                </label>
                                <textarea
                                    value={responseText}
                                    onChange={(e) => setResponseText(e.target.value)}
                                    rows={6}
                                    placeholder="Écrivez votre réponse ici..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                                />
                                <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                    L&apos;envoi de la réponse clôturera automatiquement le ticket.
                                </p>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={closeModal}
                                disabled={sending}
                                className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleReply}
                                disabled={sending || !responseText.trim()}
                                className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {sending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Envoi...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Envoyer la réponse
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
