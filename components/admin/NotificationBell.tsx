'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Check, Trash2, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

type Notification = {
    id: string
    created_at: string
    message: string
    is_read: boolean
    type: string
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Initial Fetch & Realtime Subscription
    useEffect(() => {
        let mounted = true
        let channel: any = null

        const fetchNotifications = async () => {
            try {
                const { supabase } = await import('@/lib/supabase') as any

                // Fetch existing (Top 10 latest)
                const { data, error } = await supabase
                    .from('notifications')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(10)

                if (error) throw error
                if (mounted && data) {
                    setNotifications(data)
                    setUnreadCount(data.filter((n: Notification) => !n.is_read).length)
                }

                // Subscribe to changes
                channel = supabase
                    .channel('admin-notifications')
                    .on(
                        'postgres_changes',
                        { event: 'INSERT', schema: 'public', table: 'notifications' },
                        (payload: any) => {
                            const newNotif = payload.new as Notification

                            // Visual Alert (Toast)
                            toast((t) => (
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 p-2 rounded-full text-primary">
                                        <Bell size={18} />
                                    </div>
                                    <div className="text-sm font-medium text-gray-900">
                                        {newNotif.message}
                                    </div>
                                </div>
                            ), { position: 'top-right', duration: 5000 })

                            // Update State
                            setNotifications(prev => [newNotif, ...prev])
                            setUnreadCount(prev => prev + 1)
                        }
                    )
                    .subscribe()

            } catch (error) {
                console.error('Error fetching notifications:', error)
            }
        }

        fetchNotifications()

        // Cleanup
        return () => {
            mounted = false
            if (channel) {
                import('@/lib/supabase').then(({ supabase }) => {
                    supabase.removeChannel(channel)
                })
            }
        }
    }, [])

    // Click Outside Handling
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleMarkAsRead = async (id: string, event: React.MouseEvent) => {
        event.stopPropagation()
        try {
            const { supabase } = await import('@/lib/supabase') as any
            await supabase.from('notifications').update({ is_read: true }).eq('id', id)

            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (error) {
            console.error('Error marking as read:', error)
        }
    }

    const handleMarkAllRead = async () => {
        try {
            const { supabase } = await import('@/lib/supabase') as any
            await supabase.from('notifications').update({ is_read: true }).eq('is_read', false)

            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
            setUnreadCount(0)
            toast.success('Toutes les notifications marquées comme lues')
        } catch (error) {
            console.error('Error marking all read:', error)
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
                aria-label="Notifications"
            >
                <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-gray-900' : 'text-gray-500'}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-primary font-medium hover:text-primary-dark hover:underline"
                            >
                                Tout marquer comme lu
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                Aucune notification pour le moment
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={`p-4 hover:bg-gray-50 transition-colors flex gap-3 ${notif.is_read ? 'opacity-60' : 'bg-blue-50/30'}`}
                                    >
                                        <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${notif.is_read ? 'bg-transparent' : 'bg-primary'}`} />
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-800 leading-relaxed">
                                                {notif.message}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(notif.created_at).toLocaleString('fr-FR', {
                                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        {!notif.is_read && (
                                            <button
                                                onClick={(e) => handleMarkAsRead(notif.id, e)}
                                                className="text-gray-400 hover:text-primary self-start transition-colors"
                                                title="Marquer comme lu"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
