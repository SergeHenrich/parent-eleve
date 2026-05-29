import React, { useState, useEffect } from 'react'
import Card from '../../components/UI/Card'
import Badge from '../../components/UI/Badge'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import Alert from '../../components/UI/Alert'
import { notificationsAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { Bell } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function Notifications() {
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')

    useEffect(() => {
        loadNotifications()
    }, [filter])

    const loadNotifications = async () => {
        try {
            setLoading(true)
            const response = await notificationsAPI.getNotifications({
                lu: filter === 'unread' ? 'false' : undefined
            })
            setNotifications(response.data.notifications || [])
        } catch (error) {
            toast.error('Erreur lors du chargement des notifications')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const markAsRead = async (notificationId) => {
        try {
            await notificationsAPI.markAsRead(notificationId)
            loadNotifications()
        } catch (error) {
            toast.error('Erreur lors de la mise à jour')
        }
    }

    const getTypeColor = (type) => {
        const colors = {
            absence: 'error',
            note: 'success',
            message: 'info',
            reunion: 'warning',
            general: 'gray'
        }
        return colors[type] || 'gray'
    }

    if (loading) {
        return <LoadingSpinner />
    }

    const unreadCount = notifications.filter(n => !n.lu).length

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <Bell className="w-8 h-8 text-blue-600" />
                    Notifications
                </h1>
                <p className="text-gray-600 mt-2">
                    {unreadCount > 0 ? `${unreadCount} notification(s) non lue(s)` : 'Toutes les notifications lues'}
                </p>
            </div>

            {/* Filtres */}
            <div className="flex gap-2 flex-wrap">
                {['all', 'unread'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg transition-colors ${filter === f
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        {f === 'all' ? 'Toutes' : 'Non lues'}
                    </button>
                ))}
            </div>

            {/* Notifications */}
            {notifications.length > 0 ? (
                <div className="space-y-3">
                    {notifications.map(notif => (
                        <Card
                            key={notif.id}
                            className={`${!notif.lu ? 'border-l-4 border-blue-600 bg-blue-50' : ''} hover:shadow-lg transition-shadow`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-gray-900">{notif.titre}</h3>
                                        <Badge variant={getTypeColor(notif.type)}>
                                            {notif.type}
                                        </Badge>
                                        {!notif.lu && <Badge variant="info">Nouvelle</Badge>}
                                    </div>
                                    <p className="text-gray-700 mt-2">{notif.message}</p>
                                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                        <span>
                                            {formatDistanceToNow(new Date(notif.created_at), {
                                                locale: fr,
                                                addSuffix: true
                                            })}
                                        </span>
                                        {notif.envoye_sms && (
                                            <span className="flex items-center gap-1">📱 SMS envoyé</span>
                                        )}
                                        {notif.envoye_email && (
                                            <span className="flex items-center gap-1">📧 Email envoyé</span>
                                        )}
                                    </div>
                                </div>
                                {!notif.lu && (
                                    <button
                                        onClick={() => markAsRead(notif.id)}
                                        className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap"
                                    >
                                        Marquer lu
                                    </button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Alert type="success" message="Aucune notification pour le moment" />
            )}
        </div>
    )
}
