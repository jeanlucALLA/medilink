'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    Shield,
    Search,
    Filter,
    MoreHorizontal,
    CheckCircle,
    AlertCircle,
    ArrowLeft,
    Users,
    Loader2,
    ChevronDown,
    Bell,
    Send,
    X,
    FileText
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import jsPDF from 'jspdf'

// Mock Data pour le design initial (en attendant que la BDD soit peuplée)
const MOCK_USERS = [
    { id: '1', nom_complet: 'Dr. Sophie Martin', specialite: 'Généraliste', ville: 'Paris', subscription_tier: 'premium', created_at: '2025-09-15T10:00:00Z', satisfaction_score: 4.8 },
    { id: '2', nom_complet: 'Dr. Thomas Dubreuil', specialite: 'Dentiste', ville: 'Lyon', subscription_tier: 'cabinet', created_at: '2025-10-02T14:30:00Z', satisfaction_score: 4.9 },
    { id: '3', nom_complet: 'Mme. Julie Roux', specialite: 'Ostéopathe', ville: 'Bordeaux', subscription_tier: 'discovery', created_at: '2025-11-20T09:15:00Z', satisfaction_score: 4.5 },
    { id: '4', nom_complet: 'Dr. Marc Levy', specialite: 'Cardiologue', ville: 'Nice', subscription_tier: 'premium', created_at: '2025-12-05T16:45:00Z', satisfaction_score: 4.7 },
    { id: '5', nom_complet: 'Cabinet des Lilas', specialite: 'Groupe Médical', ville: 'Paris', subscription_tier: 'cabinet', created_at: '2025-12-10T11:20:00Z', satisfaction_score: 4.2 },
]

