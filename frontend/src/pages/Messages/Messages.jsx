import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../components/UI/Card'
import Badge from '../../components/UI/Badge'
import Button from '../../components/UI/Button'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import Alert from '../../components/UI/Alert'
import { messagesAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { MessageSquare, Plus } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function Messages() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadMessages()
  }, [filter])

  const loadMessages = async () => {
    try {
      setLoading(true)
      const response = await messagesAPI.getMessages({ type: filter })
      setMessages(response.data.messages || [])
    } catch (error) {
      toast.error('Erreur lors du chargement des messages')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (messageId) => {
    try {
      await messagesAPI.markAsRead(messageId)
      loadMessages()
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du message')
    }
  }

  const deleteMessage = async (messageId) => {
    try {
      await messagesAPI.deleteMessage(messageId)
      toast.success('Message supprimé')
      loadMessages()
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            Messagerie
          </h1>
          <p className="text-gray-600 mt-2">Communiquez avec l'établissement</p>
        </div>
        <Button 
          variant="primary"
          onClick={() => navigate('/messages/new')}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Nouveau message
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'received', 'sent', 'unread'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {f === 'all' ? 'Tous' : f === 'received' ? 'Reçus' : f === 'sent' ? 'Envoyés' : 'Non lus'}
          </button>
        ))}
      </div>

      {/* Messages */}
      {messages.length > 0 ? (
        <div className="space-y-3">
          {messages.map(msg => (
            <Card key={msg.id} className={`${!msg.lu ? 'border-l-4 border-blue-600 bg-blue-50' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">{msg.sujet}</h3>
                    {!msg.lu && <Badge variant="info">Non lu</Badge>}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    De: {msg.expediteur_nom} | À: {msg.destinataire_nom}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(msg.created_at), { locale: fr, addSuffix: true })}
                  </p>
                  <p className="text-gray-700 mt-3 line-clamp-2">{msg.contenu}</p>
                </div>
                <div className="flex gap-2">
                  {!msg.lu && (
                    <button
                      onClick={() => markAsRead(msg.id)}
                      className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Marquer lu
                    </button>
                  )}
                  <button
                    onClick={() => deleteMessage(msg.id)}
                    className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Alert type="info" message="Aucun message pour le moment" />
      )}
    </div>
  )
}
