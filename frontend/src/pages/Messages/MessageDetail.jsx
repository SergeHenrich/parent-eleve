import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '../../components/UI/Card'
import Badge from '../../components/UI/Badge'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import Alert from '../../components/UI/Alert'
import Button from '../../components/UI/Button'
import { messagesAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { ArrowLeft, Trash2, Reply, Mail, User, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function MessageDetail() {
  const { messageId } = useParams()
  const navigate = useNavigate()
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMessage()
  }, [messageId])

  const loadMessage = async () => {
    try {
      const response = await messagesAPI.getById(messageId)
      setMessage(response.data.message)
    } catch (error) {
      toast.error('Erreur lors du chargement du message')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer ce message ?')) return
    try {
      await messagesAPI.deleteMessage(messageId)
      toast.success('Message supprimé')
      navigate('/messages')
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleReply = () => {
    navigate('/messages/new', {
      state: {
        destinataire_id: message.expediteur.id,
        sujet: `Re: ${message.sujet}`
      }
    })
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!message) {
    return <Alert type="error" message="Message non trouvé" />
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/messages')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{message.sujet}</h1>
            {!message.lu && <Badge variant="info">Non lu</Badge>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleReply}>
            <Reply className="w-4 h-4 inline mr-1" /> Répondre
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 inline mr-1" /> Supprimer
          </Button>
        </div>
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="p-3 bg-blue-100 rounded-full">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900">
              {message.expediteur.prenom} {message.expediteur.nom}
            </p>
            <p className="text-sm text-gray-500 capitalize">
              {message.expediteur.role === 'admin' ? 'Administration' : message.expediteur.role}
              {message.expediteur.email && <> &middot; {message.expediteur.email}</>}
            </p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(new Date(message.created_at), 'dd/MM/yyyy HH:mm')}
            </div>
            {message.date_lecture && (
              <p>Lu le {format(new Date(message.date_lecture), 'dd/MM/yyyy HH:mm')}</p>
            )}
          </div>
        </div>

        <div className="prose max-w-none">
          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{message.contenu}</p>
        </div>

        {message.eleve_concerne && (
          <div className="mt-6 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Élève concerné:</strong> {message.eleve_concerne.prenom} {message.eleve_concerne.nom}
              {message.eleve_concerne.classe && <> ({message.eleve_concerne.classe})</>}
            </p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t">
          <p className="text-xs text-gray-500">
            Destinataire: {message.destinataire.prenom} {message.destinataire.nom}
            {' '}({message.destinataire.role === 'admin' ? 'Administration' : message.destinataire.role})
          </p>
        </div>
      </Card>
    </div>
  )
}