export default function AdminDashboard() {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
    const [users, setUsers] = useState<any[]>(MOCK_USERS)
    const [loading, setLoading] = useState(true)
    const [filterCity, setFilterCity] = useState('')
    const [filterSpecialty, setFilterSpecialty] = useState('')

    // États pour l'intéractivité des badges
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [openMenuId, setOpenMenuId] = useState<string | null>(null)
    // États pour les notifications
    const [showNotificationModal, setShowNotificationModal] = useState(false)
    const [notifSubject, setNotifSubject] = useState('')
    const [notifMessage, setNotifMessage] = useState('')
    const [notifTarget, setNotifTarget] = useState<'selection' | 'all'>('selection')
    const [isSending, setIsSending] = useState(false)
    const [sendingProgress, setSendingProgress] = useState(0)

    const router = useRouter()
    const menuRef = useRef<HTMLDivElement>(null)

    // Fermer le menu si on clique ailleurs
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpenMenuId(null)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const { supabase } = await import('@/lib/supabase') as any

                // 1. Vérifier l'utilisateur connecté
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.push('/login')
                    return
                }

                // 2. Vérifier le rôle admin dans la table profiles
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', user.id)
                    .single()

                if (error || !profile?.is_admin) {
                    console.log('Accès refusé : utilisateur non admin')
                    router.push('/dashboard') // Redirection si pas admin
                    return
                }

                setIsAdmin(true)

                // 3. Charger les vrais utilisateurs
                const { data: realUsers } = await supabase
                    .from('profiles')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (realUsers && realUsers.length > 0) {
                    setUsers(realUsers)
                }

                setLoading(false)

            } catch (err) {
                console.error('Erreur vérification admin:', err)
                router.push('/dashboard')
            }
        }

        checkAdmin()
    }, [router])

    const handleUpdateSubscription = async (userId: string, newTier: string) => {
        setUpdatingId(userId)
        setOpenMenuId(null)

        try {
            const { supabase } = await import('@/lib/supabase') as any

            // Mise à jour Supabase
            const { error } = await supabase
                .from('profiles')
                .update({ subscription_tier: newTier })
                .eq('id', userId)

            if (error) throw error

            // Mise à jour locale optimiste
            setUsers(users.map(u => u.id === userId ? { ...u, subscription_tier: newTier } : u))
            toast.success('Abonnement mis à jour avec succès')

        } catch (error) {
            console.error('Erreur update:', error)
            toast.error('Erreur lors de la mise à jour')
        } finally {
            setUpdatingId(null)
        }
    }

    // Filtrage
    const filteredUsers = users.filter(user => {
        const matchCity = filterCity === '' || (user.city || user.ville || '').toLowerCase().includes(filterCity.toLowerCase())
        const matchSpecialty = filterSpecialty === '' || (user.specialty || user.specialite || '').toLowerCase().includes(filterSpecialty.toLowerCase())
        return matchCity && matchSpecialty
    })

    const handleSendNotification = async () => {
        if (!notifSubject || !notifMessage) {
            toast.error('Veuillez remplir le sujet et le message')
            return
        }

        const recipients = notifTarget === 'selection' ? filteredUsers : users

        setIsSending(true)
        setSendingProgress(0)

        // Simulation d'envoi
        const total = recipients.length

        // Si peu de destinataires, c'est instantané
        if (total < 50) {
            await new Promise(resolve => setTimeout(resolve, 1500))
        } else {
            // Simulation progression
            for (let i = 0; i <= 100; i += 10) {
                setSendingProgress(i)
                await new Promise(resolve => setTimeout(resolve, 200))
            }
        }

        // TODO: Implémenter le vrai appel API/Supabase ici
        // await supabase.from('notifications').insert(...)

        toast.success(`Notification envoyée à ${total} praticien(s)`)
        setIsSending(false)
        setShowNotificationModal(false)
        setNotifSubject('')
        setNotifMessage('')
        setSendingProgress(0)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    const generateReport = () => {
        const doc = new jsPDF()
        const today = new Date()
        const month = today.toLocaleString('fr-FR', { month: 'long' })
        const year = today.getFullYear()

        // 1. Calcul des stats
        const totalUsers = users.length
        const premiumCount = users.filter(u => u.subscription_tier === 'premium').length
        const cabinetCount = users.filter(u => u.subscription_tier === 'cabinet').length
        const discoveryCount = users.filter(u => !u.subscription_tier || u.subscription_tier === 'discovery').length

        const mrr = (premiumCount * 9.99) + (cabinetCount * 39.99)
        const avgScore = users.reduce((acc, curr) => acc + (curr.satisfaction_score || 0), 0) / (totalUsers || 1)

        // Top Villes
        const cities: { [key: string]: number } = {}
        users.forEach(u => {
            const city = u.city || u.ville || 'Non renseigné'
            cities[city] = (cities[city] || 0) + 1
        })
        const topCities = Object.entries(cities).sort((a, b) => b[1] - a[1]).slice(0, 3)

        // Top Spécialités
        const specialties: { [key: string]: number } = {}
        users.forEach(u => {
            const spec = u.specialty || u.specialite || 'Non renseigné'
            specialties[spec] = (specialties[spec] || 0) + 1
        })
        const topSpecialties = Object.entries(specialties).sort((a, b) => b[1] - a[1]).slice(0, 3)

        // 2. Génération PDF
        // Header
        doc.setFillColor(0, 82, 255) // Primary Blue
        doc.rect(0, 0, 210, 40, 'F')

        doc.setTextColor(255, 255, 255)
        doc.setFontSize(24)
        doc.setFont('helvetica', 'bold')
        doc.text('MEDI.LINK', 20, 25)

        doc.setFontSize(14)
        doc.setFont('helvetica', 'normal')
        doc.text(`Rapport Mensuel - ${month} ${year}`, 20, 35)

        // Résumé Exécutif
        doc.setTextColor(50, 50, 50)
        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.text('Résumé Exécutif', 20, 60)

        doc.setFontSize(12)
        doc.setFont('helvetica', 'normal')
        doc.text(`Praticiens actifs : ${totalUsers}`, 20, 75)
        doc.text(`Score de satisfaction moyen : ${avgScore.toFixed(1)}/5`, 20, 85)

        // Performance Financière (MRR)
        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.text('Performance Financière', 20, 110)

        doc.setFontSize(14)
        doc.text(`MRR Estimé : ${mrr.toFixed(2)} €`, 20, 125)

        // Graphique Répartition (Barres simplifiées)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'normal')

        // Premium
        doc.text('Premium', 20, 145)
        doc.setFillColor(0, 82, 255)
        doc.rect(50, 140, premiumCount * 5, 5, 'F') // Échelle arbitraire
        doc.text(`${premiumCount}`, 55 + (premiumCount * 5), 145)

        // Cabinet
        doc.text('Cabinet', 20, 155)
        doc.setFillColor(128, 0, 128) // Purple
        doc.rect(50, 150, cabinetCount * 5, 5, 'F')
        doc.text(`${cabinetCount}`, 55 + (cabinetCount * 5), 155)

        // Découverte
        doc.text('Gratuit', 20, 165)
        doc.setFillColor(200, 200, 200) // Gray
        doc.rect(50, 160, discoveryCount * 5, 5, 'F')
        doc.text(`${discoveryCount}`, 55 + (discoveryCount * 5), 165)

        // Top Secteurs
        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(50, 50, 50)
        doc.text('Top Secteurs & Spécialités', 20, 190)

        // Colonne Villes
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Villes', 20, 205)
        doc.setFont('helvetica', 'normal')
        topCities.forEach((city, index) => {
            doc.text(`${index + 1}. ${city[0]} (${city[1]})`, 20, 215 + (index * 10))
        })

        // Colonne Spécialités
        doc.setFont('helvetica', 'bold')
        doc.text('Spécialités', 100, 205)
        doc.setFont('helvetica', 'normal')
        topSpecialties.forEach((spec, index) => {
            doc.text(`${index + 1}. ${spec[0]} (${spec[1]})`, 100, 215 + (index * 10))
        })

        // Footer
        doc.setFontSize(10)
        doc.setTextColor(150, 150, 150)
        doc.text('Généré automatiquement par Medi.Link Admin', 20, 280)

        doc.save(`MediLink_Rapport_${month}_${year}.pdf`)
    }

    if (!isAdmin) return null // Précaution supplémentaire

    const targetCount = notifTarget === 'selection' ? filteredUsers.length : users.length

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans relative">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Link href="/dashboard" className="p-2 rounded-full bg-white text-gray-400 hover:text-gray-900 shadow-sm border border-gray-100 transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                                <Shield className="w-8 h-8 text-primary" />
                                Administration
                            </h1>
                        </div>
                        <p className="text-gray-500">Gérez les utilisateurs et supervisez l'activité de la plateforme.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={generateReport}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                        >
                            <FileText className="w-4 h-4 text-gray-500" />
                            Générer Rapport
                        </button>

                        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="px-4 py-2 bg-blue-50 text-primary rounded-xl font-bold text-sm">
                                {users.length} Praticiens
                            </div>
                            <div className="px-4 py-2 bg-green-50 text-green-700 rounded-xl font-bold text-sm flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Système opérationnel
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters & Actions */}
                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex items-center gap-2 text-gray-400">
                        <Filter className="w-5 h-5" />
                        <span className="font-medium hidden md:inline">Filtres :</span>
                    </div>

                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Filtrer par Ville..."
                            value={filterCity}
                            onChange={(e) => setFilterCity(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50/50"
                        />
                    </div>
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Filtrer par Spécialité..."
                            value={filterSpecialty}
                            onChange={(e) => setFilterSpecialty(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50/50"
                        />
                    </div>

                    <div className="w-full md:w-auto">
                        <button
                            onClick={() => setShowNotificationModal(true)}
                            className="w-full md:w-auto px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-900/10"
                        >
                            <Bell className="w-4 h-4" />
                            Envoyer une notification
                        </button>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-visible"> {/* overflow-visible pour le popover */}
                    <div className="overflow-x-auto overflow-y-visible">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                    <th className="px-8 py-6">Praticien</th>
                                    <th className="px-6 py-6">Spécialité</th>
                                    <th className="px-6 py-6">Ville</th>
                                    <th className="px-6 py-6">Abonnement</th>
                                    <th className="px-6 py-6">Inscription</th>
                                    <th className="px-6 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm">
                                                        {user.nom_complet?.charAt(0) || 'U'}
                                                    </div>
                                                    <span className="font-bold text-gray-900">{user.nom_complet}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-gray-600 font-medium">{user.specialty || user.specialite || '—'}</td>
                                            <td className="px-6 py-5 text-gray-500">{user.city || user.ville || '—'}</td>
                                            <td className="px-6 py-5">
                                                <div className="relative inline-block">
                                                    <button
                                                        onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer hover:shadow-sm ring-1 ring-inset ${user.subscription_tier === 'premium' ? 'bg-blue-50 text-blue-700 ring-blue-700/10 hover:bg-blue-100' :
                                                            user.subscription_tier === 'cabinet' ? 'bg-purple-50 text-purple-700 ring-purple-700/10 hover:bg-purple-100' :
                                                                'bg-gray-50 text-gray-600 ring-gray-600/10 hover:bg-gray-100'
                                                            }`}
                                                    >
                                                        {updatingId === user.id ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            <>
                                                                {user.subscription_tier === 'premium' ? 'Premium' :
                                                                    user.subscription_tier === 'cabinet' ? 'Cabinet' : 'Découverte'}
                                                                <ChevronDown className="w-3 h-3 opacity-50" />
                                                            </>
                                                        )}
                                                    </button>

                                                    {/* Popover Menu */}
                                                    {openMenuId === user.id && (
                                                        <div
                                                            ref={menuRef}
                                                            className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                                                        >
                                                            <div className="p-1">
                                                                <button
                                                                    onClick={() => handleUpdateSubscription(user.id, 'premium')}
                                                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors flex items-center justify-between group/item"
                                                                >
                                                                    Passer en Premium
                                                                    <span className="text-xs font-medium text-gray-400 group-hover/item:text-blue-500">9,99€</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateSubscription(user.id, 'cabinet')}
                                                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors flex items-center justify-between group/item"
                                                                >
                                                                    Passer en Cabinet
                                                                    <span className="text-xs font-medium text-gray-400 group-hover/item:text-purple-500">39,99€</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-gray-400 text-sm">
                                                {new Date(user.created_at).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button className="text-gray-400 hover:text-primary transition-colors flex items-center justify-end gap-1 ml-auto font-medium text-sm group-hover:visible">
                                                    <span>Détails</span>
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    Score: <span className="text-gray-900 font-bold">{user.satisfaction_score}</span>/5
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-12 text-center text-gray-500">
                                            Aucun praticien ne correspond à votre recherche
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Notification Modal */}
                {showNotificationModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-primary" />
                                    Nouvelle Notification
                                </h2>
                                <button
                                    onClick={() => setShowNotificationModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Cible */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Destinataires</label>
                                    <div className="flex bg-gray-100 p-1 rounded-xl">
                                        <button
                                            onClick={() => setNotifTarget('selection')}
                                            className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all ${notifTarget === 'selection'
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-900'
                                                }`}
                                        >
                                            Sélection actuelle ({filteredUsers.length})
                                        </button>
                                        <button
                                            onClick={() => setNotifTarget('all')}
                                            className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all ${notifTarget === 'all'
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-900'
                                                }`}
                                        >
                                            Tous les praticiens ({users.length})
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2 ml-1">
                                        {notifTarget === 'selection'
                                            ? `Cible les comptes correspondants aux filtres : ${filterCity ? `Ville "${filterCity}"` : ''} ${filterCity && filterSpecialty ? 'et' : ''} ${filterSpecialty ? `Spécialité "${filterSpecialty}"` : ''} ${!filterCity && !filterSpecialty ? 'Aucun filtre (Tous)' : ''}`
                                            : "Cible l'intégralité de la base de données."
                                        }
                                    </p>
                                </div>

                                {/* Sujet */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
                                    <input
                                        type="text"
                                        value={notifSubject}
                                        onChange={(e) => setNotifSubject(e.target.value)}
                                        placeholder="Ex: Maintenance programmée..."
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                    <textarea
                                        value={notifMessage}
                                        onChange={(e) => setNotifMessage(e.target.value)}
                                        placeholder="Votre message ici..."
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                                    />
                                </div>

                                {/* Progress Bar */}
                                {isSending && targetCount > 50 && (
                                    <div className="mt-4">
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>Envoi en cours...</span>
                                            <span>{sendingProgress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-primary h-full transition-all duration-300 ease-out"
                                                style={{ width: `${sendingProgress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowNotificationModal(false)}
                                    disabled={isSending}
                                    className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSendNotification}
                                    disabled={isSending || !notifSubject || !notifMessage}
                                    className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Envoi...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Envoyer
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
