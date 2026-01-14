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
    FileText,
    Mail,
    Inbox
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import jsPDF from 'jspdf'

export default function AdminDashboard() {
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
    const [users, setUsers] = useState<any[]>([])
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

    // États pour le modal d'email personnalisé (Inviter/Contacter)
    const [showEmailModal, setShowEmailModal] = useState(false)
    const [emailTarget, setEmailTarget] = useState('')
    const [emailSubject, setEmailSubject] = useState('')
    const [emailBody, setEmailBody] = useState('')
    const [isSendingEmail, setIsSendingEmail] = useState(false)

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
        if (!isAdmin) return

        let channel: any

        const setupRealtime = async () => {
            const { supabase } = await import('@/lib/supabase') as any

            channel = supabase
                .channel('admin-dashboard-users')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'profiles'
                    },
                    (payload: any) => {
                        console.log('Realtime change:', payload)

                        if (payload.eventType === 'INSERT') {
                            const newProfile = payload.new
                            // On ajoute le nouveau profil en haut de la liste
                            setUsers(prev => [newProfile, ...prev])
                            toast.success(`🎉 Nouveau praticien : ${newProfile.nom_complet || 'Inconnu'}`)
                        }
                        else if (payload.eventType === 'UPDATE') {
                            const updatedProfile = payload.new
                            setUsers(prev => prev.map(u => u.id === updatedProfile.id ? { ...u, ...updatedProfile } : u))
                        }
                    }
                )
                .subscribe()
        }

        setupRealtime()

        return () => {
            if (channel) {
                import('@/lib/supabase').then(({ supabase }: any) => {
                    supabase.removeChannel(channel)
                })
            }
        }
    }, [isAdmin])

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

                // Get session for API call
                const { data: { session } } = await supabase.auth.getSession()

                // 3. Charger les utilisateurs VIA API (pour avoir les emails)
                const response = await fetch('/api/admin/users', {
                    headers: {
                        'Authorization': `Bearer ${session?.access_token}`
                    }
                })

                if (response.ok) {
                    const { users: realUsers } = await response.json()
                    // Si on a des utilisateurs, on met à jour.
                    // Même si c'est vide, on met à jour pour effacer les anciens potentiels.
                    if (realUsers) {
                        setUsers(realUsers)
                    }
                } else {
                    console.error('Erreur chargement users API:', response.statusText)
                    toast.error(`Erreur chargement: ${response.statusText} (${response.status})`)
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

    const handleSendBroadcast = async () => {
        if (!notifSubject || !notifMessage) {
            toast.error('Veuillez remplir le sujet et le message')
            return
        }

        const recipientsList = notifTarget === 'selection' ? filteredUsers : users
        // Filter out users without emails (though auth requires it, profiles might not have it synced if bug, but usually ok)
        // Adjust based on your profile schema (assuming auth.users has email, profiles has... wait, profiles table usually stores email or link to auth).
        // WARNING: Profiles table typically might NOT have email column if it relies on Auth. 
        // Let's check `users` mock/real data in `checkAdmin`.
        // `realUsers` are fetched from `profiles`. Does `profiles` have `email`? 
        // `MOCK_USERS` doesn't show email.
        // We might need to fetch emails if not in profiles. 
        // HOWEVER, looking at previous steps (`users` state initialization), it fetches `profiles`.
        // If `profiles` doesn't have email, we can't send.
        // Let's assume `email` is in profiles for now or we need to fix the fetch.

        // Let's verify if `profiles` has email. If not, this is a blocker.
        // The migration `20260110...fix_public_templates` doesn't show profiles. 
        // Usually Supabase `profiles` triggers copy email or we join.
        // Let's assume `email` is present or `user_id` allows fetching (but that's hard from client).

        // BETTER STRATEGY: 
        // If `profiles` table doesn't have email, we should fail or update query?
        // Let's check the `checkAdmin` function line 106: `.select('*')`.
        // If `profiles` lacks email, we are stuck.
        // Let's check `MOCK_USERS` line 27 - no email.

        // I will add a check. If no email, I'll log/alert.
        // BUT, looking at `api/send-custom-email`, it takes `email` (string) or `recipients` (string[]).
        // I'll try to map `u.email`. 

        const emails = recipientsList.map(u => u.email).filter(Boolean)

        if (emails.length === 0) {
            toast.error("Aucune adresse email trouvée pour ces utilisateurs.")
            return
        }

        setIsSending(true)
        setSendingProgress(10) // Start visual progress

        try {
            const { supabase } = await import('@/lib/supabase') as any
            const { data: { session } } = await supabase.auth.getSession()

            const response = await fetch('/api/admin/send-custom-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    recipients: emails,
                    subject: notifSubject,
                    message: notifMessage
                })
            })

            setSendingProgress(80)

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error?.message || 'Erreur lors de l\'envoi')
            }

            setSendingProgress(100)
            toast.success(`Message diffusé à ${emails.length} praticien(s)`)
            setShowNotificationModal(false)
            setNotifSubject('')
            setNotifMessage('')
        } catch (error: any) {
            console.error('Erreur diffusion:', error)
            toast.error('Erreur: ' + error.message)
        } finally {
            setIsSending(false)
            setSendingProgress(0)
        }
    }

    const handleSendCustomEmail = async () => {
        if (!emailTarget || !emailSubject || !emailBody) {
            toast.error('Veuillez remplir tous les champs')
            return
        }

        setIsSendingEmail(true)

        try {
            const { supabase } = await import('@/lib/supabase') as any
            const { data: { session } } = await supabase.auth.getSession()

            const response = await fetch('/api/admin/send-custom-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    email: emailTarget,
                    subject: emailSubject,
                    message: emailBody
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error?.message || 'Erreur lors de l\'envoi')
            }

            toast.success('Email envoyé avec succès !')
            setShowEmailModal(false)
            setEmailTarget('')
            setEmailSubject('')
            setEmailBody('')
        } catch (error: any) {
            console.error('Erreur envoi email:', error)
            toast.error('Erreur: ' + error.message)
        } finally {
            setIsSendingEmail(false)
        }
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

        doc.save(`TopLinkSante_Rapport_${month}_${year}.pdf`)
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
                        <p className="text-gray-500">Gérez les utilisateurs et supervisez l&apos;activité de la plateforme.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowEmailModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg"
                        >
                            <Mail className="w-4 h-4" />
                            Envoyer Email
                        </button>

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

                {/* Bandeau orange - Praticiens sans lien Google */}
                {(() => {
                    const usersWithoutGoogle = users.filter(u => !u.google_review_url)
                    if (usersWithoutGoogle.length === 0) return null
                    return (
                        <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-4 mb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-orange-800">
                                            Terminer votre enregistrement
                                        </p>
                                        <p className="text-sm text-orange-700">
                                            <span className="font-bold">{usersWithoutGoogle.length}</span> praticien(s) n&apos;ont pas configuré leur lien Google Avis
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 max-w-md">
                                    {usersWithoutGoogle.slice(0, 5).map(u => (
                                        <span key={u.id} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full truncate max-w-[120px]" title={u.nom_complet || u.email}>
                                            {u.nom_complet?.split(' ')[0] || u.email?.split('@')[0] || 'N/A'}
                                        </span>
                                    ))}
                                    {usersWithoutGoogle.length > 5 && (
                                        <span className="px-2 py-1 bg-orange-200 text-orange-800 text-xs font-bold rounded-full">
                                            +{usersWithoutGoogle.length - 5}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })()}

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
                            placeholder="Filtrer par Spécialité / Métier..."
                            value={filterSpecialty}
                            onChange={(e) => setFilterSpecialty(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-gray-50/50"
                        />
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <Link
                            href="/admin/messages"
                            className="px-6 py-3 bg-white text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 border border-gray-200 shadow-sm"
                        >
                            <Inbox className="w-4 h-4" />
                            Messagerie
                        </Link>
                        <button
                            onClick={() => setShowNotificationModal(true)}
                            className="w-full md:w-auto px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-900/10"
                        >
                            <Bell className="w-4 h-4" />
                            Diffuser un message
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
                                                        {(user.full_name || user.nom_complet || user.displayName || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900">{user.full_name || user.nom_complet || user.displayName || 'Utilisateur'}</span>
                                                        <span className="text-xs text-gray-400 font-normal">{user.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-gray-600 font-medium">{user.speciality || user.specialite || user.specialty || '—'}</td>
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
                                                <div className="flex items-center justify-end gap-3 opacity-90 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => {
                                                            setEmailTarget(user.email || '')
                                                            setEmailSubject(`Message du support Medi.Link pour Dr. ${user.full_name || user.nom_complet || ''}`)
                                                            setShowEmailModal(true)
                                                        }}
                                                        className="text-gray-400 hover:text-primary transition-colors p-1 hover:bg-blue-50 rounded-full"
                                                        title="Envoyer un email"
                                                    >
                                                        <Mail className="w-4 h-4" />
                                                    </button>
                                                    <button className="text-gray-400 hover:text-primary transition-colors flex items-center gap-1 font-medium text-sm">
                                                        <span>Détails</span>
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                </div>
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
                                    Diffusion de Message (Email)
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
                                            ? `Cible : ${filteredUsers.length} praticien(s) correspondant aux filtres.`
                                            : `Cible : ${users.length} praticien(s) (base complète).`
                                        }
                                        <br />
                                        <span className="font-semibold text-primary">Un email sera envoyé à chaque destinataire.</span>
                                        {notifTarget === 'selection' && (
                                            <span className="block mt-1 text-gray-400 italic">
                                                (Astuce : Utilisez les filtres &quot;Spécialité / Métier&quot; de la page pour affiner cette sélection)
                                            </span>
                                        )}
                                    </p>
                                </div>

                                {/* Sujet */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sujet de l&apos;email</label>
                                    <input
                                        type="text"
                                        value={notifSubject}
                                        onChange={(e) => setNotifSubject(e.target.value)}
                                        placeholder="Ex: Nouveauté sur la plateforme..."
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
                                {isSending && (
                                    <div className="mt-4">
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>Diffusion en cours...</span>
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
                                    onClick={handleSendBroadcast}
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

                {/* Modal Email Personnalisé */}
                {showEmailModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-primary" />
                                    Envoyer un email
                                </h2>
                                <button
                                    onClick={() => setShowEmailModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-900 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Destinataire */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email du destinataire</label>
                                    <input
                                        type="email"
                                        value={emailTarget}
                                        onChange={(e) => setEmailTarget(e.target.value)}
                                        placeholder="exemple@email.com"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>

                                {/* Sujet */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
                                    <input
                                        type="text"
                                        value={emailSubject}
                                        onChange={(e) => setEmailSubject(e.target.value)}
                                        placeholder="Sujet de votre email..."
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                    <textarea
                                        value={emailBody}
                                        onChange={(e) => setEmailBody(e.target.value)}
                                        placeholder="Votre message ici..."
                                        rows={6}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                                    />
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowEmailModal(false)}
                                    disabled={isSendingEmail}
                                    className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSendCustomEmail}
                                    disabled={isSendingEmail || !emailTarget || !emailSubject || !emailBody}
                                    className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSendingEmail ? (
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
        </div >
    )
}
