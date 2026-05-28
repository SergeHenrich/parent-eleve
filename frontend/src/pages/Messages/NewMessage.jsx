import React, { useState } from 'react'
import Card from '../../components/UI/Card'
import Button from '../../components/UI/Button'
import FormInput from '../../components/UI/FormInput'
import { messagesAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { Send } from 'lucide-react'

export default function NewMessage() {
  const [formData, setFormData] = useState({
    destinataire_id: '',
    sujet: '',
    contenu: '',
    eleve_concerne_id: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({...prev, [name]: value}))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await messagesAPI.send(formData)
      toast.success('Message envoyé avec succès')
      setFormData({ destinataire_id: '', sujet: '', contenu: '', eleve_concerne_id: '' })
    } catch (error) {
      toast.error('Erreur lors de l\'envoi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
        <Send className="w-8 h-8 text-blue-600" />
        Nouveau message
      </h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Destinataire"
            name="destinataire_id"
            type="number"
            value={formData.destinataire_id}
            onChange={handleChange}
            error={errors.destinataire_id}
            required
            placeholder="ID du destinataire"
          />

          <FormInput
            label="Sujet"
            name="sujet"
            value={formData.sujet}
            onChange={handleChange}
            error={errors.sujet}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              name="contenu"
              value={formData.contenu}
              onChange={handleChange}
              rows="6"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Écrivez votre message ici..."
            />
          </div>

          <div className="flex gap-2">
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Envoi en cours...' : 'Envoyer'}
            </Button>
            <Button variant="secondary" type="button" onClick={() => window.history.back()}>
              Annuler
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
